import React, { useEffect, useState, useRef } from 'react';
import { Skull, Power, Trophy, Target, Zap, Activity, RotateCcw } from 'lucide-react';
import { TurnOwner } from '../../types';
import { MatchStats, GameStats, getStoredStats, calculateMatchScore, saveGameStats } from '../../utils/statsManager';
import { audioManager } from '../../utils/audioManager';
import { Icons } from './Icons';

interface GameOverScreenProps {
    winner: TurnOwner | null;
    onResetGame: (toMenu: boolean) => void;
    matchData?: MatchStats;
    isDebugUsed?: boolean; // Added
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


export const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, onResetGame, matchData, isDebugUsed }) => {
    const [stats, setStats] = useState<GameStats | null>(null);
    const [finalScore, setFinalScore] = useState(0);
    const [displayedScore, setDisplayedScore] = useState(0);
    const [quote, setQuote] = useState('');
    const hasSavedRef = useRef(false);

    useEffect(() => {
        const quotes = winner === 'PLAYER' ? WIN_QUOTES : LOSS_QUOTES;
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

        if (matchData) {
            if (winner === 'PLAYER') {
                matchData.result = 'WIN';
            } else if (winner === 'DEALER') {
                matchData.result = 'LOSS';
            }
        }

        if (matchData && !hasSavedRef.current) {
            // Check if current user is developer (devs can save stats even with debug)
            let isDeveloper = false;
            try {
                const loggedInUser = localStorage.getItem('aadish_roulette_logged_in_user');
                if (loggedInUser) {
                    const u = JSON.parse(loggedInUser);
                    isDeveloper = u.username?.toLowerCase() === (import.meta.env.VITE_DEV_USERNAME || 'aadish').toLowerCase();
                }
            } catch (e) {}

            if (!isDebugUsed || isDeveloper) {
                saveGameStats(matchData);
            } else {
                console.log("Stats NOT saved: debug cheats used.");
            }
            hasSavedRef.current = true;
            const score = calculateMatchScore(matchData);
            setFinalScore(score);
            setStats(getStoredStats());
        } else if (!matchData) {
            setStats(getStoredStats());
        }
    }, [matchData, winner, isDebugUsed]);

    useEffect(() => {
        if (finalScore === 0) return;
        let startTime: number;
        let animationFrame: number;
        const duration = 2500;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percent = Math.min(progress / duration, 1);
            const ease = 1 - Math.pow(1 - percent, 4);
            setDisplayedScore(Math.floor(finalScore * ease));
            if (progress < duration) animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [finalScore]);

    const getRankInfo = (score: number) => {
        if (score >= 3000) return { rank: 'S', label: 'DEATH DEFIER', color: 'text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]' };
        if (score >= 2000) return { rank: 'A', label: 'SURVIVALIST', color: 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]' };
        if (score >= 1000) return { rank: 'B', label: 'LUCKY SHOT', color: 'text-yellow-500' };
        if (score > 0) return { rank: 'C', label: 'CORPSE', color: 'text-stone-400' };
        return { rank: 'F', label: 'COWARD', color: 'text-stone-600' };
    };

    const rankInfo = getRankInfo(finalScore);

    return (
        <div className="absolute inset-0 z-[300] flex flex-col items-center justify-start bg-black/90 backdrop-blur-xl pointer-events-auto overflow-y-auto py-12 md:py-16 text-stone-200 font-sans select-none animate-in fade-in duration-1000">

            {/* Background Atmosphere */}
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${winner === 'PLAYER' ? 'bg-green-500/5' : 'bg-red-500/10'}`}>
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,${winner === 'PLAYER' ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.15)'},transparent_70%)] animate-pulse`} />
                <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uWU0WMrQmInJWC/giphy.gif')] opacity-[0.03] mix-blend-screen" />
            </div>

            {/* Main Header */}
            <div className="relative mb-12 text-center animate-in zoom-in-95 fade-in duration-1000 px-4">
                <div className={`text-6xl md:text-9xl font-black tracking-tighter mb-4 px-2 relative inline-block ${winner === 'PLAYER' ? 'text-green-500' : 'text-red-700'}`}>
                    <span className="relative z-10">{winner === 'PLAYER' ? 'VICTORY' : 'ELIMINATED'}</span>
                    <div className={`absolute -inset-x-8 inset-y-4 blur-3xl -z-10 opacity-30 ${winner === 'PLAYER' ? 'bg-green-500' : 'bg-red-600'}`} />
                </div>

                <div className="flex flex-col items-center gap-4">
                    <p className="text-stone-400 font-black italic text-xs md:text-base tracking-[0.4em] uppercase max-w-xl mx-auto leading-relaxed">
                        — {quote} —
                    </p>

                    <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <div className="px-8 py-4 bg-stone-900/40 backdrop-blur-md border border-white/5 rounded-2xl w-56">
                            <div className="text-[10px] text-stone-500 font-bold tracking-[0.3em] uppercase mb-1">Combat Rating</div>
                            <div className="text-3xl md:text-4xl text-yellow-500 font-black tracking-tight tabular-nums drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                                {displayedScore.toLocaleString()}
                            </div>
                        </div>
                        {finalScore > 0 && (
                            <div className="px-8 py-3 bg-stone-900/40 backdrop-blur-md border border-white/5 rounded-2xl flex items-center gap-4 w-56 text-left">
                                <div className={`text-4xl md:text-5xl font-black ${rankInfo.color} select-none`}>
                                    {rankInfo.rank}
                                </div>
                                <div>
                                    <div className="text-[9px] text-stone-500 font-bold tracking-widest uppercase">Class Rank</div>
                                    <div className="text-[10px] text-white font-extrabold tracking-wider uppercase">{rankInfo.label}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {matchData?.isHardMode && (
                    <div className="mt-8 inline-flex items-center gap-3 bg-red-950/40 border border-red-700/50 px-8 py-3 rounded-xl animate-pulse">
                        <Skull className="text-red-600" size={24} />
                        <span className="text-red-500 font-black tracking-[0.6em] text-sm md:text-lg uppercase">Protocols Failed</span>
                        <Skull className="text-red-600" size={24} />
                    </div>
                )}
            </div>

            {/* Match Stats Grid */}
            {matchData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-4xl px-6 animate-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <div className="bg-stone-900/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col items-center group hover:bg-stone-900/60 transition-all">
                        <Activity className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={20} />
                        <div className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Duration</div>
                        <div className="text-2xl md:text-3xl font-black text-white">{matchData.roundsSurvived}<span className="text-xs text-stone-600 ml-1">RDS</span></div>
                    </div>
                    <div className="bg-stone-900/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col items-center group hover:bg-stone-900/60 transition-all">
                        <Target className="text-red-500 mb-2 group-hover:scale-110 transition-transform" size={20} />
                        <div className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Accuracy</div>
                        <div className="text-2xl md:text-3xl font-black text-white">
                            {matchData.shotsFired > 0 ? Math.round((matchData.shotsHit / matchData.shotsFired) * 100) : 0}<span className="text-xs text-stone-600 ml-1">%</span>
                        </div>
                    </div>
                    <div className="bg-stone-900/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col items-center group hover:bg-stone-900/60 transition-all">
                        <Zap className="text-yellow-500 mb-2 group-hover:scale-110 transition-transform" size={20} />
                        <div className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Tactics</div>
                        <div className="text-2xl md:text-3xl font-black text-white">
                            {Object.values(matchData.itemsUsed).reduce((a, b) => a + b, 0)}<span className="text-xs text-stone-600 ml-1">USE</span>
                        </div>
                    </div>
                    <div className="bg-stone-900/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col items-center group hover:bg-stone-900/60 transition-all">
                        <Skull className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" size={20} />
                        <div className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Lethality</div>
                        <div className="text-2xl md:text-3xl font-black text-white">{matchData.damageDealt}</div>
                    </div>
                </div>
            )}

            {/* Extended Match Analysis */}
            {matchData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-4xl px-6 mb-12 animate-in slide-in-from-bottom-12 duration-1000 delay-500">
                    
                    {/* Left Column: Score Breakdown & Achievements */}
                    <div className="bg-stone-900/30 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col gap-6 text-left">
                        <div>
                            <h3 className="text-xs text-stone-500 font-bold tracking-[0.4em] uppercase mb-4 flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-500" /> Score Breakdown
                            </h3>
                            <div className="space-y-3 font-mono text-xs md:text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-stone-400 font-sans">Match Outcome:</span>
                                    <span className={matchData.result === 'WIN' ? 'text-green-400 font-bold' : 'text-red-500 font-bold'}>
                                        {matchData.result === 'WIN' ? '+1,000 pts' : '+0 pts'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-stone-400 font-sans">Rounds Survived ({matchData.roundsSurvived}):</span>
                                    <span className="text-stone-200">+{matchData.roundsSurvived * 100} pts</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-stone-400 font-sans">Shots Hit ({matchData.shotsHit}):</span>
                                    <span className="text-stone-200">+{matchData.shotsHit * 20} pts</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-stone-400 font-sans">Damage Dealt ({matchData.damageDealt}):</span>
                                    <span className="text-stone-200">+{matchData.damageDealt * 50} pts</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-stone-400 font-sans">Tactics (Items Used: {Object.values(matchData.itemsUsed).reduce((a,b)=>a+b, 0)}):</span>
                                    <span className="text-stone-200">+{Object.values(matchData.itemsUsed).reduce((a,b)=>a+b, 0) * 15} pts</span>
                                </div>
                                {matchData.selfShots > 0 && (
                                    <div className="flex justify-between border-b border-white/5 pb-2 text-red-500">
                                        <span className="font-sans">Self-Shots Penalty ({matchData.selfShots}):</span>
                                        <span>-{matchData.selfShots * 50} pts</span>
                                    </div>
                                )}
                                {matchData.isHardMode && (
                                    <div className="flex justify-between border-b border-red-500/20 pb-2 text-red-400 font-bold">
                                        <span className="font-sans tracking-wider uppercase text-[10px]">HARD MODE MULTIPLIER:</span>
                                        <span>x2</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 text-base md:text-lg font-black text-yellow-500">
                                    <span className="font-sans uppercase">Total Rating Score:</span>
                                    <span className="drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">{calculateMatchScore(matchData).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Achievements / Badges Section */}
                        <div className="border-t border-white/5 pt-4">
                            <h4 className="text-[10px] text-stone-500 font-bold tracking-[0.3em] uppercase mb-3">Service Commendations</h4>
                            <div className="flex flex-wrap gap-2">
                                {matchData.result === 'WIN' && matchData.damageTaken === 0 && (
                                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] font-bold rounded-lg tracking-widest uppercase animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                                        🥇 PERFECT SURVIVAL
                                    </span>
                                )}
                                {Object.values(matchData.itemsUsed).reduce((a,b)=>a+b, 0) >= 10 && (
                                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[9px] font-bold rounded-lg tracking-widest uppercase">
                                        🧠 GRANDMASTER TACTICIAN
                                    </span>
                                )}
                                {matchData.shotsFired > 0 && (matchData.shotsHit / matchData.shotsFired) >= 0.8 && (
                                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-bold rounded-lg tracking-widest uppercase">
                                        🎯 ELITE SHARPSHOOTER
                                    </span>
                                )}
                                {matchData.selfShots >= 3 && (
                                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded-lg tracking-widest uppercase">
                                        🎲 DESPERATE GAMBLER
                                    </span>
                                )}
                                {matchData.isHardMode && matchData.result === 'WIN' && (
                                    <span className="px-3 py-1 bg-red-950/40 border border-red-700/50 text-red-500 text-[9px] font-black rounded-lg tracking-widest uppercase animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                                        💀 HELL WALKER
                                    </span>
                                )}
                                {(!matchData.isHardMode && matchData.result === 'WIN') && (
                                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-bold rounded-lg tracking-widest uppercase">
                                        🎖️ INITIATE CONTRACT
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tactics Breakdown & Match History */}
                    <div className="flex flex-col gap-6">
                        {/* Tactics Breakdown */}
                        <div className="bg-stone-900/30 backdrop-blur-md border border-white/5 p-6 rounded-2xl text-left flex-1">
                            <h3 className="text-xs text-stone-500 font-bold tracking-[0.4em] uppercase mb-4 flex items-center gap-2">
                                <Zap size={14} className="text-yellow-500" /> Tactics Breakdown
                            </h3>
                            {Object.keys(matchData.itemsUsed).length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.entries(matchData.itemsUsed).map(([item, count]) => {
                                        const ItemIcon = Icons[item as keyof typeof Icons] || Icons.Beer;
                                        return (
                                            <div key={item} className="flex items-center gap-2.5 p-2 bg-stone-950/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center border border-stone-800 text-stone-300">
                                                    <ItemIcon size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-black text-stone-200 tracking-wider truncate uppercase">{item}</div>
                                                    <div className="text-[9px] font-mono text-stone-500">USED: {count}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-stone-500 font-mono text-xs py-6 text-center italic border border-dashed border-white/5 rounded-xl">
                                    No items deployed. Pure guts.
                                </div>
                            )}

                            {/* Most Used Item Badge */}
                            {Object.keys(matchData.itemsUsed).length > 0 && (
                                <div className="mt-4 p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl flex items-center gap-3">
                                    <div className="text-purple-400 font-black text-xs tracking-widest uppercase">Preferred Instrument:</div>
                                    <div className="px-2.5 py-0.5 bg-purple-900/50 border border-purple-500/30 rounded text-[9px] font-mono text-purple-300 uppercase tracking-widest font-black">
                                        {Object.entries(matchData.itemsUsed).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent History log */}
                        <div className="bg-stone-900/30 backdrop-blur-md border border-white/5 p-6 rounded-2xl text-left">
                            <h3 className="text-xs text-stone-500 font-bold tracking-[0.4em] uppercase mb-4 flex items-center gap-2">
                                <Activity size={14} className="text-blue-500" /> Recent Operations
                            </h3>
                            {stats && stats.matchHistory && stats.matchHistory.length > 0 ? (
                                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {stats.matchHistory.slice(0, 5).map((match, mi) => (
                                        <div key={mi} className="flex items-center justify-between p-2.5 bg-stone-950/30 border border-white/5 rounded-xl text-xs font-mono">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-2.5 h-2.5 rounded-full ${match.result === 'WIN' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-600'}`} />
                                                <span className="font-sans font-bold text-stone-300">{match.result === 'WIN' ? 'WIN' : 'LOSS'}</span>
                                                <span className="text-[10px] text-stone-600">|</span>
                                                <span className={`text-[9px] font-sans px-1.5 py-0.5 rounded ${match.isHardMode ? 'bg-red-950/40 border border-red-900/30 text-red-500' : 'bg-stone-800 text-stone-400'}`}>
                                                    {match.isHardMode ? 'HARD' : 'NORMAL'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px]">
                                                <span className="text-stone-500">{match.roundsSurvived} RDS</span>
                                                <span className="text-yellow-500 font-black">{match.totalScore.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-stone-500 font-mono text-xs py-6 text-center italic border border-dashed border-white/5 rounded-xl">
                                    No entries found in archive.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Lifetime Record */}
            {stats && (
                <div className="mb-12 w-full max-w-2xl bg-stone-900/20 backdrop-blur-xl border-y border-white/5 py-6 px-8 animate-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <div className="text-[10px] tracking-[0.6em] mb-6 uppercase text-stone-600 font-black text-center">Permanent Service Record</div>
                    <div className="flex justify-around items-center">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-green-500">{stats.wins}</span>
                            <span className="text-[9px] font-black tracking-widest text-stone-600 uppercase">Wins</span>
                        </div>
                        <div className="w-[1px] h-8 bg-stone-800" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-red-700">{stats.losses}</span>
                            <span className="text-[9px] font-black tracking-widest text-stone-600 uppercase">Losses</span>
                        </div>
                        <div className="w-[1px] h-8 bg-stone-800" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-stone-100">{stats.highestRound}</span>
                            <span className="text-[9px] font-black tracking-widest text-stone-600 uppercase">Best</span>
                        </div>
                        <div className="w-[1px] h-8 bg-stone-800" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-yellow-500">{stats.itemPoints}</span>
                            <span className="text-[9px] font-black tracking-widest text-stone-600 uppercase">Points</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg px-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700">
                <button
                    onClick={() => {
                        audioManager.playSound('click');
                        onResetGame(false);
                    }}
                    className="flex-1 h-16 bg-white text-black font-black text-lg hover:bg-stone-200 hover:scale-105 active:scale-95 transition-all tracking-[0.4em] flex items-center justify-center gap-3 rounded-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] uppercase"
                >
                    <RotateCcw size={20} /> Initiate
                </button>
                <button
                    onClick={() => {
                        audioManager.playSound('click');
                        onResetGame(true);
                    }}
                    className="flex-1 h-16 bg-stone-900/40 backdrop-blur-md border border-stone-800 text-stone-400 font-black text-lg hover:text-white hover:border-white hover:bg-white/5 hover:scale-105 active:scale-95 transition-all tracking-[0.4em] flex items-center justify-center gap-3 rounded-2xl uppercase"
                >
                    <Power size={20} /> Logout
                </button>
            </div>
        </div>
    );
};
