import React from 'react';
import { AimTarget, TurnOwner, GameSettings } from '../../types';
import { Hand, Target, User } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';

export interface GameStateData {
    players: Record<string, {
        id: string;
        name: string;
        isAlive?: boolean;
    }> | Array<{
        id: string;
        name: string;
        isAlive?: boolean;
    }>;
}

interface ControlsProps {
    isGunHeld: boolean;
    isProcessing: boolean;
    isRecovering?: boolean; // Whether player/dealer is knocked and recovering
    onPickupGun: () => void;
    onFireShot: (target: TurnOwner, targetId?: string) => void;
    onHoverTarget: (target: AimTarget) => void;
    currentAimTarget?: AimTarget;
    isMultiplayer?: boolean;
    isThreePlayer?: boolean;
    isFourPlayer?: boolean;
    mpGameState?: GameStateData | null;
    mpMyPlayerId?: string | null;
    onMpShoot?: (targetId: string) => void;
    settings?: GameSettings;
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
    isThreePlayer = false,
    isFourPlayer = false,
    mpGameState,
    mpMyPlayerId,
    onMpShoot,
    settings
}) => {
    const isBalanced = !!settings?.balancedPerformance || !!settings?.ultraPerformance;
    const isPotato = !!settings?.ultraPerformance;

    const mpOpponents = isMultiplayer && mpGameState && mpMyPlayerId
        ? Object.values(mpGameState.players).filter(p => p.id !== mpMyPlayerId && p.isAlive !== false)
        : [];

    const handleShootOpponent = (opponentId?: string) => {
        // Direct Fire - Snappier response
        onFireShot('DEALER', opponentId);
    };

    const handleShootSelf = () => {
        // Direct Fire
        onFireShot('PLAYER');
    };

    return (
        <div className="flex-1 flex items-end justify-center pointer-events-none pb-1 md:pb-4 controls-enter">
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
                        className={isPotato
                            ? `bg-neutral-900 border ${isRecovering ? 'border-red-800 text-red-500' : 'border-stone-700 text-stone-300 hover:bg-neutral-800'} px-6 py-4 lg:px-10 lg:py-6 font-black text-xs lg:text-xl tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed translate-y-4 sm:translate-y-0`
                            : `bg-black/90 border px-6 py-4 lg:px-10 lg:py-6 font-black text-xs lg:text-xl transition-all active:scale-95 tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed translate-y-4 sm:translate-y-0 ${isRecovering
                                ? 'border-red-800 text-red-500 disabled:animate-none'
                                : `border-stone-500 text-stone-200 hover:bg-stone-800 hover:text-white hover:border-white ${isBalanced ? '' : 'animate-pulse shadow-lg'}`
                            }`
                        }
                    >
                        <Hand size={18} className="lg:w-6 lg:h-6" />
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
                        {isThreePlayer || isFourPlayer ? (() => {
                            if (!mpGameState || !Array.isArray((mpGameState as any).players)) return null;
                            const players = (mpGameState as any).players;
                            const myIndex = players.findIndex((p: any) => p.id === mpMyPlayerId);
                            const size = players.length;
                            if (myIndex === -1 || size < 3) return null;
                            const frontOpponent = players[(myIndex + 2) % size];
                            const sideOpponent = players[(myIndex + 1) % size];
                            const leftOpponent = sideOpponent;
                            const rightOpponent = size >= 4 ? players[(myIndex + 3) % size] : null;
                            const sidePos = myIndex === 1 ? 'right' : 'left';

                            const isMobile = window.matchMedia('(pointer: coarse)').matches;

                            const handleChooseOpponent = (relTarget: TurnOwner, intendedAim: AimTarget, oppId: string) => {
                                if (isMobile && currentAimTarget !== intendedAim) {
                                    onHoverTarget(intendedAim);
                                    return;
                                }
                                onFireShot(relTarget, oppId);
                            };

                            const handleChooseSelf = () => {
                                if (isMobile && currentAimTarget !== 'SELF') {
                                    onHoverTarget('SELF');
                                    return;
                                }
                                onFireShot('PLAYER');
                            };

                            let shootFrontBtnClass = isPotato
                                ? "bg-neutral-900 border border-red-800 px-4 py-2 text-red-500 font-black text-xs hover:bg-neutral-850 hover:text-white tracking-wide flex items-center gap-1 disabled:opacity-50"
                                : "bg-black/90 border border-red-800 px-4 py-2.5 text-red-500 font-black text-xs hover:bg-red-900 hover:text-white transition-all active:scale-95 tracking-wide flex items-center gap-1.5 disabled:opacity-50 shadow-lg rounded-lg";

                            let shootSelfBtnClass = isPotato
                                ? "bg-neutral-900 border border-stone-850 px-4 py-2 text-stone-400 font-black text-xs hover:bg-neutral-850 hover:text-white tracking-wide flex items-center gap-1 disabled:opacity-50"
                                : "bg-black/90 border border-stone-700 px-4 py-2.5 text-stone-400 font-black text-xs hover:bg-stone-800 hover:text-white transition-all active:scale-95 tracking-wide flex items-center gap-1.5 disabled:opacity-50 shadow-lg rounded-lg";

                            return (
                                <div className="grid grid-cols-3 gap-3 max-w-md w-full justify-center items-center">
                                    {/* Row 1: Front Player */}
                                    <div className="col-start-2 flex justify-center">
                                        {frontOpponent && (
                                            <button
                                                onClick={() => {
                                                    audioManager.playSound('click');
                                                    handleChooseOpponent('DEALER', 'OPPONENT', frontOpponent.id);
                                                }}
                                                disabled={isProcessing}
                                                onMouseEnter={() => !isMobile && !isProcessing && onHoverTarget('OPPONENT')}
                                                onMouseLeave={() => !isMobile && !isProcessing && onHoverTarget('CHOOSING')}
                                                className={`${shootFrontBtnClass} w-full justify-center`}
                                            >
                                                <Target size={14} />
                                                {frontOpponent.name.toUpperCase()}
                                            </button>
                                        )}
                                    </div>

                                    {/* Row 2: Left Player, Self, Right Player */}
                                    <div className="col-start-1 row-start-2 flex justify-center">
                                        {((size === 4 && leftOpponent) || (size === 3 && sidePos === 'left' && sideOpponent)) && (
                                            <button
                                                onClick={() => {
                                                    audioManager.playSound('click');
                                                    handleChooseOpponent('PLAYER3', 'LEFT', (size === 4 ? leftOpponent! : sideOpponent).id);
                                                }}
                                                disabled={isProcessing}
                                                onMouseEnter={() => !isMobile && !isProcessing && onHoverTarget('LEFT')}
                                                onMouseLeave={() => !isMobile && !isProcessing && onHoverTarget('CHOOSING')}
                                                className={`${shootFrontBtnClass} w-full justify-center`}
                                            >
                                                <Target size={14} />
                                                {(size === 4 ? leftOpponent! : sideOpponent).name.toUpperCase()}
                                            </button>
                                        )}
                                    </div>

                                    <div className="col-start-2 row-start-2 flex justify-center">
                                        <button
                                            onClick={() => {
                                                audioManager.playSound('click');
                                                handleChooseSelf();
                                            }}
                                            disabled={isProcessing}
                                            onMouseEnter={() => !isMobile && !isProcessing && onHoverTarget('SELF')}
                                            onMouseLeave={() => !isMobile && !isProcessing && onHoverTarget('CHOOSING')}
                                            className={`${shootSelfBtnClass} w-full justify-center`}
                                        >
                                            <User size={14} />
                                            SELF
                                        </button>
                                    </div>

                                    <div className="col-start-3 row-start-2 flex justify-center">
                                        {((size === 4 && rightOpponent) || (size === 3 && sidePos === 'right' && sideOpponent)) && (
                                            <button
                                                onClick={() => {
                                                    audioManager.playSound('click');
                                                    handleChooseOpponent(size === 4 ? 'PLAYER4' : 'PLAYER3', 'RIGHT', (size === 4 ? rightOpponent! : sideOpponent).id);
                                                }}
                                                disabled={isProcessing}
                                                onMouseEnter={() => !isMobile && !isProcessing && onHoverTarget('RIGHT')}
                                                onMouseLeave={() => !isMobile && !isProcessing && onHoverTarget('CHOOSING')}
                                                className={`${shootFrontBtnClass} w-full justify-center`}
                                            >
                                                <Target size={14} />
                                                {(size === 4 ? rightOpponent! : sideOpponent).name.toUpperCase()}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })() : (
                            <>
                                {isMultiplayer && mpOpponents.length > 0 ? (
                                    mpOpponents.map((opp) => {
                                        let oppBtnClass = "";
                                        if (isPotato) {
                                            oppBtnClass = "bg-neutral-900 border border-red-800 px-5 py-3 lg:px-6 lg:py-4 text-red-500 font-black text-xs lg:text-lg hover:bg-neutral-850 hover:text-white tracking-wide flex items-center gap-1 lg:gap-2 disabled:opacity-50";
                                        } else {
                                            oppBtnClass = `bg-black/90 border border-red-800 px-5 py-3 lg:px-6 lg:py-4 text-red-500 font-black text-xs lg:text-lg hover:bg-red-900 hover:text-white transition-all active:scale-95 tracking-wide flex items-center gap-1 lg:gap-2 disabled:opacity-50 ${isBalanced ? '' : 'shadow-lg'}`;
                                        }
                                        return (
                                            <button
                                                key={opp.id}
                                                onClick={() => {
                                                    audioManager.playSound('click');
                                                    handleShootOpponent(opp.id);
                                                }}
                                                disabled={isProcessing}
                                                onMouseEnter={() => window.matchMedia('(hover: hover)').matches && !isProcessing && onHoverTarget('OPPONENT')}
                                                onMouseLeave={() => window.matchMedia('(hover: hover)').matches && !isProcessing && onHoverTarget('CHOOSING')}
                                                className={oppBtnClass}
                                            >
                                                <Target size={18} className="lg:w-5 lg:h-5" />
                                                {opp.name}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <button
                                        onClick={() => {
                                            audioManager.playSound('click');
                                            handleShootOpponent();
                                        }}
                                        disabled={isProcessing}
                                        onMouseEnter={() => window.matchMedia('(hover: hover)').matches && !isProcessing && onHoverTarget('OPPONENT')}
                                        onMouseLeave={() => window.matchMedia('(hover: hover)').matches && !isProcessing && onHoverTarget('CHOOSING')}
                                        className={isPotato
                                            ? "bg-neutral-900 border border-red-800 px-5 py-3 lg:px-8 lg:py-5 text-red-500 font-black text-xs lg:text-xl hover:bg-neutral-850 hover:text-white tracking-wide flex items-center gap-2 disabled:opacity-50"
                                            : `bg-black/90 border border-red-800 px-5 py-3 lg:px-8 lg:py-5 text-red-500 font-black text-xs lg:text-xl hover:bg-red-900 hover:text-white transition-all active:scale-95 tracking-wide flex items-center gap-2 disabled:opacity-50 ${isBalanced ? '' : 'shadow-lg'}`
                                        }
                                    >
                                        <Target size={18} className="lg:w-6 lg:h-6" />
                                        {isMultiplayer ? 'SHOOT OPPONENT' : 'SHOOT DEALER'}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        audioManager.playSound('click');
                                        handleShootSelf();
                                    }}
                                    disabled={isProcessing}
                                    onMouseEnter={() => window.matchMedia('(hover: hover)').matches && !isProcessing && onHoverTarget('SELF')}
                                    onMouseLeave={() => window.matchMedia('(hover: hover)').matches && !isProcessing && onHoverTarget('CHOOSING')}
                                    className={isPotato
                                        ? "bg-neutral-900 border border-stone-850 px-5 py-3 lg:px-8 lg:py-5 text-stone-400 font-black text-xs lg:text-xl hover:bg-neutral-850 hover:text-white tracking-wide flex items-center gap-2 disabled:opacity-50"
                                        : `bg-black/90 border border-stone-700 px-5 py-3 lg:px-8 lg:py-5 text-stone-400 font-black text-xs lg:text-xl hover:bg-stone-800 hover:text-white transition-all active:scale-95 tracking-wide flex items-center gap-2 disabled:opacity-50 ${isBalanced ? '' : 'shadow-lg'}`
                                    }
                                >
                                    <User size={18} className="lg:w-6 lg:h-6" />
                                    SHOOT SELF
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export const Controls = React.memo(ControlsComponent);