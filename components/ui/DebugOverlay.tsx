import React, { useState } from 'react';
import { GameState, PlayerState, ItemType, ShellType, TurnOwner } from '../../types';
import { ITEMS } from '../../constants';
import { Bug, X, Plus, Trash2, Heart, Shield, Award, RefreshCw, Zap } from 'lucide-react';

interface DebugOverlayProps {
    gameState: GameState;
    player: PlayerState;
    dealer: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setDealer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    onClose?: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
    gameState,
    player,
    dealer,
    setPlayer,
    setDealer,
    setGameState,
    onClose
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<'chamber' | 'items' | 'status'>('chamber');

    // Mark the game as using debug features
    React.useEffect(() => {
        setGameState(prev => {
            if (prev.isDebugUsed) return prev;
            return { ...prev, isDebugUsed: true };
        });
    }, [setGameState]);

    // --- Chamber Cheats ---
    const toggleShell = (index: number) => {
        setGameState(prev => {
            const newChamber = [...prev.chamber];
            newChamber[index] = newChamber[index] === 'LIVE' ? 'BLANK' : 'LIVE';
            const liveCount = newChamber.filter(s => s === 'LIVE').length;
            const blankCount = newChamber.filter(s => s === 'BLANK').length;
            return {
                ...prev,
                chamber: newChamber,
                liveCount,
                blankCount
            };
        });
    };

    const makeAllShells = (type: ShellType) => {
        setGameState(prev => {
            const newChamber = prev.chamber.map(() => type);
            const liveCount = type === 'LIVE' ? prev.chamber.length : 0;
            const blankCount = type === 'BLANK' ? prev.chamber.length : 0;
            return {
                ...prev,
                chamber: newChamber,
                liveCount,
                blankCount
            };
        });
    };

    const randomizeChamber = () => {
        setGameState(prev => {
            const newChamber = prev.chamber.map(() => Math.random() > 0.5 ? 'LIVE' : 'BLANK');
            const liveCount = newChamber.filter(s => s === 'LIVE').length;
            const blankCount = newChamber.filter(s => s === 'BLANK').length;
            return {
                ...prev,
                chamber: newChamber,
                liveCount,
                blankCount
            };
        });
    };

    // --- Item Cheats ---
    const addItem = (target: 'player' | 'dealer', item: ItemType) => {
        const setter = target === 'player' ? setPlayer : setDealer;
        setter(prev => {
            if (prev.items.length >= 8) return prev; // Limit to 8
            return {
                ...prev,
                items: [...prev.items, item]
            };
        });
    };

    const removeItem = (target: 'player' | 'dealer', index: number) => {
        const setter = target === 'player' ? setPlayer : setDealer;
        setter(prev => {
            const newItems = [...prev.items];
            newItems.splice(index, 1);
            return {
                ...prev,
                items: newItems
            };
        });
    };

    const clearItems = (target: 'player' | 'dealer') => {
        const setter = target === 'player' ? setPlayer : setDealer;
        setter(prev => ({ ...prev, items: [] }));
    };

    // --- Health Cheats ---
    const adjustHp = (target: 'player' | 'dealer', amount: number) => {
        const setter = target === 'player' ? setPlayer : setDealer;
        setter(prev => {
            const newHp = Math.min(prev.maxHp, Math.max(0, prev.hp + amount));
            if (newHp === 0) {
                setGameState(g => ({
                    ...g,
                    phase: 'GAME_OVER',
                    winner: target === 'player' ? 'DEALER' : 'PLAYER'
                }));
            }
            return {
                ...prev,
                hp: newHp
            };
        });
    };

    const setMaxHp = (target: 'player' | 'dealer', amount: number) => {
        const setter = target === 'player' ? setPlayer : setDealer;
        setter(prev => {
            const newMax = Math.max(1, prev.maxHp + amount);
            const newHp = Math.min(newMax, prev.hp);
            return {
                ...prev,
                maxHp: newMax,
                hp: newHp
            };
        });
    };

    // --- Game flow cheats ---
    const setWinnerInstantly = (winner: TurnOwner) => {
        setGameState(prev => ({
            ...prev,
            phase: 'GAME_OVER',
            winner
        }));
    };

