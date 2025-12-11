import React from 'react';
import { Skull, Power } from 'lucide-react';
import { TurnOwner } from '../../types';

interface GameOverScreenProps {
    winner: TurnOwner | null;
    onResetGame: (toMenu: boolean) => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, onResetGame }) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 pointer-events-auto">
            <div className="relative mb-8 md:mb-12 text-center">
                <div className={`text-6xl md:text-9xl font-black tracking-tighter animate-pulse ${winner === 'PLAYER' ? 'text-green-500 drop-shadow-[0_0_15px_rgba(0,255,0,0.5)]' : 'text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]'}`}>
                    {winner === 'PLAYER' ? 'VICTORY' : 'ELIMINATED'}
                </div>
                <div className="text-lg md:text-2xl tracking-[0.5em] md:tracking-[1em] text-stone-500 font-bold mt-4 uppercase">
                    {winner === 'PLAYER' ? 'YOU WALK AWAY WITH THE PRIZE' : 'BETTER LUCK NEXT LIFE'}
                </div>
            </div>
            {winner === 'DEALER' && <Skull size={80} className="md:w-32 md:h-32 text-red-800 mb-8 md:mb-12 animate-bounce" />}
            {winner === 'PLAYER' && <div className="text-4xl mb-8 animate-bounce text-green-700">$ 1,000,000</div>}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-xl px-8 items-center justify-center">
                <button onClick={() => onResetGame(true)} className="w-full md:w-auto px-12 py-4 md:py-6 bg-stone-100 text-black font-black text-lg md:text-xl hover:bg-stone-300 transition-all tracking-widest flex items-center justify-center gap-3">
                    <Power size={20} /> MAIN MENU
                </button>
            </div>
        </div>
    );
};
