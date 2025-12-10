import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Send, AlertTriangle } from 'lucide-react';

interface MultiplayerLobbyProps {
    onStartGame: () => void;
    onBack: () => void;
    playerName: string;
    socketData: any;
    errorMsg: string | null;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onStartGame, onBack, playerName, socketData, errorMsg }) => {
    // Defaults: Round 1, Items 3, Health 4
    const [rounds, setRounds] = useState(1);
    const [shipmentSize, setShipmentSize] = useState(3);
    const [maxHealth, setMaxHealth] = useState(4);

    // Chat State
    const [chatInput, setChatInput] = useState("");

    const {
        players,
        isHost,
        messages,
        toggleReady,
        updateSettings,
        sendMessage,
        startGame,
        hostSettings
    } = socketData;

    // Sync Settings based on Host
    useEffect(() => {
        if (isHost) {
            updateSettings({ rounds, items: shipmentSize, health: maxHealth });
        }
    }, [rounds, shipmentSize, maxHealth, isHost]);

    useEffect(() => {
        if (hostSettings && !isHost) {
            setRounds(hostSettings.rounds);
            setShipmentSize(hostSettings.items);
            setMaxHealth(hostSettings.health);
        }
    }, [hostSettings, isHost]);

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim()) {
            sendMessage(chatInput.trim());
            setChatInput("");
        }
    };

    // Determine if we can start
    const canStart = isHost && players.length > 1 && players.every((p: any) => p.ready);
    const amIReady = players.find((p: any) => p.name === playerName.toUpperCase())?.ready || false;



    return (
        <div className="flex flex-col w-full h-full bg-black text-stone-200 p-8 font-mono overflow-y-auto">
            <div className="flex justify-between items-start border-b-2 border-stone-800 pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-red-600 tracking-widest mb-2">LOBBY</h1>
                    <p className="text-stone-500 text-sm">SESSION ID: 777-666-XXX</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-4 py-2 border border-stone-600 hover:bg-stone-800 text-xs tracking-wider"
                >
                    DISCONNECT
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-1">

                {/* PLAYER LIST & CHAT */}
                <div className="flex flex-col gap-4 h-full">
                    {/* List */}
                    <div className="space-y-4 flex-1">
                        <h2 className="text-xl font-bold bg-stone-900 border-l-4 border-stone-600 pl-3 py-1 text-stone-300">
                            CONNECTED ENTITIES ({players.length}/4)
                        </h2>
                        <div className="space-y-2">
                            {players.map((p) => (
                                <div key={p.id} className={`flex justify-between items-center bg-stone-900/50 p-4 border ${p.name === playerName.toUpperCase() ? 'border-yellow-600' : 'border-stone-800'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold tracking-wider">{p.name} {p.name === playerName.toUpperCase() && "(YOU)"}</span>
                                            {p.isHost && <span className="text-[10px] bg-red-900 text-red-200 px-1">HOST</span>}
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 ${p.ready ? 'bg-green-900 text-green-200' : 'bg-stone-800 text-stone-400'}`}>
                                        {p.ready ? 'READY' : 'WAITING'}
                                    </span>
                                </div>
                            ))}
                            {[...Array(Math.max(0, 4 - players.length))].map((_, i) => (
                                <div key={`empty-${i}`} className="flex justify-between items-center bg-stone-950 p-4 border border-stone-900 border-dashed text-stone-700">
                                    <span>EMPTY SLOT</span>
                                    <span className="text-[10px]">WAITING...</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-black border border-stone-800 flex flex-col min-h-[200px]">
                        <div className="bg-stone-900 px-3 py-1 text-xs font-bold text-stone-500 border-b border-stone-800">SECURE COMMS</div>
                        <div className="flex-1 p-2 overflow-y-auto space-y-1 font-mono text-xs">
                            {messages.map((m, idx) => (
                                <div key={idx} className="break-words">
                                    <span className="text-stone-500">[{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] </span>
                                    <span className="text-blue-400 font-bold">{m.sender}: </span>
                                    <span className="text-stone-300">{m.text}</span>
                                </div>
                            ))}
                            {messages.length === 0 && <div className="text-stone-700 italic text-center mt-4">NO TRAFFIC</div>}
                        </div>
                        <form onSubmit={handleSendChat} className="flex border-t border-stone-800">
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="TRANSMIT MESSAGE..."
                                className="flex-1 bg-stone-950 p-2 text-sm outline-none text-stone-300 placeholder-stone-700"
                            />
                            <button type="submit" className="bg-stone-800 px-4 hover:bg-stone-700 text-stone-400">
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* SETTINGS */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold bg-stone-900 border-l-4 border-stone-600 pl-3 py-1 text-stone-300 flex justify-between">
                        <span>MATCH CONFIG</span>
                        {!isHost && <span className="text-xs self-center text-stone-500 font-normal">[READ ONLY]</span>}
                    </h2>

                    <div className="space-y-6 p-4 border border-stone-800 bg-stone-900/20">
                        {/* Rounds */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-stone-400">
                                <span>ROUNDS TO WIN</span>
                                <span>{rounds}</span>
                            </div>
                            <input
                                type="range" min="1" max="9" step="2"
                                value={rounds}
                                disabled={!isHost}
                                onChange={(e) => setRounds(parseInt(e.target.value))}
                                className={`w-full h-2 appearance-none ${isHost ? 'bg-stone-700 cursor-pointer [&::-webkit-slider-thumb]:bg-red-600' : 'bg-stone-800 cursor-not-allowed [&::-webkit-slider-thumb]:bg-stone-600'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4`}
                            />
                        </div>

                        {/* Shipment Size */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-stone-400">
                                <span>MAX ITEMS</span>
                                <span>{shipmentSize}</span>
                            </div>
                            <input
                                type="range" min="2" max="8" step="1"
                                value={shipmentSize}
                                disabled={!isHost}
                                onChange={(e) => setShipmentSize(parseInt(e.target.value))}
                                className={`w-full h-2 appearance-none ${isHost ? 'bg-stone-700 cursor-pointer [&::-webkit-slider-thumb]:bg-red-600' : 'bg-stone-800 cursor-not-allowed [&::-webkit-slider-thumb]:bg-stone-600'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4`}
                            />
                        </div>

                        {/* Health */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-stone-400">
                                <span>STARTING CHARGES</span>
                                <span>{maxHealth}</span>
                            </div>
                            <input
                                type="range" min="2" max="6" step="1"
                                value={maxHealth}
                                disabled={!isHost}
                                onChange={(e) => setMaxHealth(parseInt(e.target.value))}
                                className={`w-full h-2 appearance-none ${isHost ? 'bg-stone-700 cursor-pointer [&::-webkit-slider-thumb]:bg-red-600' : 'bg-stone-800 cursor-not-allowed [&::-webkit-slider-thumb]:bg-stone-600'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4`}
                            />
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col gap-4">
                        <button
                            onClick={toggleReady}
                            className={`w-full py-4 text-xl font-black tracking-[0.2em] transition-all border-2 ${amIReady ? 'bg-green-900 border-green-600 text-white' : 'bg-transparent border-stone-600 text-stone-400 hover:text-white hover:border-white'}`}
                        >
                            {amIReady ? 'READY' : 'MARK READY'}
                        </button>

                        {isHost && (
                            <button
                                onClick={startGame}
                                disabled={!canStart}
                                className={`w-full py-4 text-xl font-black tracking-[0.2em] transition-all ${canStart ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}
                            >
                                START GAME
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {/* Error Overlay */}
            {errorMsg && (
                <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center">
                    <div className="border-2 border-red-600 p-8 max-w-md text-center">
                        <AlertTriangle size={48} className="text-red-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-red-600 mb-2">CONNECTION ERROR</h3>
                        <p className="text-stone-400 mb-6 font-mono text-sm">{errorMsg}</p>
                        <button onClick={onBack} className="bg-red-600 text-black font-bold px-6 py-3 hover:bg-white transition-colors">
                            RETURN TO MENU
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
