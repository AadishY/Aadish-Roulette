import React from 'react';
import { Trophy, RotateCcw, Home, Skull } from 'lucide-react';

interface MultiplayerGameOverProps {
    winnerName: string;
    isWinner: boolean;
    onPlayAgain: () => void;
    onMainMenu: () => void;
}

export const MultiplayerGameOver: React.FC<MultiplayerGameOverProps> = ({
    winnerName,
    isWinner,
    onPlayAgain,
    onMainMenu
}) => {
    return (
        <div className="absolute inset-0 z-[100] bg-black/95 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 md:gap-8 p-4 md:p-8 animate-fade-in">
                {/* Icon */}
                <div className={`p-4 md:p-6 rounded-full ${isWinner ? 'bg-yellow-900/50' : 'bg-red-900/50'} animate-pulse`}>
                    {isWinner ? (
                        <Trophy size={48} className="text-yellow-500 md:w-20 md:h-20" />
                    ) : (
                        <Skull size={48} className="text-red-500 md:w-20 md:h-20" />
                    )}
                </div>

                {/* Winner Text */}
                <div className="text-center">
                    <div className={`text-3xl md:text-6xl font-black tracking-tight ${isWinner ? 'text-yellow-500' : 'text-red-500'}`}>
                        {isWinner ? 'VICTORY' : 'DEFEAT'}
                    </div>
                    <div className="text-lg md:text-2xl text-stone-400 mt-2 font-bold">
                        {isWinner ? 'YOU WIN!' : `${winnerName} WINS`}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-4 w-full max-w-xs md:max-w-none">
                    <button
                        onClick={onPlayAgain}
                        className="flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-green-900 border-2 border-green-600 text-green-400 font-black text-sm md:text-lg hover:bg-green-800 hover:text-white transition-all"
                    >
                        <RotateCcw size={20} />
                        PLAY AGAIN
                    </button>
                    <button
                        onClick={onMainMenu}
                        className="flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-stone-900 border-2 border-stone-600 text-stone-400 font-black text-sm md:text-lg hover:bg-stone-800 hover:text-white transition-all"
                    >
                        <Home size={20} />
                        MAIN MENU
                    </button>
                </div>
            </div>
        </div>
    );
};
