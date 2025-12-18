import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
    onComplete: () => void;
    onBack?: () => void; // New prop for back navigation
    text?: string;
    duration?: number;
    serverCheck?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, onBack, text: initialText = "INITIALIZING...", duration = 3000 }) => {
    const [progress, setProgress] = useState(0);
    const [text, setText] = useState(initialText);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    // Progress Timer Effect
    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const prog = Math.min((elapsed / duration) * 100, 100);
            setProgress(prog);

            if (prog >= 100) {
                clearInterval(interval);
                setTimeout(onComplete, 500);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration, onComplete]);

    // Terminal Lines Effect
    useEffect(() => {
        const lines = [
            "BOOT_SEQ: 0x4F229A",
            "SCANNING_MEMORY...",
            "LOADING_NEURAL_NET...",
            "CONNECTING_TABLE_CONTROL...",
            "CHECKING_AMMUNITION_INTEGRITY...",
            "VERIFYING_DEALER_HANDSHAKE...",
            "INITIALIZING_PHYSICS_ENGINE...",
            "CALIBRATING_RNG_SEED...",
            "SYNCING_AUDIO_DRIVERS...",
            "ENABLING_LIFELINE_MONITOR...",
            "BOOT_COMPLETE."
        ];

        let current = 0;
        const lineInterval = setInterval(() => {
            if (current < lines.length) {
                setTerminalLines(prev => [...prev, `> ${lines[current]}`].slice(-15));
                current++;
            }
        }, duration / lines.length);

        return () => clearInterval(lineInterval);
    }, [duration]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black text-green-500 z-[300] absolute inset-0 font-mono crt overflow-hidden">
            {/* Background Terminal Atmosphere */}
            <div className="absolute inset-0 opacity-20 pointer-events-none p-4 font-mono text-[10px] md:text-xs">
                {terminalLines.map((line, i) => (
                    <div key={i} className="mb-1 animate-in fade-in slide-in-from-left duration-300">
                        {line}
                    </div>
                ))}
            </div>

            {/* Scanning Line overlay */}
            <div className="scan-line !opacity-20" />

            {/* Main Loading UI */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="text-4xl md:text-6xl font-black tracking-widest mb-12 text-glitch text-shadow-none">
                    {text}
                </div>

                <div className="w-96 max-w-[90%] h-4 md:h-8 border-4 border-green-900 bg-stone-950 relative overflow-hidden">
                    <div
                        className="h-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-all duration-75 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                    {/* Glass glare effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </div>

                <div className="mt-6 font-mono text-sm md:text-xl tracking-[0.5em] font-bold">
                    {Math.round(progress)}%
                </div>

                <div className="mt-2 text-[10px] text-green-800 animate-pulse font-bold tracking-[0.2em] uppercase">
                    Unauthorized access is punishable by death
                </div>
            </div>
        </div>
    );
};
