import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

export type MPPlayer = {
    id: string;
    name: string;
    ready: boolean;
    isHost: boolean;
};

export type ChatMessage = {
    sender: string;
    text: string;
    timestamp: number;
};

export const useSocket = (playerName: string, onConnect: () => void, onError: (msg: string) => void, onGameStart?: () => void) => {
    const socketRef = useRef<Socket | null>(null);
    const [players, setPlayers] = useState<MPPlayer[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [hostSettings, setHostSettings] = useState<{ rounds: number, items: number, health: number } | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current) return;

        if (!playerName) {
            console.error("No player name provided to useSocket. Aborting connection.");
            return;
        }

        console.log("Attempting socket connection to:", SERVER_URL);
        const socket = io(SERVER_URL, {
            transports: ['websocket'],
            reconnection: false, // Don't auto-reconnect if kicked
            timeout: 2000 // Fail after 2s
        });

        const handleJoin = () => {
            console.log("Connected to server. Emitting join_game for:", playerName);
            socket.emit('join_game', { name: playerName });
        };

        if (socket.connected) {
            handleJoin();
        } else {
            socket.on('connect', handleJoin);
        }

        socket.on('connect_error', (err) => {
            console.error("Connection failed:", err);
            onError("SERVER UNAVAILABLE");
            socket.disconnect();
        });

        socket.on('error_message', ({ message }) => {
            onError(message);
            socket.disconnect();
        });

        socket.on('joined_successfully', (data) => {
            console.log("Joined successfully!", data);
            setIsConnected(true);
            setIsHost(data.isHost);
            setPlayers(data.players);
            onConnect();
        });

        socket.on('player_update', (updatedPlayers) => {
            console.log("Player Update Received:", updatedPlayers);
            setPlayers(updatedPlayers);
            // Re-check host status in case host left and we became host
            const me = updatedPlayers.find((p: any) => p.name === playerName.toUpperCase());
            if (me) setIsHost(me.isHost);
        });

        socket.on('receive_message', (msg) => {
            setMessages(prev => [...prev.slice(-19), msg]); // Keep last 20
        });

        socket.on('settings_update', (newSettings) => {
            setHostSettings(newSettings);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('game_started', () => {
            if (onGameStart) onGameStart();
        });

        socketRef.current = socket;
    }, [playerName, onConnect, onError, onGameStart]);

    const failHelper = (msg: string) => onError(msg);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const toggleReady = () => socketRef.current?.emit('toggle_ready');
    const updateSettings = (s: any) => socketRef.current?.emit('update_settings', s);
    const sendMessage = (text: string) => socketRef.current?.emit('send_message', text);
    const startGame = () => socketRef.current?.emit('start_game');

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        connect,
        disconnect,
        isConnected,
        isHost,
        players,
        messages,
        hostSettings,
        toggleReady,
        updateSettings,
        sendMessage,
        startGame
    };
};
