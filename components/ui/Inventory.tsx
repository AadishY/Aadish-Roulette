import React from 'react';
import { ItemType, GameState, CameraView, PlayerState } from '../../types';
import { Icons } from './Icons';
import { ITEM_DESCRIPTIONS } from '../../constants';

interface InventoryProps {
    player: PlayerState;
    dealer: PlayerState;
    gameState: GameState;
    cameraView: CameraView;
    isProcessing: boolean;
    onUseItem: (index: number) => void;
    disabled?: boolean; // For multiplayer when not your turn
}

export const Inventory: React.FC<InventoryProps> = ({ player, dealer, gameState, cameraView, isProcessing, onUseItem, disabled = false }) => {
    const isGunHeld = cameraView === 'GUN';

    return (
        <div className="flex-1 flex justify-end gap-1 pointer-events-auto h-full items-end">
            {/* Changed overflow-x-auto to md:overflow-visible to let tooltips pop out on desktop */}
            <div className="flex gap-1 md:gap-2 p-1 md:p-3 bg-black/80 border-t border-l border-r border-stone-800 backdrop-blur-sm min-h-[40px] md:min-h-[100px] items-end overflow-x-auto md:overflow-visible max-w-full [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {player.items.map((item, idx) => {
                    const isCuffDisabled = item === 'CUFFS' && dealer.isHandcuffed;
                    const isUsageDisabled = disabled || gameState.phase !== 'PLAYER_TURN' || isGunHeld || isCuffDisabled || isProcessing;

                    return (
                        <div key={idx} className="group relative shrink-0">
                            <button
                                onClick={() => onUseItem(idx)}
                                disabled={isUsageDisabled}
                                className={`w-7 h-8 md:w-20 md:h-24 bg-stone-900 border border-stone-700 flex flex-col items-center justify-center hover:bg-stone-800 hover:border-stone-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 group-hover:-translate-y-2 duration-200 ${isUsageDisabled ? 'opacity-30' : ''}`}
                            >
                                {item === 'BEER' && <Icons.Beer className="text-amber-500 mb-0 md:mb-2 w-3 h-3 md:w-6 md:h-6" />}
                                {item === 'CIGS' && <Icons.Cigs className="text-red-500 mb-0 md:mb-2 w-3 h-3 md:w-6 md:h-6" />}
                                {item === 'GLASS' && <Icons.Glass className="text-cyan-500 mb-0 md:mb-2 w-3 h-3 md:w-6 md:h-6" />}
                                {item === 'CUFFS' && <Icons.Cuffs className="text-stone-400 mb-0 md:mb-2 w-3 h-3 md:w-6 md:h-6" />}
                                {item === 'SAW' && <Icons.Saw className="text-orange-600 mb-0 md:mb-2 w-3 h-3 md:w-6 md:h-6" />}
                                <span className="text-[6px] md:text-[10px] text-stone-500 font-bold tracking-widest hidden md:block">{item}</span>
                            </button>

                            {/* Tooltip */}
                            <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 w-40 bg-stone-950/95 border border-stone-600 p-2 text-[10px] text-center hidden md:group-hover:block pointer-events-none z-[100] text-stone-200 shadow-[0_0_15px_rgba(0,0,0,1)]">
                                <div className="font-bold text-white mb-1 tracking-widest">{item}</div>
                                {ITEM_DESCRIPTIONS[item]}
                                {isCuffDisabled && <div className="text-red-500 mt-1">OPPONENT IS CUFFED</div>}
                                {isGunHeld && <div className="text-red-500 mt-1">DROP GUN FIRST</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};