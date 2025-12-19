import React from 'react';
import { ItemType, GameState, CameraView, PlayerState } from '../../types';
import { Icons } from './Icons';
import { ITEM_DESCRIPTIONS } from '../../constants';
import { audioManager } from '../../utils/audioManager';

interface InventoryProps {
    player: PlayerState;
    dealer: PlayerState;
    gameState: GameState;
    cameraView: CameraView;
    isProcessing: boolean;
    onUseItem: (index: number) => void;
    disabled?: boolean; // For multiplayer when not your turn
    isGunHeld?: boolean;
}

const InventoryComponent: React.FC<InventoryProps> = ({ player, dealer, gameState, cameraView, isProcessing, onUseItem, disabled = false, isGunHeld = false }) => {
    return (
        <div className="flex-1 flex justify-center gap-1 pointer-events-auto h-full items-end">
            <div className="flex gap-1 md:gap-3 p-2 md:p-4 bg-gradient-to-t from-black/95 to-black/70 border-t border-l border-r border-white/10 backdrop-blur-3xl min-h-[40px] md:min-h-[140px] items-end overflow-x-auto md:overflow-visible max-w-full [&::-webkit-scrollbar]:hidden [scrollbar-width:none] rounded-t-[2rem] shadow-[0_-20px_80px_rgba(0,0,0,0.8)]">
                {player.items.map((item, idx) => {
                    const isCuffDisabled = item === 'CUFFS' && dealer.isHandcuffed;
                    const isUsageDisabled = disabled || gameState.phase !== 'PLAYER_TURN' || isGunHeld || isCuffDisabled || isProcessing;

                    return (
                        <div key={idx} className="group relative shrink-0">
                            <button
                                onClick={() => onUseItem(idx)}
                                onMouseEnter={() => !isUsageDisabled && audioManager.playSound('click')}
                                disabled={isUsageDisabled}
                                className={`w-14 h-18 md:w-24 md:h-32 bg-zinc-900/40 border-2 ${isCuffDisabled ? 'border-red-900/50 bg-red-950/10' : 'border-white/5'} flex flex-col items-center justify-center hover:bg-white/5 hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95 group-hover:-translate-y-4 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] duration-300 relative overflow-hidden rounded-xl ${!isUsageDisabled ? 'animate-[pulse_4s_infinite]' : 'grayscale'}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                {item === 'BEER' && <Icons.Beer className="text-amber-500 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'CIGS' && <Icons.Cigs className="text-red-500 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'GLASS' && <Icons.Glass className="text-cyan-500 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'CUFFS' && <Icons.Cuffs className="text-stone-400 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'SAW' && <Icons.Saw className="text-orange-600 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'PHONE' && <Icons.Phone className="text-blue-200 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'INVERTER' && <Icons.Inverter className="text-green-400 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'ADRENALINE' && <Icons.Adrenaline className="text-pink-600 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'CHOKE' && <Icons.Choke className="text-stone-300 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'REMOTE' && <Icons.Remote className="text-red-500 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'BIG_INVERTER' && <Icons.BigInverter className="text-orange-500 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                {item === 'CONTRACT' && <Icons.Contract className="text-red-700 mb-0 md:mb-2 w-4 h-4 md:w-6 md:h-6" />}
                                <span className="text-[6px] md:text-[8px] text-stone-300 font-black tracking-widest block text-center px-1 truncate w-full relative z-10 transition-colors group-hover:text-white">
                                    {{
                                        'BEER': 'BEER',
                                        'CIGS': 'CIGS',
                                        'GLASS': 'GLASS',
                                        'CUFFS': 'CUFFS',
                                        'SAW': 'SAW',
                                        'PHONE': 'PHONE',
                                        'INVERTER': 'INVERT',
                                        'ADRENALINE': 'ADRENALINE',
                                        'CHOKE': 'CHOKE',
                                        'REMOTE': 'REMOTE',
                                        'BIG_INVERTER': 'BIG INV',
                                        'CONTRACT': 'CONTRACT'
                                    }[item]}
                                </span>

                                {isCuffDisabled && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-red-600 font-bold text-lg pointer-events-none z-20">
                                        🚫
                                    </div>
                                )}
                            </button>

                            {/* Tooltip */}
                            <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 w-48 bg-stone-950/95 border border-stone-600 p-2 text-[10px] text-center hidden md:group-hover:block pointer-events-none z-[100] text-stone-200 shadow-[0_0_15px_rgba(0,0,0,1)]">
                                <div className="font-bold text-white mb-1 tracking-widest">
                                    {{
                                        'BEER': 'BEER',
                                        'CIGS': 'CIGARETTE',
                                        'GLASS': 'MAGNIFYING GLASS',
                                        'CUFFS': 'HANDCUFFS',
                                        'SAW': 'HAND SAW',
                                        'PHONE': 'BURNER PHONE',
                                        'INVERTER': 'POLARITY INVERTER',
                                        'ADRENALINE': 'ADRENALINE',
                                        'CHOKE': 'SHOTGUN CHOKE',
                                        'REMOTE': 'REMOTE CONTROL',
                                        'BIG_INVERTER': 'BIG INVERTER',
                                        'CONTRACT': 'BLOOD CONTRACT'
                                    }[item]}
                                </div>
                                {ITEM_DESCRIPTIONS[item]}
                                {isCuffDisabled && <div className="text-red-500 mt-1 font-bold border-t border-red-900 pt-1">ALREADY CUFFED</div>}
                                {isGunHeld && <div className="text-red-500 mt-1">DROP GUN FIRST</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const Inventory = React.memo(InventoryComponent);