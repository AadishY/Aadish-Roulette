import React from 'react';
import { AimTarget, TurnOwner } from '../../types';
import { Hand } from 'lucide-react';

interface ControlsProps {
    isGunHeld: boolean;
    isProcessing: boolean;
    onPickupGun: () => void;
    onFireShot: (target: TurnOwner) => void;
    onHoverTarget: (target: AimTarget) => void;
}

export const Controls: React.FC<ControlsProps> = ({ isGunHeld, isProcessing, onPickupGun, onFireShot, onHoverTarget }) => {
    return (
        <div className="absolute bottom-[25%] md:top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 md:gap-8 pointer-events-auto items-center w-full justify-center px-4 z-50">
            {/* Gun Pickup Button */}
            {!isGunHeld && (
                <button 
                    onClick={onPickupGun}
                    disabled={isProcessing}
                    className="bg-black/80 border md:border-2 border-stone-500 px-4 py-3 md:px-10 md:py-6 text-stone-200 font-black text-xs md:text-2xl hover:bg-stone-800 hover:text-white hover:border-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm tracking-widest clip-path-slant flex items-center gap-2 md:gap-3 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Hand size={16} className="md:w-6 md:h-6" />
                    GRAB SHOTGUN
                </button>
            )}

            {/* Shooting Controls */}
            {isGunHeld && (
                <>
                    <button 
                        onClick={() => onFireShot('DEALER')}
                        disabled={isProcessing}
                        onMouseEnter={() => onHoverTarget('OPPONENT')}
                        onMouseLeave={() => onHoverTarget('IDLE')}
                        className="bg-black/80 border md:border-2 border-red-900 px-3 py-2 md:px-8 md:py-5 text-red-500 font-black text-[10px] md:text-xl hover:bg-red-900 hover:text-white transition-all hover:scale-105 hover:border-red-500 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm tracking-widest clip-path-slant whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        SHOOT DEALER
                    </button>
                    <button 
                        onClick={() => onFireShot('PLAYER')}
                        disabled={isProcessing}
                        onMouseEnter={() => onHoverTarget('SELF')}
                        onMouseLeave={() => onHoverTarget('IDLE')}
                        className="bg-black/80 border md:border-2 border-stone-700 px-3 py-2 md:px-8 md:py-5 text-stone-400 font-black text-[10px] md:text-xl hover:bg-stone-800 hover:text-white transition-all hover:scale-105 hover:border-stone-400 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm tracking-widest whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        SHOOT SELF
                    </button>
                </>
            )}
        </div>
    );
};
