import React, { useEffect, useRef } from 'react';
import { Globe, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';
import ShellBackground from './ShellBackground';

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

    useEffect(() => {
        if (nameInputRef.current) nameInputRef.current.focus();
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 overflow-hidden pointer-events-auto">
            {/* Falling shells background */}
            <ShellBackground />

            <div className="relative z-10 text-center max-w-lg w-full p-2 md:p-4 flex flex-col justify-center scale-[0.55] sm:scale-[0.75] md:scale-100 origin-center">
                <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black mb-3 md:mb-12 text-stone-100 tracking-tighter text-glitch leading-none">AADISH<br /><span className="text-red-600">ROULETTE</span></h1>
                <div className="flex flex-col gap-4 md:gap-6">
                    <input ref={nameInputRef} type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="ENTER NAME..." maxLength={12} className="bg-stone-900 border-2 border-stone-700 p-2 md:p-4 text-lg md:text-2xl font-black text-white outline-none focus:border-red-600 tracking-widest uppercase text-center" />
                    <button onClick={() => {
                        audioManager.playSound('click');
                        onStartGame();
                    }} disabled={!inputName.trim()} className="w-full px-4 py-3 md:px-6 md:py-4 bg-stone-100 text-black font-black text-base md:text-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 tracking-widest">START GAME</button>
                    <div className="flex gap-2 md:gap-4">
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onStartMultiplayer();
                        }} disabled={!inputName.trim()} className="flex-1 px-3 py-3 md:px-6 md:py-4 bg-stone-900 border-2 border-blue-900/50 text-blue-500 font-black text-sm md:text-xl flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-blue-500 hover:bg-blue-900/30 transition-all shadow-[0_0_15px_rgba(30,64,175,0.2)] disabled:opacity-50 disabled:cursor-not-allowed">
                            <Globe size={18} className="md:w-6 md:h-6" /> <span className="hidden sm:inline">MULTI</span>PLAYER
                        </button>
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenGuide();
                        }} className="px-3 py-3 md:px-4 md:py-4 bg-stone-900 border-2 border-amber-900/50 text-amber-500 font-black text-sm md:text-xl flex items-center justify-center gap-1 tracking-widest hover:text-white hover:border-amber-500 hover:bg-amber-900/30 transition-all shadow-[0_0_15px_rgba(217,119,6,0.2)]">
                            <HelpCircle size={18} className="md:w-5 md:h-5" /> <span className="hidden sm:inline">GUIDE</span>
                        </button>
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenSettings();
                        }} className="px-3 py-3 md:px-6 md:py-4 bg-stone-900 border-2 border-stone-800 text-stone-400 font-black text-base md:text-xl flex items-center justify-center gap-2 tracking-widest hover:text-white hover:border-stone-500">
                            <SettingsIcon size={18} className="md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
                <div className="mt-4 md:mt-12 text-stone-800 text-[9px] md:text-xs font-mono">VER 1.0.0 // FULLSCREEN RECOMMENDED</div>
            </div>
        </div>
    );
};
