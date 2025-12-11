import React from 'react';
import { MPPlayer } from '../hooks/useSocket';
import { Beer, Cigarette, Search, Wrench, Lock } from 'lucide-react';

interface MultiplayerInventoryProps {
    player: MPPlayer;
    isMyTurn: boolean;
    onUseItem: (index: number) => void;
    isProcessing: boolean;
}

const ITEM_ICONS: Record<string, React.ReactNode> = {
    'BEER': <Beer size={20} />,
    'CIGS': <Cigarette size={20} />,
    'GLASS': <Search size={20} />,
    'SAW': <Wrench size={20} />,
    'CUFFS': <Lock size={20} />
};

const ITEM_COLORS: Record<string, string> = {
    'BEER': 'from-amber-700 to-amber-900',
    'CIGS': 'from-stone-600 to-stone-800',
    'GLASS': 'from-cyan-700 to-cyan-900',
    'SAW': 'from-orange-700 to-orange-900',
    'CUFFS': 'from-purple-700 to-purple-900'
};

export const MultiplayerInventory: React.FC<MultiplayerInventoryProps> = ({
    player,
    isMyTurn,
    onUseItem,
    isProcessing
}) => {
    const canUseItems = isMyTurn && !isProcessing;

    return (
        <div className="pointer-events-auto flex flex-col gap-2">
            <div className="text-xs font-bold text-stone-500 text-center">YOUR ITEMS</div>
            <div className="flex gap-2 flex-wrap max-w-[400px] justify-center">
                {player.items.length === 0 && (
                    <div className="text-stone-700 text-xs italic">No items</div>
                )}
                {player.items.map((item, index) => (
                    <button
                        key={`${item}-${index}`}
                        onClick={() => onUseItem(index)}
                        disabled={!canUseItems}
                        className={`
                            w-12 h-12 md:w-14 md:h-14
                            bg-gradient-to-br ${ITEM_COLORS[item] || 'from-stone-700 to-stone-900'}
                            border-2 border-stone-900
                            flex items-center justify-center
                            text-white
                            transition-all
                            ${canUseItems ? 'hover:scale-110 hover:border-white cursor-pointer hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'opacity-50 cursor-not-allowed'}
                            relative
                            group
                        `}
                        title={item}
                    >
                        {ITEM_ICONS[item]}
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-black text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                {item}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            {player.isSawedActive && (
                <div className="text-xs font-black text-orange-500 bg-black/80 px-2 py-1 text-center border border-orange-700 animate-pulse">
                    ⚠ SAWED-OFF ACTIVE ⚠
                </div>
            )}
        </div>
    );
};
