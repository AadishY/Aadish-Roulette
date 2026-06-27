import React, { useState, useEffect } from 'react';
import { Users, Plus, Key, ArrowLeft, Swords, AlertTriangle, RefreshCw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface MultiplayerSelectionProps {
    playerName: string;
    onQuickJoin: () => void;
    onCreateRoom: () => void;
    onJoinRoom: (roomId: string) => void;
    onBack: () => void;
    error: string | null;
    clearError: () => void;
    isConnecting: boolean;
    getActiveRooms?: () => Promise<any[]>;
}

export const MultiplayerSelection: React.FC<MultiplayerSelectionProps> = ({
    playerName,
    onQuickJoin,
    onCreateRoom,
    onJoinRoom,
    onBack,
    error,
    clearError,
    isConnecting,
    getActiveRooms
}) => {
    const [roomCode, setRoomCode] = useState('');
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [activeRooms, setActiveRooms] = useState<any[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const hScale = Math.min(1, (window.innerHeight - 20) / 640);
            const wScale = Math.min(1, (window.innerWidth - 20) / 980);
            let newScale = Math.min(hScale, wScale);
            newScale = Math.max(newScale, 0.4);
            setScale(newScale);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Clear errors when this screen mounts
        clearError();
    }, [clearError]);

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length === 4) {
            audioManager.playSound('click');
            onJoinRoom(roomCode);
        }
    };

    const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and max 4 digits
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        setRoomCode(val);
        if (error) clearError();
    };

    const handleOpenBrowser = async () => {
        setIsBrowserOpen(true);
        await fetchRooms();
    };

    const fetchRooms = async () => {
        if (!getActiveRooms) return;
        setIsLoadingRooms(true);
        try {
            const roomsList = await getActiveRooms();
            setActiveRooms(roomsList || []);
        } catch (e) {
            console.error("Error fetching rooms in browser:", e);
        } finally {
            setIsLoadingRooms(false);
        }
    };

    return (
        <div 
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
            className="flex flex-col w-[960px] h-[600px] shrink-0 bg-stone-950/90 backdrop-blur-md border-2 border-cyan-500/20 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.15)] animate-in zoom-in-95 duration-500 font-mono text-stone-300 relative"
        >
            {/* Header */}
            <div className="p-5 border-b border-stone-850 bg-stone-900/20 flex justify-between items-center relative">
                {/* Visual Accent Ticks */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-cyan-500/40" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-cyan-500/40" />

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            audioManager.playSound('click');
                            onBack();
                        }} 
                        className="p-2 hover:bg-stone-900 border border-stone-800 hover:border-cyan-500/50 text-stone-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
                        title="Return to Menu"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-widest uppercase text-white flex items-center gap-2">
                            <Swords size={20} className="text-cyan-400 animate-pulse" />
                            MULTIPLAYER PROTOCOL
                        </h1>
                        <p className="text-[10px] text-stone-500 tracking-wider uppercase mt-0.5">
                            AGENT IDENTITY: <span className="text-cyan-500 font-bold">{playerName}</span>
                        </p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-cyan-950/20 border border-cyan-900/30 rounded text-cyan-400 text-[10px] font-bold uppercase tracking-wider block">
                    PROT_VER: v2.5.0
                </div>
            </div>

            {/* Content Options */}
            <div className="flex-1 p-6 flex flex-row gap-5 justify-center items-stretch overflow-hidden">
                
                {/* Quick Join Card */}
                <div className="flex-1 border border-stone-850 hover:border-cyan-500/35 bg-stone-900/10 hover:bg-cyan-950/5 p-6 rounded-xl flex flex-col justify-between transition-all duration-300 transform hover:scale-[1.01] group relative">
                    <div className="space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-cyan-950/30 border border-cyan-800/30 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-widest uppercase">QUICK MATCH</h2>
                            <p className="text-[10px] text-stone-500 uppercase leading-relaxed mt-2 tracking-wide">
                                Scan active nodes and join the first available simulation queue. Auto-creates a new corridor if no matches are active.
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex flex-row gap-3">
                        <button
                            onClick={() => {
                                audioManager.playSound('click');
                                onQuickJoin();
                            }}
                            disabled={isConnecting}
                            className="flex-1 py-3 bg-cyan-955/45 hover:bg-cyan-900/70 border border-cyan-800 hover:border-cyan-400 text-cyan-400 hover:text-white font-black text-xs tracking-widest rounded-xl transition-all cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : null}
                            <span>QUICK JOIN</span>
                        </button>
                        <button
                            onClick={() => {
                                audioManager.playSound('click');
                                handleOpenBrowser();
                            }}
                            disabled={isConnecting}
                            className="flex-1 py-3 bg-stone-900/60 hover:bg-cyan-950/20 border border-stone-850 hover:border-cyan-800 text-stone-400 hover:text-cyan-400 font-black text-xs tracking-widest rounded-xl transition-all cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <span>SHOW ROOMS</span>
                        </button>
                    </div>
                </div>

                {/* Create Room Card */}
                <div className="flex-1 border border-stone-850 hover:border-cyan-500/35 bg-stone-900/10 hover:bg-cyan-955/5 p-6 rounded-xl flex flex-col justify-between transition-all duration-300 transform hover:scale-[1.01] group relative">
                    <div className="space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-cyan-950/30 border border-cyan-800/30 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-widest uppercase">HOST STAGE</h2>
                            <p className="text-[10px] text-stone-500 uppercase leading-relaxed mt-2 tracking-wide">
                                Establish a secured private match cluster. Generates a unique 4-digit communication code to broadcast to your contact.
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => {
                            audioManager.playSound('click');
                            onCreateRoom();
                        }}
                        disabled={isConnecting}
                        className="mt-6 w-full py-3 bg-cyan-955/45 hover:bg-cyan-900/70 border border-cyan-800 hover:border-cyan-400 text-cyan-400 hover:text-white font-black text-xs tracking-widest rounded-xl transition-all cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : null}
                        <span>ESTABLISH LOBBY</span>
                    </button>
                </div>

                {/* Join Room Card */}
                <div className="flex-1 border border-stone-850 hover:border-cyan-500/35 bg-stone-900/10 hover:bg-cyan-955/5 p-6 rounded-xl flex flex-col justify-between transition-all duration-300 transform hover:scale-[1.01] group relative">
                    <div className="space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-cyan-950/30 border border-cyan-800/30 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                            <Key size={24} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-widest uppercase">JOIN LOBBY</h2>
                            <p className="text-[10px] text-stone-500 uppercase leading-relaxed mt-2 tracking-wide">
                                Access an established corridor via a specific 4-digit code. Ensure your coordinates are exact.
                            </p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleJoinSubmit} className="mt-4 space-y-3">
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-cyan-600 font-bold text-sm select-none">[</span>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={handleRoomCodeChange}
                                placeholder="ROOM CODE"
                                className="w-full bg-stone-950 border border-stone-800 hover:border-stone-700 focus:border-cyan-500/60 px-6 py-2.5 text-center text-sm font-bold tracking-[0.4em] uppercase rounded-lg outline-none transition-all placeholder-stone-700 text-cyan-400"
                                required
                            />
                            <span className="absolute right-3 text-cyan-600 font-bold text-sm select-none">]</span>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isConnecting || roomCode.length !== 4}
                            className="w-full py-3 bg-cyan-500 text-black disabled:bg-stone-900 disabled:text-stone-600 disabled:border-stone-850 border border-cyan-400 font-black text-xs tracking-widest rounded-xl transition-all cursor-pointer active:scale-98 shadow-[0_0_20px_rgba(6,182,212,0.15)] disabled:shadow-none"
                        >
                            JOIN DEPLOYMENT
                        </button>
                    </form>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mx-6 mb-5 px-4 py-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-500 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <AlertTriangle size={16} className="animate-pulse shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        [PROTOCOL ERROR: {error.toUpperCase()}]
                    </span>
                </div>
            )}

            {/* Active Rooms Browser Overlay Panel */}
            {isBrowserOpen && (
                <div className="absolute inset-0 z-50 bg-stone-950 flex flex-col p-6 font-mono text-stone-300 animate-in fade-in duration-200">
                    {/* Visual Border Accents */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-cyan-500/40" />
                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-cyan-500/40" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-cyan-500/40" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-cyan-500/40" />

                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-stone-850 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    audioManager.playSound('click');
                                    setIsBrowserOpen(false);
                                }}
                                className="p-2 hover:bg-stone-900 border border-stone-800 hover:border-cyan-500/50 text-stone-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
                                title="Back to Protocol Selection"
                            >
                                <ArrowLeft size={14} />
                            </button>
                            <div>
                                <h2 className="text-md font-black text-white tracking-wider uppercase">ACTIVE NETWORKS BROWSER</h2>
                                <p className="text-[9px] text-stone-500 tracking-wider uppercase">
                                    QUERYING ONLINE CHANNELS...
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                audioManager.playSound('click');
                                fetchRooms();
                            }}
                            disabled={isLoadingRooms}
                            className="px-3 py-1.5 hover:bg-stone-900 border border-stone-850 hover:border-cyan-500/50 text-cyan-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase"
                        >
                            <RefreshCw size={12} className={isLoadingRooms ? 'animate-spin' : ''} />
                            <span>REFRESH</span>
                        </button>
                    </div>

                    {/* Rooms List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {isLoadingRooms ? (
                            <div className="flex flex-col items-center justify-center h-48 space-y-2">
                                <RefreshCw size={24} className="text-cyan-500 animate-spin" />
                                <span className="text-[10px] text-stone-500 uppercase tracking-widest animate-pulse">Scanning Net Nodes...</span>
                            </div>
                        ) : activeRooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-stone-850 rounded-xl text-stone-600 space-y-2 text-center p-4">
                                <span className="text-xs font-bold uppercase tracking-wider">// NO PUBLIC CORRIDORS FOUND</span>
                                <span className="text-[9px] uppercase tracking-wide max-w-xs leading-relaxed text-stone-500">
                                    Establish a new lobby corridor to allow other agents to scan and link to your simulation instance.
                                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 pb-4">
                                {activeRooms.map((room) => (
                                    <div 
                                        key={room.id}
                                        className="border border-stone-850 hover:border-cyan-500/30 bg-stone-900/10 hover:bg-cyan-950/5 p-4 rounded-xl flex flex-col justify-between gap-4 transition-all duration-300 group"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-xs font-black text-stone-200 uppercase truncate pr-1">
                                                    {room.name}
                                                </span>
                                                {room.isPlaying ? (
                                                    <span className="px-2 py-0.5 bg-amber-955/40 border border-amber-900/30 rounded text-[9px] font-bold text-amber-500 uppercase tracking-wider shrink-0 animate-pulse">
                                                        PLAYING
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-cyan-950/40 border border-cyan-900/30 rounded text-[9px] font-bold text-cyan-400 uppercase tracking-wider shrink-0">
                                                        {room.playerCount} / {room.maxPlayers} CONNECTED
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] font-mono text-stone-500 uppercase">
                                                <span className="border border-stone-850 px-1 rounded bg-stone-950 text-stone-400">ID: {room.id}</span>
                                                <span>•</span>
                                                <span>HP: {room.settings?.hp === 9 ? 'RANDOM' : (room.settings?.hp || 4)}</span>
                                                <span>•</span>
                                                <span>ROUNDS: {room.settings?.rounds || 3}</span>
                                                <span>•</span>
                                                <span>ITEMS: {room.settings?.itemsPerShipment === 9 ? 'RANDOM' : (room.settings?.itemsPerShipment || 4)}</span>
                                            </div>
                                        </div>

                                        {room.isPlaying ? (
                                            <div className="w-full py-2 border border-stone-850 bg-stone-900/40 text-amber-500/70 font-black text-[10px] tracking-widest rounded-lg flex items-center justify-center gap-1.5 uppercase select-none">
                                                <span>MATCH IN PROGRESS</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    audioManager.playSound('click');
                                                    onJoinRoom(room.id);
                                                    setIsBrowserOpen(false);
                                                }}
                                                className="w-full py-2 border border-cyan-800/40 group-hover:border-cyan-500/60 bg-cyan-950/20 group-hover:bg-cyan-950/50 hover:bg-cyan-900 text-cyan-400 group-hover:text-cyan-300 hover:text-white font-black text-[10px] tracking-widest rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <span>ESTABLISH UPLINK</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Proper Kicking Message Overlay */}
            {error && error.toLowerCase().includes('kick') && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-[360px] sm:w-[400px] bg-stone-950 border-2 border-red-500/30 p-6 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center space-y-4 font-mono select-none">
                        <div className="inline-flex p-3 bg-red-950/40 border border-red-500/40 text-red-500 rounded-full animate-bounce">
                            <AlertTriangle size={28} />
                        </div>
                        <h2 className="text-red-500 text-lg font-black tracking-widest uppercase">DISMISSED FROM BUNKER</h2>
                        <p className="text-[11px] text-stone-400 uppercase leading-relaxed">
                            You have been expelled from the simulation corridor by the corridor host.
                        </p>
                        <button
                            onClick={() => {
                                audioManager.playSound('click');
                                clearError();
                            }}
                            className="w-full py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-800 hover:border-red-400 text-red-400 hover:text-white font-black text-xs tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                            ACKNOWLEDGE PROTOCOL
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
