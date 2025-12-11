import React from 'react';
import { GameStateData } from '../hooks/useSocket';
import { Heart } from 'lucide-react';

interface MultiplayerHUDProps {
    gameState: GameStateData;
    myPlayerId: string;
}

export const MultiplayerHUD: React.FC<MultiplayerHUDProps> = ({ gameState, myPlayerId }) => {
    const sortedPlayers = gameState.playerOrder
        .map(id => gameState.players[id])
        .filter(p => p && p.isAlive !== false);

    return (
        <div className="flex flex-col gap-2 bg-black/70 backdrop-blur-sm p-2 md:p-3 border border-stone-800 max-w-[95vw] md:max-w-none">
            {/* Round Info - Compact */}
            <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs font-mono text-stone-500 border-b border-stone-800 pb-1">
                <span>RND {gameState.roundNumber}</span>
                <div className="flex gap-2">
                    <span className="text-red-500">{gameState.liveCount}L</span>
                    <span className="text-blue-500">{gameState.blankCount}B</span>
                </div>
            </div>

            {/* Players List - Mobile Optimized */}
            <div className="flex flex-wrap gap-2 md:gap-3">
                {sortedPlayers.map((player) => {
                    const isMe = player.id === myPlayerId;
                    const isCurrentTurn = player.id === gameState.currentTurnPlayerId;

                    return (
                        <div
                            key={player.id}
                            className={`
                                flex items-center gap-1 md:gap-2 px-2 py-1 rounded
                                ${isCurrentTurn ? 'bg-green-900/50 ring-1 ring-green-500' : 'bg-stone-900/50'}
                                ${isMe ? 'ring-1 ring-yellow-600' : ''}
                                transition-all
                            `}
                        >
                            {/* Name */}
                            <span className={`text-[10px] md:text-xs font-bold truncate max-w-[60px] md:max-w-[100px] ${isMe ? 'text-yellow-400' : 'text-stone-300'}`}>
                                {player.name}{isMe ? '' : ''}
                            </span>

                            {/* HP Bar */}
                            <div className="flex items-center gap-0.5">
                                {Array(player.maxHp).fill(0).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-3 md:w-3 md:h-4 rounded-sm ${i < player.hp ? 'bg-red-600' : 'bg-stone-800'}`}
                                    />
                                ))}
                            </div>

                            {/* Items Count */}
                            <span className="text-[8px] md:text-[10px] text-stone-600">
                                {player.items.length}
                            </span>

                            {/* Status */}
                            {player.isHandcuffed && (
                                <span className="text-[8px] bg-purple-900 text-purple-300 px-1 rounded">C</span>
                            )}
                            {player.isSawedActive && (
                                <span className="text-[8px] bg-orange-900 text-orange-300 px-1 rounded">S</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
