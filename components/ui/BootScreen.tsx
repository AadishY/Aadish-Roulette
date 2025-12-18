import React, { useEffect, useState } from 'react';
import { audioManager } from '../../utils/audioManager';

interface BootScreenProps {
    onContinue?: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onContinue }) => {
    const [bootLines, setBootLines] = useState<string[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingComplete, setLoadingComplete] = useState(false);

    // Run boot sequence immediately
    useEffect(() => {
        setBootLines([]);
        setLoadingProgress(0);
        const sequence = [
            { text: "BIOS CHECK...", delay: 100 },
            { text: "CPU: QUANTUM CORE... OK", delay: 200 },
            { text: "MEMORY: 64TB... OK", delay: 300 },
            { text: "LOADING KERNEL...", delay: 500 },
            { text: "MOUNTING VOLUMES...", delay: 800 },
            { text: "INITIALIZING AI DEALER...", delay: 1200 },
            { text: "SYSTEM READY.", delay: 2000 }
        ];
        let timeouts: ReturnType<typeof setTimeout>[] = [];
        sequence.forEach(({ text, delay }) => {
            timeouts.push(setTimeout(() => {
                setBootLines(prev => [...prev, text]);
            }, delay));
        });

        // Mark loading as complete after progress bar fills
        const interval = setInterval(() => {
            setLoadingProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    // Small delay before showing title screen
                    setTimeout(() => setLoadingComplete(true), 500);
                    return 100;
                }
                return p + 5;
            });
        }, 100);

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, []);

    const handleContinue = async () => {
        if (!loadingComplete) return;

        // Try to enter fullscreen on first user interaction
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen().catch(() => { });
            }
        } catch (e) { }

        // Initialize audio on user click
        await audioManager.initialize();
        audioManager.playSound('click');
        // Notify parent to transition to INTRO
        if (onContinue) onContinue();
    };

    // After loading completes, show title screen
    if (loadingComplete) {
        return (
            <div
                className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono cursor-pointer animate-in fade-in duration-1000 overflow-hidden"
                onClick={handleContinue}
            >
                {/* Background ambient light */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)] animate-pulse" />

                <div className="text-center relative z-10">
                    <h1 className="text-7xl md:text-9xl font-black text-stone-100 mb-8 tracking-tighter leading-none select-none drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        <span className="block animate-in slide-in-from-top duration-700">AADISH</span>
                        <span className="block text-red-700 animate-[text-pop_0.5s_ease-out] relative">
                            ROULETTE
                            <span className="absolute -inset-1 text-red-400 opacity-20 blur-sm animate-glitch pointer-events-none">ROULETTE</span>
                        </span>
                    </h1>
                    <div className="text-stone-500 text-sm md:text-xl tracking-[0.5em] font-bold uppercase transition-all duration-300 group hover:text-stone-100">
                        <div className="animate-pulse mb-2">[ CLICK TO BIND SOUL ]</div>
                        <div className="text-[10px] text-stone-700 group-hover:text-red-900 transition-colors">By entering, you waive all rights to physical continuity</div>
                    </div>
                </div>

                {/* Scanline overlay */}
                <div className="scan-line !opacity-20" />
            </div>
        );
    }

    // Boot sequence screen
    return (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col justify-between p-8 md:p-12 font-mono">
            <div className="flex justify-between items-start text-stone-600 text-xs">
                <span>AADISH_OS v1.0.0</span>
                <span>MEM: 65536KB OK</span>
            </div>
            <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full gap-4">
                <div className="text-green-500 text-sm md:text-base space-y-1 h-64 overflow-hidden flex flex-col justify-end">
                    {bootLines.map((line, i) => <div key={i} className="typewriter">{`> ${line}`}</div>)}
                    <div className="text-green-500 animate-pulse">_</div>
                </div>
                <div className="w-full h-6 bg-stone-900 border border-stone-700 p-1 relative">
                    <div className="h-full bg-green-700 relative overflow-hidden transition-all duration-100 ease-linear" style={{ width: `${Math.min(100, loadingProgress)}%` }} />
                </div>
            </div>
        </div>
    );
};
