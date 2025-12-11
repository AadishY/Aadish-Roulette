import React from 'react';
import { MPPlayer, GameStateData } from '../hooks/useSocket';
import { Target, Crosshair } from 'lucide-react';

interface MultiplayerControlsProps {
    gameState: GameStateData;
    myPlayerId: string;
    onShootPlayer: (targetId: string) => void;
    isProcessing: boolean;
}

export const MultiplayerControls: React.FC<MultiplayerControlsProps> = ({
    gameState,
    myPlayerId,
    onShootPlayer,
    isProcessing
}) => {
    const isMyTurn = gameState.currentTurnPlayerId === myPlayerId;
    const myPosition = gameState.players[myPlayerId]?.position || 0;
    const playerCount = Object.keys(gameState.players).length;

    // Get other players (excluding self)
    const otherPlayers = Object.values(gameState.players).filter(p => p.id !== myPlayerId);

    //Calculate button positions based on player count and their positions
    const getButtonPosition = (playerPosition: number) => {
        if (playerCount === 2) {
            // Face to face - button at top center
            return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
        } else if (playerCount === 3) {
            // Triangle formation
            const relativePos = (playerPosition - myPosition + 3) % 3;
            if (relativePos === 1) return 'top-[20%] left-[30%]'; // Left
            if (relativePos === 2) return 'top-[20%] right-[30%]'; // Right
        } else if (playerCount === 4) {
            // Square formation
            const relativePos = (playerPosition - myPosition + 4) % 4;
            if (relativePos === 1) return 'top-1/2 left-[15%] -translate-y-1/2'; // Left
            if (relativePos === 2) return 'top-[15%] left-1/2 -translate-x-1/2'; // Top
            if (relativePos === 3) return 'top-1/2 right-[15%] -translate-y-1/2'; // Right
        }
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    };

    const handleShootSelf = () => {
        onShootPlayer(myPlayerId);
    };

    if (!isMyTurn) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="text-2xl md:text-4xl font-black text-stone-500 bg-black/80 px-6 py-3 border-2 border-stone-800 animate-pulse">
                    WAITING FOR {gameState.players[gameState.currentTurnPlayerId]?.name || 'PLAYER'}...
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Shoot Other Players Buttons */}
            {otherPlayers.map((player) => (
                <button
                    key={player.id}
                    onClick={() => onShootPlayer(player.id)}
                    disabled={isProcessing}
                    className={`absolute ${getButtonPosition(player.position)} pointer-events-auto group`}
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center border-4 border-red-800 hover:bg-red-500 hover:scale-110 transition-all shadow-[0_0_30px_rgba(220,38,38,0.6)] group-hover:shadow-[0_0_50px_rgba(220,38,38,0.9)] disabled:opacity-50 disabled:cursor-not-allowed">
                                <Target size={32} className="text-white" />
                            </div>
                            {/* Crosshair animation */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Crosshair size={80} className="text-red-400 animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <div className="text-xs md:text-sm font-bold text-stone-300 bg-black/80 px-2 py-1 rounded">
                            SHOOT {player.name}
                        </div>
                    </div>
                </button>
            ))}

            {/* Shoot Self Button */}
            <button
                onClick={handleShootSelf}
                disabled={isProcessing}
                className="absolute bottom-[20%] left-1/2 -translate-x-1/2 pointer-events-auto group"
            >
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center border-4 border-blue-800 hover:bg-blue-500 hover:scale-110 transition-all shadow-[0_0_30px_rgba(37,99,235,0.6)] group-hover:shadow-[0_0_50px_rgba(37,99,235,0.9)] disabled:opacity-50 disabled:cursor-not-allowed">
                        <Target size={32} className="text-white transform rotate-180" />
                    </div>
                    <div className="text-xs md:text-sm font-bold text-stone-300 bg-black/80 px-2 py-1 rounded">
                        SHOOT SELF
                    </div>
                </div>
            </button>

            {/* Turn Indicator */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none z-40">
                <div className="text-xl md:text-3xl font-black text-green-500 bg-black/90 px-6 py-2 border-2 border-green-600 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                    YOUR TURN
                </div>
            </div>
        </>
    );
};
