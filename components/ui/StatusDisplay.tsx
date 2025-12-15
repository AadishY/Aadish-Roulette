import React from 'react';
import { PlayerState, GameState } from '../../types';
import { Icons } from './Icons';

interface StatusDisplayProps {
    player: PlayerState;
    dealer: PlayerState;
    playerName: string;
    gameState: GameState;
}

const StatusDisplayComponent: React.FC<StatusDisplayProps> = ({ player, dealer, playerName, gameState }) => {
    return (
        <div className="flex justify-between items-start w-full pointer-events-none">
            {/* Player Stats */}
            <div className="flex flex-col items-start w-1/3">
                <span className="text-[8px] md:text-xs font-bold tracking-[0.3em] text-stone-500 mb-0.5 md:mb-2 uppercase truncate max-w-[80px] md:max-w-full">{playerName || 'YOU'}</span>
                <div className="flex gap-0.5 md:gap-2 mb-2">
                    {[...Array(player.maxHp)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-3 md:w-4 md:h-12 flex items-center justify-center transition-all duration-300 ${i < player.hp ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-stone-900 border border-stone-800'}`}>
                            {i >= player.hp && <div className="w-full h-[1px] bg-stone-800 rotate-45" />}
                        </div>
                    ))}
                </div>
                {gameState.isHardMode && gameState.hardModeState && (
                    <div className="text-sm md:text-xl text-red-500 font-black tracking-widest mt-1 drop-shadow-md">
                        ROUND {gameState.hardModeState.round} <span className="text-red-900">/ 3</span>
                    </div>
                )}
            </div>

            {/* Center Turn Indicator */}
            <div className="text-center mt-0.5 md:mt-2 flex-1">
                <div className={`text-xs md:text-3xl font-black tracking-widest transition-colors duration-500 whitespace-nowrap ${gameState.turnOwner === 'PLAYER' ? 'text-green-500/80 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'text-red-500/80 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]'}`}>
                    {gameState.turnOwner === 'PLAYER' ? 'YOUR TURN' : 'DEALER TURN'}
                </div>
                <div className="text-stone-600 text-[10px] md:text-lg mt-0.5 md:mt-2 font-mono tracking-widest">
                    {gameState.liveCount + gameState.blankCount} SHELLS
                </div>
            </div>

            {/* Dealer Stats */}
            <div className="flex flex-col items-end w-1/3">
                <span className="text-[8px] md:text-xs font-bold tracking-[0.3em] text-stone-500 mb-0.5 md:mb-2">DEALER</span>
                <div className="flex gap-0.5 md:gap-2 mb-2">
                    {[...Array(dealer.maxHp)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-3 md:w-4 md:h-12 flex items-center justify-center transition-all duration-300 ${i < dealer.hp ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-stone-900 border border-stone-800'}`}>
                            {i >= dealer.hp && <div className="w-full h-[1px] bg-stone-800 rotate-45" />}
                        </div>
                    ))}
                </div>
                <div className="flex gap-0.5 mt-0.5 md:mt-4 flex-wrap justify-end max-w-[80px] md:max-w-[200px]">
                    {dealer.items.map((item, i) => (
                        <div key={i} className="w-2.5 h-2.5 md:w-8 md:h-8 bg-stone-900 border border-stone-700 flex items-center justify-center opacity-70">
                            {item === 'BEER' && <Icons.Beer size={8} className="md:w-3.5 md:h-3.5 text-amber-500" />}
                            {item === 'CIGS' && <Icons.Cigs size={8} className="md:w-3.5 md:h-3.5 text-red-500" />}
                            {item === 'GLASS' && <Icons.Glass size={8} className="md:w-3.5 md:h-3.5 text-cyan-500" />}
                            {item === 'CUFFS' && <Icons.Cuffs size={8} className="md:w-3.5 md:h-3.5 text-stone-400" />}
                            {item === 'SAW' && <Icons.Saw size={8} className="md:w-3.5 md:h-3.5 text-orange-600" />}
                            {item === 'PHONE' && <Icons.Phone size={8} className="md:w-3.5 md:h-3.5 text-blue-300" />}
                            {item === 'INVERTER' && <Icons.Inverter size={8} className="md:w-3.5 md:h-3.5 text-green-400" />}
                            {item === 'ADRENALINE' && <Icons.Adrenaline size={8} className="md:w-3.5 md:h-3.5 text-pink-500" />}
                            {item === 'CHOKE' && <Icons.Choke size={8} className="md:w-3.5 md:h-3.5 text-stone-300" />}
                            {item === 'REMOTE' && <Icons.Remote size={8} className="md:w-3.5 md:h-3.5 text-red-500" />}
                            {item === 'BIG_INVERTER' && <Icons.BigInverter size={8} className="md:w-3.5 md:h-3.5 text-orange-500" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const StatusDisplay = React.memo(StatusDisplayComponent);