    const togglePhase = () => {
        setGameState(prev => ({
            ...prev,
            phase: prev.phase === 'PLAYER_TURN' ? 'DEALER_TURN' : 'PLAYER_TURN',
            turnOwner: prev.phase === 'PLAYER_TURN' ? 'DEALER' : 'PLAYER'
        }));
    };

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className="fixed bottom-4 right-4 z-[999] p-3 bg-red-950/80 border border-red-700/50 text-red-500 rounded-full hover:bg-red-900 shadow-lg shadow-black/80 hover:scale-115 active:scale-95 transition-all flex items-center justify-center cursor-pointer animate-pulse"
                title="Open Debug Panel"
            >
                <Bug size={20} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[999] w-96 bg-stone-950/85 backdrop-blur-md border border-red-900/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-mono text-xs select-none">
            {/* Header */}
            <div className="p-3 bg-red-950/30 border-b border-red-900/30 flex justify-between items-center">
                <div className="flex items-center gap-2 text-red-500 font-extrabold tracking-widest text-[10px] uppercase">
                    <Bug size={14} className="animate-pulse" />
                    <span>Debug Panel</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="text-stone-500 hover:text-white px-2 py-0.5 border border-stone-800 hover:border-stone-600 rounded bg-stone-900 cursor-pointer text-[9px] uppercase font-bold"
                    >
                        Minimize
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-stone-500 hover:text-white cursor-pointer">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-stone-800 bg-stone-900/40">
                <button
                    onClick={() => setActiveTab('chamber')}
                    className={`flex-1 py-2 text-center font-bold tracking-wider text-[9px] uppercase cursor-pointer transition-all border-b-2 ${activeTab === 'chamber' ? 'text-red-500 border-red-600 bg-red-950/10' : 'text-stone-500 border-transparent hover:text-stone-300'}`}
                >
                    Chamber
                </button>
                <button
                    onClick={() => setActiveTab('items')}
                    className={`flex-1 py-2 text-center font-bold tracking-wider text-[9px] uppercase cursor-pointer transition-all border-b-2 ${activeTab === 'items' ? 'text-red-500 border-red-600 bg-red-950/10' : 'text-stone-500 border-transparent hover:text-stone-300'}`}
                >
                    Items
                </button>
                <button
                    onClick={() => setActiveTab('status')}
                    className={`flex-1 py-2 text-center font-bold tracking-wider text-[9px] uppercase cursor-pointer transition-all border-b-2 ${activeTab === 'status' ? 'text-red-500 border-red-600 bg-red-950/10' : 'text-stone-500 border-transparent hover:text-stone-300'}`}
                >
                    Status / Flow
                </button>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 overflow-y-auto max-h-80 space-y-4 custom-scrollbar text-stone-300">
                
