import React, { useEffect, useRef } from 'react';
import { Globe, Settings as SettingsIcon, HelpCircle, Trophy } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';


interface IntroScreenProps {
    playerName: string;
    inputName: string;
    setInputName: (name: string) => void;
    onStartGame: (hardMode?: boolean) => void;
    onStartMultiplayer: () => void;
    onOpenSettings: () => void;
    onOpenGuide: () => void;
    onOpenScoreboard: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ inputName, setInputName, onStartGame, onStartMultiplayer, onOpenSettings, onOpenGuide, onOpenScoreboard }) => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [scale, setScale] = React.useState(1);
    const [showHardModeWarning, setShowHardModeWarning] = React.useState(false);

    useEffect(() => {
        // Prevent keyboard popup on mobile (touch devices or small screens)
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < 1024; // Increased threshold to cover tablets

        // Only autofocus if definitely on desktop
        if (nameInputRef.current && !isTouchDevice && !isMobileUA && !isSmallScreen) {
            nameInputRef.current.focus();
        }

        const handleResize = () => {
            // Calculate scale based on checking if we can fit a virtual 800x600 box
            // For landscape mobile (short height), height ends up being the limiting factor
            const hScale = Math.min(1, (window.innerHeight - 40) / 600);
            const wScale = Math.min(1, (window.innerWidth - 40) / 800);

            // Use the smaller scale to ensure it fits
            let newScale = Math.min(hScale, wScale);

            // Clamp scale for better readability on small mobiles
            if (newScale < 0.6) newScale = 0.6;
            if (newScale > 1.2) newScale = 1.2;

            setScale(newScale);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-auto bg-black/60 backdrop-blur-sm">
            {showHardModeWarning && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in fade-in duration-300">
                    <div className="bg-stone-900 border-4 border-red-900 p-8 max-w-md text-center shadow-[0_0_50px_rgba(255,0,0,0.3)]">
                        <h2 className="text-4xl font-black text-red-600 mb-6 tracking-widest text-glitch">WARNING</h2>
                        <p className="text-stone-300 text-xl font-bold mb-2">You have to pay with your soul!</p>
                        <p className="text-red-500/50 text-sm font-mono mb-8">DOUBLLE OR NOTHING</p>
                        <p className="text-red-500/50 text-sm font-mono mb-8">DEALER IS MORE SMARTER | 3 ROUNDS</p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => {
                                    audioManager.playSound('click');
                                    onStartGame(true);
                                }}
                                className="w-full py-4 bg-red-900 hover:bg-red-700 text-white font-black text-xl tracking-widest border-2 border-red-600 transition-all hover:scale-105"
                            >
                                I ACCEPT
                            </button>
                            <button
                                onClick={() => setShowHardModeWarning(false)}
                                className="w-full py-3 bg-transparent text-stone-500 font-bold hover:text-white transition-colors"
                            >
                                TURN BACK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="relative z-10 text-center max-w-lg w-full p-4 flex flex-col justify-center origin-center transition-transform duration-100"
                style={{ transform: `scale(${scale})` }}
            >
                <h1 className="text-6xl sm:text-7xl font-black mb-2 text-stone-100 tracking-tighter text-glitch leading-none">AADISH<br /><span className="text-red-600">ROULETTE</span></h1>
                <p className="text-stone-500 font-bold tracking-[0.5em] text-sm mb-6">MOBILE EDITION</p>

                <div className="flex flex-col gap-3">
                    <input
                        ref={nameInputRef}
                        type="text"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        placeholder="ENTER NAME"
                        maxLength={12}
                        className="bg-stone-900 border-2 border-stone-700 p-4 text-2xl font-black text-white outline-none focus:border-red-600 focus:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300 tracking-widest uppercase text-center placeholder-stone-700"
                    />

                    <div className="flex gap-3">
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onStartGame(false);
                        }} disabled={!inputName.trim()} className="flex-1 px-4 py-4 bg-red-600 text-white font-black text-xl hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:grayscale tracking-widest text-shadow-none border-2 border-red-500">
                            START GAME
                        </button>

                        <button onClick={() => {
                            audioManager.playSound('click');
                            setShowHardModeWarning(true);
                        }} disabled={!inputName.trim()} className="px-6 py-4 bg-stone-950 text-red-800 font-black text-xl hover:bg-black hover:text-red-600 hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:grayscale tracking-widest border-2 border-red-900/50 flex flex-col leading-none justify-center items-center gap-1">
                            <span className="text-[10px] tracking-[0.2em] text-stone-600">ENTER</span>
                            HARD MODE
                        </button>
                    </div>

                    <button onClick={() => {
                        audioManager.playSound('click');
                        onStartMultiplayer();
                    }} disabled={!inputName.trim()} className="w-full px-4 py-4 bg-stone-900 border-2 border-blue-900/50 text-blue-500 font-black text-lg flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-blue-500 hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95 transition-all duration-200 shadow-[0_0_15px_rgba(30,64,175,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">
                        <Globe size={20} /> MULTIPLAYER
                    </button>

                    <div className="flex gap-3">
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenGuide();
                        }} className="flex-1 px-4 py-4 bg-stone-900 border-2 border-stone-800 text-stone-400 font-black text-lg flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-stone-500 hover:bg-stone-800 active:scale-95 transition-all duration-200">
                            <HelpCircle size={20} /> GUIDE
                        </button>
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenScoreboard();
                        }} className="flex-1 px-4 py-4 bg-stone-900 border-2 border-stone-800 text-yellow-500 font-black text-lg flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-yellow-500 hover:bg-yellow-600/20 active:scale-95 transition-all duration-200">
                            <Trophy size={20} /> STATS
                        </button>
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenSettings();
                        }} className="px-5 py-4 bg-stone-900 border-2 border-stone-800 text-stone-400 font-black text-lg flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-stone-500 active:scale-95 transition-all duration-200">
                            <SettingsIcon size={22} />
                        </button>
                    </div>
                </div>
                <div className="mt-8 text-stone-600 text-[10px] font-mono animate-pulse">VER 1.0.6 // ADD TO HOME SCREEN</div>
            </div>
        </div>
    );
};
