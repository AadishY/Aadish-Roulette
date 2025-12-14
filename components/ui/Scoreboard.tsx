import React, { useEffect, useState } from 'react';
import { X, Trophy, Activity, Target, Zap, Skull, Swords } from 'lucide-react';
import { GameStats, getStoredStats } from '../../utils/statsManager';
import { audioManager } from '../../utils/audioManager';

interface ScoreboardProps {
    onClose: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ onClose }) => {
    const [stats, setStats] = useState<GameStats | null>(null);

    useEffect(() => {
        setStats(getStoredStats());
    }, []);

    if (!stats) return null;

    const totalGames = stats.wins + stats.losses;
    const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;
    const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-lg max-h-[90vh] bg-stone-900 border border-stone-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col relative overflow-hidden rounded-xl ring-1 ring-white/10">

                {/* Header */}
                <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950 flex-none safe-top">
                    <div className="flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={18} />
                        <h2 className="text-base sm:text-2xl font-black text-stone-200 tracking-widest uppercase">CAREER STATS</h2>
                    </div>
                    <button
                        onClick={() => {
                            audioManager.playSound('click');
                            onClose();
                        }}
                        className="p-1 text-stone-500 hover:text-white hover:bg-red-900/50 rounded transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">

                    {/* Main Stats - Wins/Losses/WinRate */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-stone-800/50 p-3 border border-stone-700/50 rounded flex flex-col items-center justify-center aspect-video">
                            <div className="text-stone-500 text-[8px] sm:text-[10px] font-bold uppercase mb-1">WINS</div>
                            <div className="text-2xl sm:text-4xl font-black text-green-500">{stats.wins}</div>
                        </div>
                        <div className="bg-stone-800/50 p-3 border border-stone-700/50 rounded flex flex-col items-center justify-center aspect-video">
                            <div className="text-stone-500 text-[8px] sm:text-[10px] font-bold uppercase mb-1">LOSSES</div>
                            <div className="text-2xl sm:text-4xl font-black text-red-500">{stats.losses}</div>
                        </div>
                        <div className="bg-stone-800/50 p-3 border border-stone-700/50 rounded flex flex-col items-center justify-center aspect-video">
                            <div className="text-stone-500 text-[8px] sm:text-[10px] font-bold uppercase mb-1">WIN RATE</div>
                            <div className="text-2xl sm:text-4xl font-black text-white">{winRate}<span className="text-sm align-top">%</span></div>
                        </div>
                    </div>

                    {/* Performance Grid */}
                    <div className="space-y-2">
                        <h3 className="text-stone-500 font-bold tracking-[0.2em] uppercase text-[10px] border-b border-stone-800 pb-1">Combat Performance</h3>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="bg-stone-950 p-2 border border-stone-800 rounded flex flex-col items-center">
                                <Activity className="text-blue-500 mb-1" size={14} />
                                <div className="text-sm sm:text-xl font-black text-white">{stats.totalRounds}</div>
                                <div className="text-[7px] text-stone-500 font-bold uppercase">Rounds</div>
                            </div>
                            <div className="bg-stone-950 p-2 border border-stone-800 rounded flex flex-col items-center">
                                <Target className="text-red-500 mb-1" size={14} />
                                <div className="text-sm sm:text-xl font-black text-white">{accuracy}%</div>
                                <div className="text-[7px] text-stone-500 font-bold uppercase">Accuracy</div>
                            </div>
                            <div className="bg-stone-950 p-2 border border-stone-800 rounded flex flex-col items-center">
                                <Swords className="text-orange-500 mb-1" size={14} />
                                <div className="text-sm sm:text-xl font-black text-white">{stats.damageDealt}</div>
                                <div className="text-[7px] text-stone-500 font-bold uppercase">Damage</div>
                            </div>
                            <div className="bg-stone-950 p-2 border border-stone-800 rounded flex flex-col items-center">
                                <Skull className="text-purple-500 mb-1" size={14} />
                                <div className="text-sm sm:text-xl font-black text-white">{stats.highestRound}</div>
                                <div className="text-[7px] text-stone-500 font-bold uppercase">Best Rd</div>
                            </div>
                        </div>
                    </div>

                    {/* Item Stats */}
                    <div className="space-y-2">
                        <h3 className="text-stone-500 font-bold tracking-[0.2em] uppercase text-[10px] border-b border-stone-800 pb-1">Tactics</h3>
                        <div className="flex gap-2 text-left">
                            <div className="flex-1 bg-stone-950 p-3 border border-stone-800 rounded flex flex-col justify-center">
                                <div className="text-xl sm:text-2xl font-black text-stone-200">{stats.itemsUsed}</div>
                                <div className="text-[7px] text-stone-500 font-bold uppercase">Total Items Used</div>
                            </div>
                            <div className="flex-1 bg-stone-950 p-3 border border-stone-800 rounded flex flex-col justify-center">
                                <div className="text-xl sm:text-2xl font-black text-stone-200">{stats.itemPoints}</div>
                                <div className="text-[7px] text-stone-500 font-bold uppercase">Tactical Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent History - Limit to 8 for compact view */}
                    <div className="space-y-2">
                        <h3 className="text-stone-500 font-bold tracking-[0.2em] uppercase text-[10px] border-b border-stone-800 pb-1">Match History</h3>
                        <div className="space-y-1">
                            {stats.matchHistory && stats.matchHistory.length > 0 ? (
                                stats.matchHistory.slice(0, 8).map((match, i) => (
                                    <div key={i} className="bg-stone-950/50 hover:bg-stone-900 p-2 border border-stone-800/50 rounded flex justify-between items-center text-[10px] sm:text-xs transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-black w-6 text-center ${match.result === 'WIN' ? 'text-green-500' : 'text-red-500'}`}>
                                                {match.result === 'WIN' ? 'W' : 'L'}
                                            </span>
                                            {match.isHardMode && (
                                                <div className="flex items-center gap-1 bg-red-950/30 px-1.5 py-0.5 rounded border border-red-900/50" title="Hard Mode">
                                                    <Skull size={10} className="text-red-500" />
                                                    <span className="text-[8px] text-red-400 font-bold hidden sm:inline">HARD</span>
                                                </div>
                                            )}
                                            <span className="text-stone-700">|</span>
                                            <span className="text-stone-500 font-mono">{match.timestamp ? new Date(match.timestamp).getDate() + '/' + (new Date(match.timestamp).getMonth() + 1) : '-'}</span>
                                        </div>
                                        <div className="flex gap-3 text-stone-400 font-mono text-right">
                                            <span>R: <span className="text-stone-300 font-bold">{match.roundsSurvived}</span></span>
                                            <span>S: <span className="text-yellow-500 font-bold">{match.totalScore?.toLocaleString() || 0}</span></span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-stone-600 italic text-center text-[10px] py-4">No match history found</div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-3 border-t border-stone-800 bg-stone-950 flex justify-center safe-bottom rounded-b-xl">
                    <button
                        onClick={() => {
                            audioManager.playSound('click');
                            onClose();
                        }}
                        className="px-8 py-2 bg-stone-100 hover:bg-white text-black font-black text-xs sm:text-sm tracking-widest active:scale-95 transition-all shadow-lg rounded-sm"
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};
