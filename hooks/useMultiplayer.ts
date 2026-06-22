import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MultiplayerGameState, RoomSettings, ChatMessage, MultiplayerPlayer } from '../types';

const params = new URLSearchParams(window.location.search);
const isDiscord = params.has('frame_id') || params.has('instance_id') || window.location.search.includes('platform=') || window.location.hostname.includes('discordsays.com');

const SERVER_URL = isDiscord
    ? window.location.origin + '/server'
    : (import.meta.env.VITE_SERVER_URL || 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:3001'
          : window.location.origin + '/server'));

const loadSavedSettings = () => {
    let savedSettings = { rounds: 3, hp: 9, itemsPerShipment: 9, isPrivate: false, isAdvanced: false };
    try {
        const saved = localStorage.getItem('aadish_roulette_last_lobby_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
                savedSettings = {
                    rounds: parsed.rounds !== undefined ? parsed.rounds : 3,
                    hp: parsed.hp !== undefined ? parsed.hp : 9,
                    itemsPerShipment: parsed.itemsPerShipment !== undefined ? parsed.itemsPerShipment : 9,
                    isPrivate: parsed.isPrivate !== undefined ? parsed.isPrivate : false,
                    isAdvanced: false
                };
            }
        }
    } catch (e) {
        console.error("Failed to load saved settings:", e);
    }
    return savedSettings;
};

const getAuthId = (): string | null => {
    try {
        const saved = localStorage.getItem('aadish_roulette_logged_in_user');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed?.username?.trim().toLowerCase() || null;
        }
    } catch (e) {}
    return null;
};

export function useMultiplayer() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [room, setRoom] = useState<any>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const connectionAttemptsRef = useRef(0);

    // Callback for incoming actions
    const onActionRef = useRef<((data: { playerId: string, action: any }) => void) | null>(null);
    const setOnAction = useCallback((callback: (data: { playerId: string, action: any }) => void) => {
        onActionRef.current = callback;
    }, []);

    const connect = useCallback(() => {
        // Prevent socket leaks if connect is called while already connected
        if (socket) {
            socket.disconnect();
        }
        setIsConnecting(true);
        setError(null);
        setConnectionStatus('ESTABLISHING LINK...');
        connectionAttemptsRef.current = 0;

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let socketUrl = '';
        let socketPath = '/socket.io';

        if (isLocal) {
            socketUrl = 'http://localhost:3001';
            socketPath = '/socket.io';
        } else if (isDiscord) {
            socketUrl = window.location.origin;
            socketPath = '/server/socket.io';
        } else {
            socketUrl = 'https://yoakatsuki-buckshot.hf.space';
            socketPath = '/socket.io';
        }

        const newSocket = io(socketUrl, {
            reconnectionAttempts: 15,
            reconnectionDelay: 3000,
            timeout: 10000,
            path: socketPath,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            setIsConnecting(false);
            setSocket(newSocket);
            setError(null);
            setConnectionStatus('');
            connectionAttemptsRef.current = 0;
        });

        newSocket.on('connect_error', () => {
            connectionAttemptsRef.current += 1;
            if (connectionAttemptsRef.current >= 5) {
                setError('Server is offline. Waking up server, please refresh after 1 min.');
                setIsConnecting(false);
                setConnectionStatus('');
                newSocket.disconnect();
            } else {
                setConnectionStatus(`WAKING UP SERVER... (ATTEMPT ${connectionAttemptsRef.current}/5)`);
            }
        });

        newSocket.on('joinedRoom', ({ room, playerId }) => {
            setRoom(room);
            setPlayerId(playerId);
            setMessages(room.messages || []);
        });

        newSocket.on('roomUpdated', (updatedRoom) => {
            setRoom(updatedRoom);
        });

        newSocket.on('chatMessageReceived', (msg: ChatMessage) => {
            setMessages(prev => [...prev, msg].slice(-50));
        });

        newSocket.on('gameActionReceived', (data: { playerId: string, action: any }) => {
            if (onActionRef.current) {
                onActionRef.current(data);
            }
        });

        newSocket.on('kicked', () => {
            setError('You were kicked from the room.');
            setRoom(null);
            setPlayerId(null);
        });

        newSocket.on('error', (err: string) => {
            setError(err);
        });

        return newSocket;
    }, []);

    const disconnect = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            setConnectionStatus('');
            connectionAttemptsRef.current = 0;
            setRoom(null);
        }
    }, [socket]);

    useEffect(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [socket]);

    const joinRoom = (roomId: string, playerName: string) => {
        socket?.emit('joinRoom', { roomId, playerName, authId: getAuthId() });
    };

    const createRoom = (playerName: string) => {
        const savedSettings = loadSavedSettings();
        socket?.emit('createRoom', { playerName, settings: savedSettings, authId: getAuthId() });
    };

    const quickJoin = (playerName: string) => {
        const savedSettings = loadSavedSettings();
        socket?.emit('quickJoin', { playerName, settings: savedSettings, authId: getAuthId() });
    };

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const updateSettings = (roomId: string, settings: RoomSettings) => {
        try {
            const settingsToSave = { ...settings, isAdvanced: false };
            localStorage.setItem('aadish_roulette_last_lobby_settings', JSON.stringify(settingsToSave));
        } catch (e) {
            console.error("Failed to save settings:", e);
        }
        socket?.emit('updateSettings', { roomId, settings });
    };

    const readyUp = (roomId: string, ready: boolean) => {
        socket?.emit('readyUp', { roomId, ready });
    };

    const startGame = (roomId: string, gameData: any) => {
        socket?.emit('startGame', { roomId, gameData });
    };

    const sendMessage = (roomId: string, message: string) => {
        socket?.emit('chatMessage', { roomId, message });
    };

    const sendAction = (roomId: string, action: any) => {
        socket?.emit('gameAction', { roomId, action });
    };

    const kickPlayer = (roomId: string, targetPlayerId: string) => {
        socket?.emit('kickPlayer', { roomId, targetPlayerId });
    };

    const resetRoomState = (roomId: string) => {
        socket?.emit('resetRoomState', { roomId });
    };

    const getActiveRooms = useCallback(async () => {
        try {
            const res = await fetch(`${SERVER_URL}/active-rooms`);
            if (!res.ok) throw new Error('Failed to fetch active rooms');
            return await res.json();
        } catch (err) {
            console.error("Error fetching active rooms:", err);
            return [];
        }
    }, []);

    return {
        socket,
        room,
        playerId,
        error,
        isConnected,
        isConnecting,
        connectionStatus,
        messages,
        connect,
        disconnect,
        joinRoom,
        createRoom,
        quickJoin,
        clearError,
        kickPlayer,
        resetRoomState,
        getActiveRooms,
        updateSettings,
        readyUp,
        startGame,
        sendMessage,
        sendAction,
        setOnAction
    };
}
