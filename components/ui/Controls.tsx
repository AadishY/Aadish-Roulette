import React from 'react';
import { AimTarget, TurnOwner } from '../../types';
import { Hand, Target, User } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';
import { GameStateData } from '../../hooks/useSocket';

interface ControlsProps {
    isGunHeld: boolean;
    isProcessing: boolean;
    isRecovering?: boolean; // Whether player/dealer is knocked and recovering
    onPickupGun: () => void;
    onFireShot: (target: TurnOwner, targetId?: string) => void;
    onHoverTarget: (target: AimTarget) => void;
    currentAimTarget?: AimTarget;
    isMultiplayer?: boolean;
    mpGameState?: GameStateData | null;
    mpMyPlayerId?: string | null;
    onMpShoot?: (targetId: string) => void;
}

const ControlsComponent: React.FC<ControlsProps> = ({
    isGunHeld,
    isProcessing,
    isRecovering = false,
    onPickupGun,
    onFireShot,
    onHoverTarget,
    currentAimTarget = 'IDLE',
    isMultiplayer = false,
    mpGameState,
    mpMyPlayerId,
    onMpShoot
}) => {
    const mpOpponents = isMultiplayer && mpGameState && mpMyPlayerId
        ? Object.values(mpGameState.players).filter(p => p.id !== mpMyPlayerId && p.isAlive !== false)
        : [];

    const handleShootOpponent = (opponentId?: string) => {
        // 2-Step Aiming Logic for Mobile (and clearer interaction on desktop)
        if (currentAimTarget !== 'OPPONENT') {
            onHoverTarget('OPPONENT');
        } else {
            onFireShot('DEALER', opponentId);
        }
    };

    const handleShootSelf = () => {
        // 2-Step Aiming Logic
        if (currentAimTarget !== 'SELF') {
            onHoverTarget('SELF');
        } else {
            onFireShot('PLAYER');
        }
    };

    return (
        <div className="flex-1 flex items-end justify-center pointer-events-none pb-1 md:pb-4">
            <div className="flex gap-2 md:gap-6 pointer-events-auto flex-wrap justify-center px-2">
                {/* Grab Gun */}
                {!isGunHeld && (
                    <button
                        onClick={() => {
                            if (!isRecovering) {
                                audioManager.playSound('click');
                                onPickupGun();
                            }
                        }}
                        disabled={isProcessing || isRecovering}
                        className={`bg-black/90 border px-4 py-3 md:px-8 md:py-5 font-black text-xs md:text-xl transition-all active:scale-95 shadow-lg tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isRecovering
                                ? 'border-red-800 text-red-500 disabled:animate-none'
                                : 'border-stone-500 text-stone-200 hover:bg-stone-800 hover:text-white hover:border-white animate-pulse'
                            }`}
                    >
                        <Hand size={16} className="md:w-6 md:h-6" />
                        {isRecovering ? (
                            <><span className="hidden md:inline">WAIT </span>RECOVERING...</>
                        ) : (
                            <><span className="hidden md:inline">GRAB </span>SHOTGUN</>
                        )}
                    </button>
                )}

                {/* Shooting */}
                {isGunHeld && (
                    <>
                        {isMultiplayer && mpOpponents.length > 0 ? (
                            mpOpponents.map((opp) => (
                                <button
                                    key={opp.id}
                                    onClick={() => {
                                        audioManager.playSound('click');
                                        handleShootOpponent(opp.id);
                                    }}
                                    disabled={isProcessing}
                                    onMouseEnter={() => onHoverTarget('OPPONENT')}
                                    onMouseLeave={() => onHoverTarget('IDLE')}
                                    className="bg-black/90 border border-red-800 px-3 py-2 md:px-6 md:py-4 text-red-500 font-black text-xs md:text-lg hover:bg-red-900 hover:text-white transition-all active:scale-95 shadow-lg tracking-wide flex items-center gap-1 md:gap-2 disabled:opacity-50"
                                >
                                    <Target size={14} className="md:w-5 md:h-5" />
                                    {opp.name}
                                </button>
                            ))
                        ) : (
                            <button
                                onClick={() => {
                                    audioManager.playSound('click');
                                    handleShootOpponent();
                                }}
                                disabled={isProcessing}
                                onMouseEnter={() => onHoverTarget('OPPONENT')}
                                onMouseLeave={() => onHoverTarget('IDLE')}
                                className="bg-black/90 border border-red-800 px-4 py-3 md:px-8 md:py-5 text-red-500 font-black text-xs md:text-xl hover:bg-red-900 hover:text-white transition-all active:scale-95 shadow-lg tracking-wide flex items-center gap-2 disabled:opacity-50"
                            >
                                <Target size={16} className="md:w-6 md:h-6" />
                                SHOOT DEALER
                            </button>
                        )}

                        <button
                            onClick={() => {
                                audioManager.playSound('click');
                                handleShootSelf();
                            }}
                            disabled={isProcessing}
                            onMouseEnter={() => onHoverTarget('SELF')}
                            onMouseLeave={() => onHoverTarget('IDLE')}
                            className="bg-black/90 border border-stone-700 px-4 py-3 md:px-8 md:py-5 text-stone-400 font-black text-xs md:text-xl hover:bg-stone-800 hover:text-white transition-all active:scale-95 shadow-lg tracking-wide flex items-center gap-2 disabled:opacity-50"
                        >
                            <User size={16} className="md:w-6 md:h-6" />
                            SHOOT SELF
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export const Controls = React.memo(ControlsComponent);