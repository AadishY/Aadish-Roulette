import React, { useEffect, useState, useRef } from 'react';
import { Skull, Power, Trophy, Target, Zap, Activity } from 'lucide-react';
import { TurnOwner } from '../../types';
import { MatchStats, GameStats, getStoredStats, calculateMatchScore, saveGameStats } from '../../utils/statsManager';

interface GameOverScreenProps {
    winner: TurnOwner | null;
    onResetGame: (toMenu: boolean) => void;
    matchData?: MatchStats;
}

const WIN_QUOTES = [
  "DEATH MISSED ITS MARK.",
  "LUCK WAS MERELY AN OPTION.",
  "ONE MORE BREATH, ONE MORE VICTORY.",
  "SHEER WILL OUTLIVED THE BULLET.",
  "FORTUNE SMILED BLOODLESSLY.",
  "SURVIVAL IS YOUR TROPHY.",
  "YOU MAY BREATHE AGAIN.",

];


const LOSS_QUOTES = [
  "YOUR LUCK RAN DRY.",
  "CONNECTION TERMINATED. GAME OVER.",
  "VOID ACCEPTED YOU.",
  "SIGNAL LOST. LIGHTS OUT.",
  "SYSTEM FAILURE: HEART STOPPED.",
  "CONGRATS. YOU FOUND THE BULLET.",
  "PRESS ALT+F4 NEXT TIME",
];


export const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, onResetGame, matchData }) => {
    const [stats, setStats] = useState<GameStats | null>(null);
    const [finalScore, setFinalScore] = useState(0);
    const [displayedScore, setDisplayedScore] = useState(0);
    const [quote, setQuote] = useState('');
    const hasSavedRef = useRef(false);

    useEffect(() => {
        // Pick Quote
        const quotes = winner === 'PLAYER' ? WIN_QUOTES : LOSS_QUOTES;
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

        if (matchData && !hasSavedRef.current) {
            // Calculate and save
            saveGameStats(matchData);
            hasSavedRef.current = true;
            const score = calculateMatchScore(matchData);
            setFinalScore(score);
            setStats(getStoredStats());
        } else if (!matchData) {
            setStats(getStoredStats());
        }
    }, [matchData, winner]);

    useEffect(() => {
        if (finalScore === 0) return;

        let startTime: number;
        let animationFrame: number;
        const duration = 2000; // 2 seconds

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percent = Math.min(progress / duration, 1);

            // Ease Out Quart: 1 - pow(1 - x, 4)
            const ease = 1 - Math.pow(1 - percent, 4);

            setDisplayedScore(Math.floor(finalScore * ease));

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [finalScore]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 pointer-events-auto overflow-y-auto py-2 text-stone-200 font-mono select-none">
            <div className="relative mb-2 text-center animate-in fade-in zoom-in duration-500 px-4">
                <div className={`text-3xl min-[400px]:text-4xl md:text-7xl font-black tracking-tighter ${winner === 'PLAYER' ? 'text-green-500 drop-shadow-[0_0_15px_rgba(0,255,0,0.3)]' : 'text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]'}`}>
                    {winner === 'PLAYER' ? 'VICTORY' : 'ELIMINATED'}
                </div>
                <div className="text-stone-500 italic text-[10px] md:text-sm mt-0 tracking-widest uppercase opacity-80">
                    "{quote}"
                </div>
                <div className="text-2xl md:text-3xl text-yellow-500 font-black mt-1 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                    SCORE: {displayedScore.toLocaleString()}
                </div>
            </div>

            {/* Match Stats Grid - Super Compact */}
            {matchData && (
                <div className="grid grid-cols-4 gap-2 mb-3 w-full max-w-2xl px-2">
                    <div className="bg-stone-900/50 border border-stone-800 p-1 md:p-2 flex flex-col items-center hover:bg-stone-900 transition-colors">
                        <Activity className="text-blue-500 mb-0.5" size={14} />
                        <div className="text-stone-500 text-[7px] md:text-[9px] font-bold uppercase tracking-wider">Survived</div>
                        <div className="text-sm md:text-xl font-black text-white">{matchData.roundsSurvived}</div>
                    </div>
                    <div className="bg-stone-900/50 border border-stone-800 p-1 md:p-2 flex flex-col items-center hover:bg-stone-900 transition-colors">
                        <Target className="text-red-500 mb-0.5" size={14} />
                        <div className="text-stone-500 text-[7px] md:text-[9px] font-bold uppercase tracking-wider">Accuracy</div>
                        <div className="text-sm md:text-xl font-black text-white">
                            {matchData.shotsFired > 0 ? Math.round((matchData.shotsHit / matchData.shotsFired) * 100) : 0}%
                        </div>
                    </div>
                    <div className="bg-stone-900/50 border border-stone-800 p-1 md:p-2 flex flex-col items-center hover:bg-stone-900 transition-colors">
                        <Zap className="text-yellow-500 mb-0.5" size={14} />
                        <div className="text-stone-500 text-[7px] md:text-[9px] font-bold uppercase tracking-wider">Items</div>
                        <div className="text-sm md:text-xl font-black text-white">
                            {Object.values(matchData.itemsUsed).reduce((a, b) => a + b, 0)}
                        </div>
                    </div>
                    <div className="bg-stone-900/50 border border-stone-800 p-1 md:p-2 flex flex-col items-center hover:bg-stone-900 transition-colors">
                        <Skull className="text-purple-500 mb-0.5" size={14} />
                        <div className="text-stone-500 text-[7px] md:text-[9px] font-bold uppercase tracking-wider">Damage</div>
                        <div className="text-sm md:text-xl font-black text-white">{matchData.damageDealt}</div>
                    </div>
                </div>
            )}

            {/* Lifetime Stats Footer - Super Compact */}
            {stats && (
                <div className="mb-3 w-full max-w-xl text-stone-500 font-mono text-center border-t border-stone-800 py-2 px-2 bg-stone-950/50">
                    <div className="text-[8px] tracking-[0.2em] mb-1 uppercase text-stone-600 font-bold">LIFETIME RECORD</div>
                    <div className="flex gap-4 justify-center items-center flex-wrap">
                        <div className="flex flex-col items-center">
                            <span className="text-sm md:text-lg font-black text-green-600">{stats.wins}</span>
                            <span className="text-[6px] font-bold">WINS</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm md:text-lg font-black text-red-600">{stats.losses}</span>
                            <span className="text-[6px] font-bold">LOSSES</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm md:text-lg font-black text-stone-300">{stats.highestRound}</span>
                            <span className="text-[6px] font-bold">BEST</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm md:text-lg font-black text-yellow-600">{stats.itemPoints}</span>
                            <span className="text-[6px] font-bold">PTS</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-2 w-full max-w-xs px-4 items-center justify-center">
                <button onClick={() => onResetGame(true)} className="w-full px-6 py-2 bg-stone-100 text-black font-black text-xs md:text-sm hover:bg-white hover:scale-105 transition-all tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                    <Power size={14} /> MAIN MENU
                </button>
            </div>
        </div>
    );
};
