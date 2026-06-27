import React, { useState } from 'react';
import { Users, Settings, Play, CheckCircle2, XCircle, ArrowLeft, Copy, Link, Sliders, ShieldAlert } from 'lucide-react';
import { RoomSettings } from '../types';
import { audioManager } from '../utils/audioManager';
import { getMultiplayerDefaultWeights } from '../utils/game/inventory';

interface MultiplayerLobbyProps {
    room: any;
    playerId: string;
    onUpdateSettings: (settings: RoomSettings) => void;
    onReadyUp: (ready: boolean) => void;
    onStartGame: () => void;
    onBack: () => void;
    onKick?: (targetPlayerId: string) => void;
}

// Dynamic multiplayer default weights are imported from utils/game/inventory

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
    room,
    playerId,
    onUpdateSettings,
    onReadyUp,
    onStartGame,
    onBack,
    onKick
}) => {
    const isHost = room.hostId === playerId;
    const currentPlayer = room.players.find((p: any) => p.id === playerId);
    const isReady = currentPlayer?.ready || false;

    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleSettingChange = (key: keyof RoomSettings, value: any) => {
        if (!isHost) return;
        onUpdateSettings({ ...room.settings, [key]: value });
    };

    const handleCopyCode = () => {
        audioManager.playSound('click');
        navigator.clipboard.writeText(room.id);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleCopyLink = () => {
        audioManager.playSound('click');
        const inviteLink = `${window.location.origin}${window.location.pathname}?room=${room.id}`;
        navigator.clipboard.writeText(inviteLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleToggleAdvanced = () => {
        audioManager.playSound('click');
        if (!isHost) {
            setShowAdvanced(!showAdvanced);
            return;
        }
        const isCurrentlyAdvanced = !!room.settings.isAdvanced;
        onUpdateSettings({
            ...room.settings,
            isAdvanced: !isCurrentlyAdvanced,
            itemWeights: room.settings.itemWeights || getMultiplayerDefaultWeights(room.players.length)
        });
        setShowAdvanced(!isCurrentlyAdvanced);
    };

    const defaultWeights = getMultiplayerDefaultWeights(room.players.length);
    const itemWeights = room.settings.itemWeights || defaultWeights;
    const totalWeight = Object.keys(defaultWeights).reduce((sum, item) => {
        const w = itemWeights[item] !== undefined ? itemWeights[item] : defaultWeights[item];
        return sum + w;
    }, 0);

    return (
        <div className="flex flex-col h-full w-full bg-stone-950 font-mono text-stone-300 md:border-r border-stone-900 select-none overflow-hidden lobby-three-cols-container">
            {/* Header */}
            <div className="p-3 sm:p-6 border-b border-stone-900 bg-stone-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 select-none relative shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button 
                        onClick={() => {
                            audioManager.playSound('click');
                            if (window.confirm("ARE YOU SURE YOU WANT TO LEAVE THE LOBBY AND DISCONNECT?")) {
                                onBack();
                            }
                        }} 
                        className="p-1.5 sm:p-2 hover:bg-stone-900 border border-stone-850 hover:border-red-500/50 rounded-lg text-stone-400 hover:text-red-400 transition-all cursor-pointer"
                    >
                        <ArrowLeft size={14} className="sm:w-[16px] sm:h-[16px]" />
                    </button>
                    <div>
                        <h1 className="text-sm sm:text-base md:text-lg font-black tracking-widest uppercase text-white italic">Multiplayer Lobby</h1>
                        <p className="text-[8px] sm:text-[9px] text-stone-500 uppercase tracking-widest mt-0.5">Tactical Deployment Station</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/20 border border-cyan-900/30 rounded text-cyan-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
                    <Users size={10} className="animate-pulse sm:w-[12px] sm:h-[12px]" />
                    {room.players.length} / 4 LOBBY_NODES
                </div>
            </div>

            {/* Room Tunnel Details */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-4 bg-stone-900/10 border-b border-stone-900 shrink-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="text-center md:text-left select-none space-y-0.5">
                        <span className="text-[7px] sm:text-[8px] font-black text-stone-500 uppercase tracking-widest block">SECURE_ROOM_TUNNEL</span>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                            <span className="text-xl sm:text-3xl font-black text-white tracking-[0.25em]">{room.id}</span>
                            {room.name && (
                                <span className="text-[10px] sm:text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                    [ {room.name} ]
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                        {isHost ? (
                            <button
                                onClick={() => handleSettingChange('isPrivate', !room.settings.isPrivate)}
                                className={`px-2 py-1 text-[8px] sm:text-[9px] font-black tracking-widest uppercase rounded border transition-all cursor-pointer ${
                                    room.settings.isPrivate 
                                        ? 'bg-amber-955/20 text-amber-500 border-amber-805 hover:border-amber-500' 
                                        : 'bg-cyan-950/20 text-cyan-400 border-cyan-800 hover:border-cyan-500'
                                }`}
                            >
                                {room.settings.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                            </button>
                        ) : (
                            <span className={`px-2 py-1 text-[8px] sm:text-[9px] font-black tracking-widest uppercase rounded border select-none ${
                                room.settings.isPrivate 
                                    ? 'bg-amber-955/10 text-amber-600/70 border-amber-900/40' 
                                    : 'bg-cyan-950/10 text-cyan-600/80 border-cyan-900/40'
                            }`}>
                                {room.settings.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                            </span>
                        )}
                        <button 
                            onClick={handleCopyCode}
                            className="flex-none px-2 py-1 bg-stone-900 hover:bg-stone-850 border border-stone-850 hover:border-cyan-500 text-stone-400 hover:text-cyan-400 text-[8px] sm:text-[9px] font-black tracking-widest uppercase rounded transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shrink-0"
                        >
                            <Copy size={10} />
                            {copiedCode ? 'COPIED' : (
                                <>
                                    <span className="hidden sm:inline">COPY CODE</span>
                                    <span className="sm:hidden">CODE</span>
                                </>
                            )}
                        </button>
                        <button 
                            onClick={handleCopyLink}
                            className="flex-none px-2 py-1 bg-cyan-955/15 hover:bg-cyan-955/30 border border-cyan-900/50 hover:border-cyan-400 text-cyan-400 hover:text-white text-[8px] sm:text-[9px] font-black tracking-widest uppercase rounded transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(6,182,212,0.1)] shrink-0"
                        >
                            <Link size={10} />
                            {copiedLink ? 'COPIED' : (
                                <>
                                    <span className="hidden sm:inline">COPY LINK</span>
                                    <span className="sm:hidden">LINK</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 p-2 sm:p-4 flex flex-row gap-2 sm:gap-4 overflow-hidden min-h-0">
                
                {/* Settings Column */}
                <div className="h-full overflow-y-auto pr-0.5 custom-scrollbar min-w-0 gpu-accelerated lobby-settings-column">
                    <h2 className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase flex items-center gap-2 select-none border-b border-stone-900 pb-2 tracking-widest">
                        <Settings size={10} /> Match Configuration
                    </h2>

                    <div className="space-y-4 p-0.5">
                        {/* Standard Settings */}
                        <div className="space-y-3.5">
                            <div className="space-y-1">
                                <div className="flex justify-between items-baseline select-none">
                                    <label className="text-[8px] sm:text-[9px] uppercase font-black text-stone-400 tracking-wider">Rounds to Win</label>
                                    <span className="text-xs sm:text-sm font-black text-cyan-400">{room.settings.rounds}</span>
                                </div>
                                <input
                                    type="range" min="1" max="7" step="2" value={room.settings.rounds}
                                    disabled={!isHost}
                                    onChange={(e) => handleSettingChange('rounds', parseInt(e.target.value))}
                                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-stone-900 rounded-lg appearance-none opacity-85 hover:opacity-100 disabled:opacity-40 transition-opacity"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-baseline select-none">
                                    <label className="text-[8px] sm:text-[9px] uppercase font-black text-stone-400 tracking-wider">Starting Health Points</label>
                                    <span className="text-xs sm:text-sm font-black text-cyan-400">
                                        {room.settings.hp === 9 ? 'RANDOM' : `${room.settings.hp} HP`}
                                    </span>
                                </div>
                                <input
                                    type="range" min="2" max="9" value={room.settings.hp}
                                    disabled={!isHost}
                                    onChange={(e) => handleSettingChange('hp', parseInt(e.target.value))}
                                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-stone-900 rounded-lg appearance-none opacity-85 hover:opacity-100 disabled:opacity-40 transition-opacity"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-baseline select-none">
                                    <label className="text-[8px] sm:text-[9px] uppercase font-black text-stone-400 tracking-wider">Items per Shipment</label>
                                    <span className="text-xs sm:text-sm font-black text-cyan-400">
                                        {room.settings.itemsPerShipment === 9 ? 'RANDOM' : room.settings.itemsPerShipment}
                                    </span>
                                </div>
                                <input
                                    type="range" min="0" max="9" value={room.settings.itemsPerShipment}
                                    disabled={!isHost}
                                    onChange={(e) => handleSettingChange('itemsPerShipment', parseInt(e.target.value))}
                                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-stone-900 rounded-lg appearance-none opacity-85 hover:opacity-100 disabled:opacity-40 transition-opacity"
                                />
                            </div>
                        </div>

                        {/* Advanced Settings Switch & Reset */}
                        <div className="pt-2.5 border-t border-stone-900 flex items-center justify-between">
                            <div className="select-none text-left">
                                <span className="text-[8px] sm:text-[9px] uppercase font-black text-white tracking-wider flex items-center gap-1.5">
                                    <Sliders size={10} className="text-cyan-400" />
                                    Advanced Configuration
                                </span>
                                <span className="text-[7px] sm:text-[8px] text-stone-500 uppercase block mt-0.5">Customize item drop probabilities</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {isHost && room.settings.isAdvanced && (
                                    <button
                                        onClick={() => {
                                            audioManager.playSound('click');
                                            onUpdateSettings({
                                                ...room.settings,
                                                itemWeights: getMultiplayerDefaultWeights(room.players.length)
                                            });
                                        }}
                                        className="px-2 py-1 text-[8px] sm:text-[9px] font-black tracking-widest uppercase rounded border border-red-900/40 bg-red-955/20 text-red-400 hover:bg-red-900/30 hover:border-red-500/60 transition-all cursor-pointer"
                                    >
                                        RESET
                                    </button>
                                )}
                                <button
                                    onClick={handleToggleAdvanced}
                                    className={`px-2 py-1 text-[8px] sm:text-[9px] font-black tracking-widest uppercase rounded-lg border transition-all cursor-pointer ${
                                        room.settings.isAdvanced 
                                            ? 'bg-cyan-950/20 text-cyan-400 border-cyan-800' 
                                            : 'bg-stone-950 text-stone-500 border-stone-850 hover:text-stone-300 hover:border-stone-700'
                                        }`}
                                >
                                    {room.settings.isAdvanced ? 'ENABLED' : 'DISABLED'}
                                </button>
                            </div>
                        </div>

                        {/* Advanced Grid */}
                        {showAdvanced && (
                            <div className="pt-3 mt-2 border-t border-stone-900 grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                {Object.keys(defaultWeights)
                                    .filter(item => item !== 'REMOTE' || room.players.length > 2)
                                    .map((item) => {
                                        const weight = itemWeights[item] !== undefined ? itemWeights[item] : defaultWeights[item];
                                        const percentage = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
                                        return (
                                            <div key={item} className="flex flex-col gap-1 p-2 bg-stone-900/20 border border-stone-900/60 rounded-lg hover:bg-stone-900/35 transition-all">
                                                <div className="flex justify-between items-center select-none min-w-0 gap-1 text-left">
                                                    <span className="text-[7px] sm:text-[8px] font-bold text-stone-300 uppercase tracking-wider truncate block">{item.replace('_', ' ')}</span>
                                                    <span className="text-[7px] sm:text-[8px] font-mono text-cyan-400 font-bold shrink-0">
                                                        {weight === 0 ? '0%' : `${weight}(${percentage}%)`}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="10"
                                                    value={weight}
                                                    disabled={!isHost}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        const currentWeights = room.settings.itemWeights || defaultWeights;
                                                        onUpdateSettings({
                                                            ...room.settings,
                                                            itemWeights: {
                                                                ...currentWeights,
                                                                [item]: val
                                                            }
                                                        });
                                                    }}
                                                className="w-full accent-cyan-500 cursor-pointer h-1 bg-stone-950 rounded-lg appearance-none opacity-80 hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Players Column */}
                <div className="h-full overflow-y-auto pr-0.5 custom-scrollbar min-w-0 gpu-accelerated lobby-players-column">
                    <h2 className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase flex items-center gap-2 select-none border-b border-stone-900 pb-2 tracking-widest">
                        <Users size={10} /> Registered Agents
                    </h2>

                    <div className="space-y-2">
                        {room.players.map((player: any) => {
                            const isMe = player.id === playerId;
                            return (
                                <div
                                    key={player.id}
                                    className="p-2 bg-stone-900/20 border border-stone-900/60 rounded-lg flex items-center justify-between group hover:bg-stone-900/35 hover:border-stone-800/85 transition-all"
                                    style={{ borderLeftColor: player.color, borderLeftWidth: '4px' }}
                                >
                                    <div className="flex flex-col min-w-0 text-left flex-1 pr-1">
                                        <div className="flex flex-wrap items-center gap-1 min-w-0">
                                            <span className="font-black uppercase tracking-wide text-xs text-stone-200 truncate">{player.name}</span>
                                            <div className="flex gap-0.5 shrink-0 flex-wrap">
                                                {player.id === room.hostId && (
                                                    <span className="text-[7px] bg-red-955/20 text-red-400 px-1 py-0.5 rounded border border-red-900/30 font-black tracking-widest">HOST</span>
                                                )}
                                                {isMe && (
                                                    <span className="text-[7px] bg-cyan-950/20 text-cyan-400 px-1 py-0.5 rounded border border-cyan-900/30 font-black tracking-widest">YOU</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[7px] sm:text-[8px] text-stone-500 font-mono mt-0.5 select-none hidden sm:inline">ID: {player.id.slice(0, 4).toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {isHost && player.id !== playerId && (
                                            <button
                                                onClick={() => {
                                                    audioManager.playSound('click');
                                                    if (window.confirm(`EXPEL AGENT ${player.name.toUpperCase()} FROM THE BUNKER?`)) {
                                                        onKick?.(player.id);
                                                    }
                                                }}
                                                className="px-1.5 py-0.5 bg-red-955/20 hover:bg-red-900/30 border border-red-900/40 hover:border-red-500/60 text-red-400 hover:text-white text-[7px] font-black tracking-widest uppercase rounded transition-all active:scale-95 cursor-pointer shadow-sm"
                                            >
                                                KICK
                                            </button>
                                        )}
                                        {player.ready ? (
                                            <div className="flex items-center gap-0.5 bg-emerald-950/20 border border-emerald-900/40 px-1.5 py-0.5 rounded text-emerald-400 text-[8px] sm:text-[9px] font-black select-none">
                                                <CheckCircle2 size={9} className="text-emerald-500 animate-pulse" />
                                                READY
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-0.5 bg-stone-900 border border-stone-850 px-1.5 py-0.5 rounded text-stone-550 text-[8px] sm:text-[9px] font-black select-none">
                                                <XCircle size={9} className="text-stone-750" />
                                                WAITING
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {[...Array(Math.max(0, 4 - room.players.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="p-2.5 sm:p-4 bg-stone-950 border border-dashed border-stone-900 rounded-lg flex items-center justify-center select-none">
                                <span className="text-[8px] sm:text-[9px] text-stone-750 uppercase font-bold tracking-[0.3em] flex items-center gap-1.5">
                                    <ShieldAlert size={10} className="text-stone-800 animate-pulse" />
                                    WAITING FOR NODES...
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 sm:p-6 border-t border-stone-900 bg-stone-950/80 select-none keyboard-aware-bottom shrink-0">
                <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                    <button
                        onClick={() => {
                            audioManager.playSound('click');
                            onReadyUp(!isReady);
                        }}
                        className={`flex-1 h-10 sm:h-12 border font-black uppercase text-[10px] sm:text-xs tracking-[0.15em] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                            isReady 
                                ? 'bg-emerald-600 text-black hover:bg-emerald-500 border-emerald-500' 
                                : 'bg-transparent text-amber-500 border-amber-900 hover:text-amber-400 hover:border-amber-500 hover:bg-amber-950/10'
                        }`}
                    >
                        {isReady ? <CheckCircle2 size={14} className="sm:w-[16px] sm:h-[16px]" /> : <XCircle size={14} className="sm:w-[16px] sm:h-[16px]" />}
                        {isReady ? 'READY TO ENGAGE' : 'STAND BY (NOT READY)'}
                    </button>

                    {isHost && (
                        <button
                            onClick={() => {
                                audioManager.playSound('click');
                                onStartGame();
                            }}
                            disabled={room.players.length < 2 || !room.players.every((p: any) => p.ready)}
                            className="flex-1 h-10 sm:h-12 bg-red-600 hover:bg-red-500 disabled:bg-stone-900 disabled:border-stone-850 disabled:text-stone-600 text-white font-black uppercase text-[10px] sm:text-xs tracking-[0.15em] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-[0_0_30px_rgba(220,38,38,0.15)] border border-red-600 disabled:shadow-none"
                        >
                            <Play size={14} fill="currentColor" className="sm:w-[16px] sm:h-[16px]" />
                            LAUNCH MATCH
                        </button>
                    )}
                </div>
                
                {/* Status Notice */}
                <p className="mt-2.5 text-center text-[8px] sm:text-[9px] text-stone-500 font-bold uppercase tracking-[0.25em] animate-pulse">
                    {room.players.length < 2 ? 'MINIMUM 2 NODES REQUIRED TO INITIATE' :
                        !room.players.every((p: any) => p.ready) ? 'WAITING ON NODE SYNCHRONIZATION...' : 'LOBBY FULLY LOADED // PERMISSION GRANTED'}
                </p>
            </div>
        </div>
    );
};
