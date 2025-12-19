import React, { useState } from 'react';
import { Users, Settings, Play, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { RoomSettings, MultiplayerPlayer } from '../types';

interface MultiplayerLobbyProps {
    room: any;
    playerId: string;
    onUpdateSettings: (settings: RoomSettings) => void;
    onReadyUp: (ready: boolean) => void;
    onStartGame: () => void;
    onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
    room,
    playerId,
    onUpdateSettings,
    onReadyUp,
    onStartGame,
    onBack
}) => {
    const isHost = room.hostId === playerId;
    const currentPlayer = room.players.find((p: any) => p.id === playerId);
    const isReady = currentPlayer?.ready || false;

    const handleSettingChange = (key: keyof RoomSettings, value: number) => {
        if (!isHost) return;
        onUpdateSettings({ ...room.settings, [key]: value });
    };

    return (
        <div className="flex flex-col h-full bg-black/60 backdrop-blur-md border border-stone-800 rounded-xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-6 border-b border-stone-800 bg-stone-900/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-stone-800 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter uppercase italic">Multiplayer Lobby</h1>
                        <p className="text-[10px] text-stone-500 font-mono">ROOM ID: {room.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-900/30 rounded text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                    <Users size={14} />
                    {room.players.length} / 4 PLAYERS
                </div>
            </div>

            <div className="flex-1 p-6 flex gap-6 overflow-hidden">
                {/* Settings Column */}
                <div className="w-1/2 space-y-6 overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2">
                            <Settings size={14} /> Match Settings
                        </h2>

                        <div className="space-y-4 bg-stone-900/30 p-4 rounded-lg border border-stone-800/50">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-stone-400">Rounds to Win</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="1" max="10" value={room.settings.rounds}
                                        disabled={!isHost}
                                        onChange={(e) => handleSettingChange('rounds', parseInt(e.target.value))}
                                        className="flex-1 accent-red-600"
                                    />
                                    <span className="text-xl font-mono text-red-500">{room.settings.rounds}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-stone-400">Starting HP</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="2" max="8" value={room.settings.hp}
                                        disabled={!isHost}
                                        onChange={(e) => handleSettingChange('hp', parseInt(e.target.value))}
                                        className="flex-1 accent-red-600"
                                    />
                                    <span className="text-xl font-mono text-red-500">{room.settings.hp}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-stone-400">Items per Shipment</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="0" max="8" value={room.settings.itemsPerShipment}
                                        disabled={!isHost}
                                        onChange={(e) => handleSettingChange('itemsPerShipment', parseInt(e.target.value))}
                                        className="flex-1 accent-red-600"
                                    />
                                    <span className="text-xl font-mono text-red-500">{room.settings.itemsPerShipment}</span>
                                </div>
                            </div>
                        </div>
                        {!isHost && <p className="text-[9px] text-stone-600 uppercase italic">Only the Host can modify settings.</p>}
                    </div>

                    <div className="pt-4 border-t border-stone-800/50 space-y-3">
                        <button
                            onClick={() => onReadyUp(!isReady)}
                            className={`w-full h-12 ${isReady ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'} text-black font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg`}
                        >
                            {isReady ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            {isReady ? 'Ready' : 'Not Ready'}
                        </button>

                        {isHost && (
                            <button
                                onClick={onStartGame}
                                disabled={room.players.length < 2 || !room.players.every((p: any) => p.ready)}
                                className="w-full h-14 bg-red-600 hover:bg-red-500 disabled:bg-stone-800 disabled:text-stone-500 text-black font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)] border-b-4 border-red-900 active:border-b-0"
                            >
                                <Play size={24} fill="currentColor" />
                                Start Match
                            </button>
                        )}
                        <p className="mt-2 text-center text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                            {room.players.length < 2 ? 'WAITING FOR COMPETITION...' :
                                !room.players.every((p: any) => p.ready) ? 'WAITING FOR ALL PLAYERS TO BE READY' : 'READY FOR EXTRACTION'}
                        </p>
                    </div>
                </div>

                {/* Players Column */}
                <div className="w-1/2 space-y-4 overflow-y-auto">
                    <h2 className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2">
                        <Users size={14} /> Active Players
                    </h2>
                    <div className="space-y-2">
                        {room.players.map((player: any) => (
                            <div
                                key={player.id}
                                className="p-4 bg-stone-900/40 border border-stone-800 rounded-lg flex items-center justify-between group hover:border-stone-700 transition-colors"
                                style={{ borderLeftColor: player.color, borderLeftWidth: '4px' }}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold uppercase tracking-tight text-sm text-stone-200">{player.name}</span>
                                        {player.id === room.hostId && (
                                            <span className="text-[8px] bg-red-900/40 text-red-500 px-1.5 py-0.5 rounded border border-red-900/50 font-black">HOST</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-stone-500 font-mono">#{player.id.slice(0, 6)}</span>
                                </div>
                                <div>
                                    {player.ready ? (
                                        <div className="flex flex-col items-center">
                                            <CheckCircle2 size={20} className="text-green-500" />
                                            <span className="text-[8px] text-green-500/80 font-bold uppercase">Ready</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <XCircle size={20} className="text-stone-700" />
                                            <span className="text-[8px] text-stone-700 font-bold uppercase">Wait</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {[...Array(4 - room.players.length)].map((_, i) => (
                            <div key={`empty-${i}`} className="p-4 bg-stone-950/20 border border-dashed border-stone-800/30 rounded-lg flex items-center justify-center">
                                <span className="text-[10px] text-stone-800 uppercase font-black tracking-widest">Waiting for player...</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
