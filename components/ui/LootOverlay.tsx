import React, { useEffect, useState } from 'react';
import { ItemType } from '../../types';
import { Icons } from './Icons';

interface LootOverlayProps {
    receivedItems: ItemType[];
}

const ITEM_NAMES: Record<ItemType, string> = {
    'BEER': 'BEER',
    'CIGS': 'CIGARETTES',
    'GLASS': 'MAGNIFIER',
    'CUFFS': 'HANDCUFFS',
    'SAW': 'HAND SAW',
    'PHONE': 'BURNER PHONE',
    'INVERTER': 'INVERTER',
    'ADRENALINE': 'ADRENALINE'
};

const ITEM_COLORS: Record<ItemType, string> = {
    'BEER': 'text-amber-500 border-amber-500/50 bg-amber-950/30',
    'CIGS': 'text-red-500 border-red-500/50 bg-red-950/30',
    'GLASS': 'text-cyan-500 border-cyan-500/50 bg-cyan-950/30',
    'CUFFS': 'text-stone-400 border-stone-400/50 bg-stone-900/50',
    'SAW': 'text-orange-600 border-orange-600/50 bg-orange-950/30',
    'PHONE': 'text-blue-300 border-blue-300/50 bg-blue-950/30',
    'INVERTER': 'text-green-400 border-green-500/50 bg-green-950/30',
    'ADRENALINE': 'text-pink-500 border-pink-500/50 bg-pink-950/30'
};

export const LootOverlay: React.FC<LootOverlayProps> = ({ receivedItems }) => {
    // Staggered reveal effect
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        setVisibleCount(0);
        const interval = setInterval(() => {
            setVisibleCount(prev => {
                if (prev < receivedItems.length) return prev + 1;
                clearInterval(interval);
                return prev;
            });
        }, 300); // Reveal one every 300ms
        return () => clearInterval(interval);
    }, [receivedItems]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl flex flex-col items-center">

                {/* Header */}
                <div className="mb-10 md:mb-16 text-center animate-slide-in-from-top-10 duration-700">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-stone-100 to-stone-600 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                        SHIPMENT
                    </h2>
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent mt-2 mb-2" />
                </div>

                {/* Grid */}
                <div className="flex flex-wrap gap-4 md:gap-8 justify-center items-center w-full">
                    {receivedItems.map((item, i) => {
                        const isVisible = i < visibleCount;
                        return (
                            <div
                                key={`${item}-${i}`}
                                className={`
                                    flex flex-col items-center justify-center
                                    transition-all duration-500 transform
                                    ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}
                                `}
                            >
                                <div className={`
                                    relative group
                                    w-24 md:w-36 aspect-square shrink-0
                                    flex items-center justify-center
                                    border-2 ${ITEM_COLORS[item]}
                                    shadow-[0_0_20px_rgba(0,0,0,0.5)]
                                    overflow-hidden
                                    backdrop-blur-md
                                `}>
                                    {/* Scanline / Grid Background Effect */}
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]" />

                                    {/* Icon */}
                                    <div className="relative z-10 transform transition-transform duration-300 group-hover:scale-110 drop-shadow-md">
                                        {item === 'BEER' && <Icons.Beer size={40} className="md:w-16 md:h-16" />}
                                        {item === 'CIGS' && <Icons.Cigs size={40} className="md:w-16 md:h-16" />}
                                        {item === 'GLASS' && <Icons.Glass size={40} className="md:w-16 md:h-16" />}
                                        {item === 'CUFFS' && <Icons.Cuffs size={40} className="md:w-16 md:h-16" />}
                                        {item === 'SAW' && <Icons.Saw size={40} className="md:w-16 md:h-16" />}
                                        {item === 'PHONE' && <Icons.Phone size={40} className="md:w-16 md:h-16" />}
                                        {item === 'INVERTER' && <Icons.Inverter size={40} className="md:w-16 md:h-16" />}
                                        {item === 'ADRENALINE' && <Icons.Adrenaline size={40} className="md:w-16 md:h-16" />}
                                    </div>

                                    {/* Corner Accents */}
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/50" />
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/50" />
                                </div>

                                <span className={`
                                    mt-3 text-[10px] md:text-sm font-black tracking-widest text-center uppercase
                                    ${ITEM_COLORS[item].split(' ')[0]} 
                                    bg-black/80 px-2 py-1 border border-stone-800
                                `}>
                                    {ITEM_NAMES[item]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
