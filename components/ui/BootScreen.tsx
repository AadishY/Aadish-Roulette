import React, { useEffect, useState } from 'react';

export const BootScreen: React.FC = () => {
    const [bootLines, setBootLines] = useState<string[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);

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
            timeouts.push(setTimeout(() => setBootLines(prev => [...prev, text]), delay));
        });
        const interval = setInterval(() => {
            setLoadingProgress(p => p >= 100 ? 100 : p + 5);
        }, 100);
        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col justify-between p-8 md:p-12 font-mono">
            <div className="flex justify-between items-start text-stone-600 text-xs"><span>AADISH_OS v1.0.0</span><span>MEM: 65536KB OK</span></div>
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