                {/* TAB 1: CHAMBER */}
                {activeTab === 'chamber' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-extrabold tracking-widest text-stone-500 uppercase text-[9px]">Chamber State</span>
                            <span className="text-[10px] text-white bg-stone-900 border border-white/5 px-2 py-0.5 rounded">
                                {gameState.liveCount}L | {gameState.blankCount}B
                            </span>
                        </div>

                        {/* Chamber Shell Grid */}
                        {gameState.chamber.length === 0 ? (
                            <div className="text-center py-4 text-stone-600 uppercase tracking-widest text-[9px]">
                                Chamber is Empty
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {gameState.chamber.map((shell, idx) => {
                                    const isCurrent = gameState.currentShellIndex === idx;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => toggleShell(idx)}
                                            className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none active:scale-95 ${isCurrent ? 'ring-2 ring-red-500 border-red-600' : 'border-stone-800 hover:border-stone-600'} ${shell === 'LIVE' ? 'bg-red-950/20 text-red-400 border-red-900/30' : 'bg-blue-950/20 text-blue-400 border-blue-900/30'}`}
                                        >
                                            <span className="text-[8px] font-bold text-stone-500 uppercase">#{idx + 1}</span>
                                            <span className="font-black text-[10px]">{shell}</span>
                                            {isCurrent && <span className="text-[7px] bg-red-500 text-white font-extrabold px-1 rounded uppercase animate-pulse">Next</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Quick Chamber Controls */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-900">
                            <button
                                onClick={() => makeAllShells('LIVE')}
                                className="py-1.5 bg-red-950/40 border border-red-900/40 text-red-400 rounded hover:bg-red-900/40 cursor-pointer font-bold uppercase text-[9px]"
                            >
                                All Live
                            </button>
                            <button
                                onClick={() => makeAllShells('BLANK')}
                                className="py-1.5 bg-blue-950/40 border border-blue-900/40 text-blue-400 rounded hover:bg-blue-900/40 cursor-pointer font-bold uppercase text-[9px]"
                            >
                                All Blank
                            </button>
                            <button
                                onClick={randomizeChamber}
                                className="py-1.5 bg-stone-900 border border-stone-800 text-stone-300 rounded hover:bg-stone-850 cursor-pointer font-bold uppercase text-[9px] flex items-center justify-center gap-1"
                            >
                                <RefreshCw size={10} /> Rand
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 2: ITEMS */}
                {activeTab === 'items' && (
                    <div className="space-y-4">
                        {/* Target selection */}
                        {['player', 'dealer'].map((target) => {
                            const state = target === 'player' ? player : dealer;
                            return (
                                <div key={target} className="space-y-2 border-b border-stone-900 pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-center">
                                        <span className="font-extrabold tracking-widest text-stone-500 uppercase text-[9px]">{target} Inventory</span>
                                        <button
                                            onClick={() => clearItems(target as any)}
                                            className="text-[9px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wider cursor-pointer"
                                        >
                                            Clear All
                                        </button>
                                    </div>

                                    {/* Inventory Items List */}
                                    <div className="flex flex-wrap gap-1.5 min-h-6">
                                        {state.items.length === 0 ? (
                                            <span className="text-[10px] text-stone-600 uppercase tracking-widest">No Items</span>
                                        ) : (
                                            state.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-1 bg-stone-900 border border-stone-800 px-2 py-1 rounded-md text-[10px]"
                                                >
                                                    <span className="text-white font-extrabold">{item}</span>
                                                    <button
                                                        onClick={() => removeItem(target as any, idx)}
                                                        className="text-red-500 hover:text-red-400 ml-1 cursor-pointer"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Quick Add Items Palette */}
                                    <div className="pt-2">
                                        <span className="text-[8px] text-stone-600 uppercase font-bold tracking-widest block mb-1.5">Add Item:</span>
                                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                            {ITEMS.map((item) => (
                                                <button
                                                    key={item}
                                                    onClick={() => addItem(target as any, item)}
                                                    className="px-1.5 py-0.5 bg-stone-900 hover:bg-stone-800 text-[8px] text-stone-400 hover:text-white font-extrabold rounded border border-stone-800 cursor-pointer uppercase tracking-wider"
                                                >
                                                    +{item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* TAB 3: STATUS / FLOW */}
                {activeTab === 'status' && (
                    <div className="space-y-4">
                        {/* Health settings */}
                        <div className="space-y-3">
                            <span className="font-extrabold tracking-widest text-stone-500 uppercase text-[9px] block">Health Editor</span>
                            {['player', 'dealer'].map((target) => {
                                const state = target === 'player' ? player : dealer;
                                return (
                                    <div key={target} className="flex justify-between items-center bg-stone-900/50 p-2 border border-stone-900 rounded-lg">
                                        <span className="font-bold text-[10px] uppercase text-stone-400">{target} HP:</span>
                                        
                                        <div className="flex items-center gap-4">
                                            {/* HP indicator */}
                                            <div className="flex items-center gap-1">
                                                <Heart size={10} className="text-red-500 fill-red-500" />
                                                <span className="font-black text-white tabular-nums">{state.hp}/{state.maxHp}</span>
                                            </div>

                                            {/* Modifiers */}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => adjustHp(target as any, -1)}
                                                    className="w-5 h-5 bg-stone-950 border border-stone-800 text-stone-400 hover:text-white font-black rounded flex items-center justify-center cursor-pointer active:scale-90"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    onClick={() => adjustHp(target as any, 1)}
                                                    className="w-5 h-5 bg-stone-950 border border-stone-800 text-stone-400 hover:text-white font-black rounded flex items-center justify-center cursor-pointer active:scale-90"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => setMaxHp(target as any, 1)}
                                                    className="px-1 bg-stone-950 border border-stone-800 text-[8px] text-stone-500 hover:text-white font-black rounded flex items-center justify-center cursor-pointer active:scale-90 uppercase tracking-widest"
                                                    title="Increase Max HP"
                                                >
                                                    +Max
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Phase & Winner Controls */}
                        <div className="space-y-3 pt-2 border-t border-stone-900">
                            <span className="font-extrabold tracking-widest text-stone-500 uppercase text-[9px] block">Flow Commands</span>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={togglePhase}
                                    className="py-2 bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 rounded hover:bg-stone-850 cursor-pointer font-bold uppercase text-[9px] flex items-center justify-center gap-1.5"
                                >
                                    <Zap size={11} className="text-yellow-500" /> Switch Turn
                                </button>
                                <button
                                    onClick={() => setWinnerInstantly('PLAYER')}
                                    className="py-2 bg-green-950/40 border border-green-900/40 text-green-400 rounded hover:bg-green-900/30 cursor-pointer font-bold uppercase text-[9px] flex items-center justify-center gap-1.5"
                                >
                                    <Award size={11} /> Win Player
                                </button>
                                <button
                                    onClick={() => setWinnerInstantly('DEALER')}
                                    className="py-2 bg-red-950/40 border border-red-900/40 text-red-400 rounded hover:bg-red-900/30 cursor-pointer font-bold uppercase text-[9px] flex items-center justify-center gap-1.5"
                                    style={{ gridColumn: 'span 2' }}
                                >
                                    <Award size={11} /> Win Dealer / Opponent
                                </button>
                            </div>
                        </div>

                        <div className="text-[8px] text-stone-600 uppercase font-bold tracking-widest pt-2 border-t border-stone-900 text-center">
                            Phase: {gameState.phase} | Owner: {gameState.turnOwner}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
