import React, { useEffect, useRef } from 'react';
import { Globe, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';


interface IntroScreenProps {
    playerName: string;
    inputName: string;
    setInputName: (name: string) => void;
    onStartGame: () => void;
    onStartMultiplayer: () => void;
    onOpenSettings: () => void;
    onOpenGuide: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ inputName, setInputName, onStartGame, onStartMultiplayer, onOpenSettings, onOpenGuide }) => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [scale, setScale] = React.useState(1);

    useEffect(() => {
        if (nameInputRef.current) nameInputRef.current.focus();

        const handleResize = () => {
            // Calculate scale based on checking if we can fit a virtual 800x600 box
            // For landscape mobile (short height), height ends up being the limiting factor
            const hScale = Math.min(1, (window.innerHeight - 40) / 600);
            const wScale = Math.min(1, (window.innerWidth - 40) / 800);

            // Use the smaller scale to ensure it fits
            let newScale = Math.min(hScale, wScale);

            // Adjust for very small mobile screens to keep it readable
            if (window.innerWidth < 640 && newScale < 0.4) newScale = 0.4;

            setScale(newScale);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-auto">



            <div
                className="relative z-10 text-center max-w-lg w-full p-4 flex flex-col justify-center origin-center transition-transform duration-100"
                style={{ transform: `scale(${scale})` }}
            >
                <h1 className="text-6xl sm:text-7xl font-black mb-6 text-stone-100 tracking-tighter text-glitch leading-none">AADISH<br /><span className="text-red-600">ROULETTE</span></h1>
                <div className="flex flex-col gap-4">
                    <input
                        ref={nameInputRef}
                        type="text"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        placeholder="ENTER NAME..."
                        maxLength={12}
                        className="bg-stone-900 border-2 border-stone-700 p-4 text-2xl font-black text-white outline-none focus:border-red-600 focus:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300 tracking-widest uppercase text-center placeholder-stone-700"
                    />
                    <button onClick={() => {
                        audioManager.playSound('click');
                        onStartGame();
                    }} disabled={!inputName.trim()} className="w-full px-6 py-4 bg-stone-100 text-black font-black text-xl hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:grayscale tracking-widest text-shadow-none">START GAME</button>
                    <div className="flex gap-4">
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onStartMultiplayer();
                        }} disabled={!inputName.trim()} className="flex-1 px-4 py-4 bg-stone-900 border-2 border-blue-900/50 text-blue-500 font-black text-lg flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-blue-500 hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95 transition-all duration-200 shadow-[0_0_15px_rgba(30,64,175,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">
                            <Globe size={20} /> <span className="hidden sm:inline">MULTI</span>PLAYER
                        </button>
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenGuide();
                        }} className="px-5 py-4 bg-stone-900 border-2 border-amber-900/50 text-amber-500 font-black text-lg flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-amber-500 hover:bg-amber-600 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition-all duration-200 shadow-[0_0_15px_rgba(217,119,6,0.1)]">
                            <HelpCircle size={20} /> <span className="hidden sm:inline">GUIDE</span>
                        </button>
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenSettings();
                        }} className="px-5 py-4 bg-stone-900 border-2 border-stone-800 text-stone-400 font-black text-lg flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-stone-500 active:scale-95 transition-all duration-200">
                            <SettingsIcon size={22} />
                        </button>
                    </div>
                </div>
                <div className="mt-8 text-stone-800 text-xs font-mono animate-pulse">VER 1.0.0 // FULLSCREEN RECOMMENDED</div>
            </div>
        </div>
    );
};
