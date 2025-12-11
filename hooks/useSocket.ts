import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

export type MPPlayer = {
    id: string;
    name: string;
    ready: boolean;
    isHost: boolean;
    hp: number;
    maxHp: number;
    items: string[];
    isHandcuffed: boolean;
    isSawedActive: boolean;
    position: number;
    isAlive?: boolean;
};

export type ChatMessage = {
    sender: string;
    senderId?: string;
    text: string;
    timestamp: number;
};

export type GameStateData = {
    chamber?: string[];
    currentShellIndex: number;
    liveCount: number;
    blankCount: number;
    currentTurnPlayerId: string | null;
    playerOrder: string[];
    roundNumber: number;
    players: { [id: string]: MPPlayer };
};

export type GameOverData = {
    winnerId: string;
    winnerName: string;
    message: string;
};

export const useSocket = (
    playerName: string,
    onConnect: () => void,
    onError: (msg: string) => void,
    onGameStart?: () => void
) => {
    const socketRef = useRef<Socket | null>(null);
    const [players, setPlayers] = useState<MPPlayer[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [hostSettings, setHostSettings] = useState<{ rounds: number, items: number, health: number } | null>(null);

    // Game state
    const [gameStateData, setGameStateData] = useState<GameStateData | null>(null);
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
    const [knownShell, setKnownShell] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<any>(null);

    // Loot overlay
    const [receivedLoot, setReceivedLoot] = useState<string[]>([]);
    const [showLootOverlay, setShowLootOverlay] = useState(false);
    const [roundInfo, setRoundInfo] = useState<{ liveCount: number; blankCount: number; roundNumber: number } | null>(null);

    // Game over
    const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

    // Announcements
    const [announcement, setAnnouncement] = useState<string | null>(null);

    // Other player actions
    const [playerGrabbing, setPlayerGrabbing] = useState<{ playerId: string; playerName: string } | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current) return;
        if (!playerName) return;

        const socket = io(SERVER_URL, {
            transports: ['websocket'],
            reconnection: false,
            timeout: 2000
        });

        const handleJoin = () => {
            socket.emit('join_game', { name: playerName });
        };

        if (socket.connected) handleJoin();
        else socket.on('connect', handleJoin);

        socket.on('connect_error', () => {
            onError("SERVER UNAVAILABLE");
            socket.disconnect();
        });

        socket.on('error_message', ({ message }) => {
            onError(message);
        });

        socket.on('joined_successfully', (data) => {
            setMyPlayerId(data.playerId);
            setIsConnected(true);
            setIsHost(data.isHost);
            setPlayers(data.players);
            onConnect();
        });

        socket.on('player_update', (updatedPlayers) => {
            setPlayers(updatedPlayers);
            const me = updatedPlayers.find((p: any) => p.id === myPlayerId || p.name === playerName.toUpperCase());
            if (me) setIsHost(me.isHost);
        });

        socket.on('receive_message', (msg) => {
            setMessages(prev => [...prev.slice(-50), msg]);
        });

        socket.on('settings_update', setHostSettings);
        socket.on('disconnect', () => setIsConnected(false));

        socket.on('game_started', (data) => {
            setGameOverData(null);
            if (onGameStart) onGameStart();
        });

        // Game init
        socket.on('game_init', (data) => {
            setAnnouncement(`FIRST TURN: ${data.firstPlayerName}`);
            setTimeout(() => setAnnouncement(null), 3000);
        });

        // Round announcement
        socket.on('round_announcement', (data) => {
            setRoundInfo(data);
            setAnnouncement(`ROUND ${data.roundNumber} - ${data.liveCount} LIVE | ${data.blankCount} BLANK`);
            setTimeout(() => setAnnouncement(null), 3000);
        });

        // Loot received
        socket.on('loot_received', (data) => {
            setReceivedLoot(data.items);
            setShowLootOverlay(true);
            setTimeout(() => {
                setShowLootOverlay(false);
                setReceivedLoot([]);
            }, 3500);
        });

        socket.on('loot_announcement', () => {
            // Already handled by loot_received
        });

        // Game state updates
        socket.on('round_start', (state: GameStateData) => {
            setGameStateData(state);
            setKnownShell(null);
        });

        socket.on('state_update', setGameStateData);
        socket.on('turn_update', setGameStateData);

        // Turn announcement
        socket.on('turn_announcement', (data) => {
            setAnnouncement(`${data.playerName}'S TURN`);
            setTimeout(() => setAnnouncement(null), 2000);
        });

        // Player actions
        socket.on('player_action', (action) => {
            setLastAction(action);
            if (action.message) {
                setAnnouncement(action.message);
                setTimeout(() => setAnnouncement(null), 2000);
            }
            setTimeout(() => setLastAction(null), 3000);
        });

        socket.on('item_effect', (effect) => {
            setLastAction({ type: 'item', ...effect });
            if (effect.message) {
                setAnnouncement(effect.message);
                setTimeout(() => setAnnouncement(null), 2000);
            }
            setTimeout(() => setLastAction(null), 2000);
        });

        socket.on('shell_revealed', ({ shell }) => {
            setKnownShell(shell);
            setTimeout(() => setKnownShell(null), 5000);
        });

        socket.on('action_message', ({ message }) => {
            setAnnouncement(message);
            setTimeout(() => setAnnouncement(null), 2000);
        });

        socket.on('player_eliminated', ({ playerName, message }) => {
            setAnnouncement(message || `${playerName} ELIMINATED!`);
            setTimeout(() => setAnnouncement(null), 3000);
        });

        socket.on('player_cuffed_skip', ({ playerName }) => {
            setAnnouncement(`${playerName} CUFFED - SKIPPING!`);
            setTimeout(() => setAnnouncement(null), 2000);
        });

        // Other player grabbing gun
        socket.on('player_grabbing', (data) => {
            setPlayerGrabbing(data);
            setTimeout(() => setPlayerGrabbing(null), 1500);
        });

        // Game over
        socket.on('game_over', (data: GameOverData) => {
            setGameOverData(data);
            setAnnouncement(data.message);
        });

        // Restart
        socket.on('game_restart', () => {
            setGameStateData(null);
            setGameOverData(null);
            setAnnouncement(null);
        });

        socket.on('player_disconnected', ({ playerName }) => {
            setAnnouncement(`${playerName} DISCONNECTED`);
            setTimeout(() => setAnnouncement(null), 2000);
        });

        socketRef.current = socket;
    }, [playerName, onConnect, onError, onGameStart, myPlayerId]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsConnected(false);
        setGameStateData(null);
        setGameOverData(null);
    }, []);

    const toggleReady = () => socketRef.current?.emit('toggle_ready');
    const updateSettings = (s: any) => socketRef.current?.emit('update_settings', s);
    const sendMessage = (text: string) => socketRef.current?.emit('send_message', text);
    const startGame = () => socketRef.current?.emit('start_game');

    const shootPlayer = (targetId: string) => {
        socketRef.current?.emit('player_shoot', { targetId });
    };

    const useItem = (itemIndex: number) => {
        socketRef.current?.emit('use_item', { itemIndex });
    };

    const grabGun = () => {
        socketRef.current?.emit('player_grab_gun');
    };

    const requestRestart = () => {
        socketRef.current?.emit('request_restart');
    };

    useEffect(() => {
        return () => disconnect();
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
        startGame,
        // Game data
        gameStateData,
        myPlayerId,
        knownShell,
        lastAction,
        shootPlayer,
        useItem,
        grabGun,
        // Loot
        roundInfo,
        receivedLoot,
        showLootOverlay,
        // Game over
        gameOverData,
        requestRestart,
        // Announcements
        announcement,
        playerGrabbing
    };
};
