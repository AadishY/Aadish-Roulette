import React from 'react';
import { ItemType } from '../../types';
import { Icons } from './Icons';

interface LootOverlayProps {
    receivedItems: ItemType[];
}

const ITEM_NAMES: Record<ItemType, string> = {
    'BEER': 'BEER',
    'CIGS': 'CIGARETTES',
    'GLASS': 'MAGNIFYING GLASS',
    'CUFFS': 'HANDCUFFS',
    'SAW': 'HAND SAW',
    'PHONE': 'BURNER PHONE',
    'INVERTER': 'POLARITY INVERTER',
    'ADRENALINE': 'ADRENALINE'
};

const ITEM_COLORS: Record<ItemType, string> = {
    'BEER': 'text-amber-500',
    'CIGS': 'text-red-500',
    'GLASS': 'text-cyan-500',
    'CUFFS': 'text-stone-400',
    'SAW': 'text-orange-600',
    'PHONE': 'text-blue-300',
    'INVERTER': 'text-green-400',
    'ADRENALINE': 'text-pink-500'
};

export const LootOverlay: React.FC<LootOverlayProps> = ({ receivedItems }) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <h2 className="text-3xl md:text-4xl font-black mb-8 md:mb-12 tracking-widest text-stone-200 text-glitch">SHIPMENT RECEIVED</h2>
            <div className="flex gap-4 md:gap-6 flex-wrap justify-center max-w-4xl">
                {receivedItems.map((item, i) => (
                    <div key={i} className="flex flex-col items-center pop-in" style={{ animationDelay: `${i * 0.15}s` }}>
                        <div className={`w-16 h-20 md:w-24 md:h-32 bg-stone-950 border border-stone-600 flex items-center justify-center mb-2 md:mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)] ${ITEM_COLORS[item]}`}>
                            {item === 'BEER' && <Icons.Beer size={28} />}
                            {item === 'CIGS' && <Icons.Cigs size={28} />}
                            {item === 'GLASS' && <Icons.Glass size={28} />}
                            {item === 'CUFFS' && <Icons.Cuffs size={28} />}
                            {item === 'SAW' && <Icons.Saw size={28} />}
                            {item === 'PHONE' && <Icons.Phone size={28} />}
                            {item === 'INVERTER' && <Icons.Inverter size={28} />}
                            {item === 'ADRENALINE' && <Icons.Adrenaline size={28} />}
                        </div>
                        <span className="font-bold text-stone-400 text-[10px] md:text-sm tracking-widest mt-1 text-center max-w-[80px] md:max-w-[100px]">
                            {ITEM_NAMES[item]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
