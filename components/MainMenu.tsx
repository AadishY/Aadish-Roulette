import React, { useState } from 'react';

interface MenuProps {
    onSinglePlayer: () => void;
    onMultiPlayer: () => void;
}

export const MainMenu: React.FC<MenuProps> = ({ onSinglePlayer, onMultiPlayer }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-stone-200">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-red-600 mb-2 glitch-text">
                BUCKSHOT
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold tracking-[0.5em] text-stone-500 mb-16">
                ROULETTE
            </h2>

            <div className="flex flex-col gap-6 w-64 md:w-80">
                <button
                    onClick={onSinglePlayer}
                    className="group relative px-8 py-4 bg-stone-900 border border-stone-700 hover:border-red-600 hover:bg-stone-800 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-red-600/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative font-bold text-xl tracking-widest z-10 group-hover:text-red-500">
                        SINGLEPLAYER
                    </span>
                </button>

                <button
                    onClick={onMultiPlayer}
                    className="group relative px-8 py-4 bg-stone-900 border border-stone-700 hover:border-blue-600 hover:bg-stone-800 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-blue-600/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative font-bold text-xl tracking-widest z-10 group-hover:text-blue-500">
                        MULTIPLAYER
                    </span>
                </button>

                <div className="flex justify-between text-xs text-stone-600 font-mono mt-8 px-2">
                    <span>VER 1.0.4</span>
                    <span>AADISH NETWORKS</span>
                </div>
            </div>
        </div>
    );
};
