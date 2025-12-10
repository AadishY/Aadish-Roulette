import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
    onComplete: () => void;
    onBack?: () => void; // New prop for back navigation
    text?: string;
    duration?: number;
    serverCheck?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, onBack, text: initialText = "CONNECTING...", duration = 3000, serverCheck = false }) => {
    const [progress, setProgress] = useState(0);
    const [text, setText] = useState(initialText);
    const [error, setError] = useState(false);
    const [retryTrigger, setRetryTrigger] = useState(0);
    const [checked, setChecked] = useState(!serverCheck); // If serverCheck is false, we are 'already checked'

    const handleRetry = () => {
        setError(false);
        setText(initialText);
        setProgress(0);
        setChecked(!serverCheck);
        setRetryTrigger(prev => prev + 1);
    };

    // Server Check Effect
    useEffect(() => {
        if (!serverCheck || checked) return;

        let isMounted = true;

        // Add a small delay so user sees "CONNECTING" before potential instant fail
        const timer = setTimeout(() => {
            fetch('http://localhost:3001', { method: 'HEAD', mode: 'no-cors' })
                .then(() => {
                    if (isMounted) setChecked(true);
                })
                .catch(() => {
                    if (isMounted) {
                        setError(true);
                        setText("ERROR: SERVER OFFLINE");
                    }
                });
        }, 500);

        return () => { isMounted = false; clearTimeout(timer); };
    }, [serverCheck, checked, retryTrigger]);

    // Progress Timer Effect
    useEffect(() => {
        if (error || !checked) return; // Don't run timer if error or not checked

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
    }, [duration, onComplete, error, checked, retryTrigger]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black text-green-500 z-[300] absolute inset-0 font-mono">
            {error ? (
                <div className="absolute top-4 right-4 flex gap-4 z-50">
                    <button
                        onClick={onBack}
                        className="px-6 py-2 border-2 border-red-600 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all bg-black"
                    >
                        BACK TO MENU
                    </button>
                    <button
                        onClick={handleRetry}
                        className="px-6 py-2 border-2 border-green-600 text-green-600 font-bold hover:bg-green-600 hover:text-white transition-all bg-black"
                    >
                        RETRY CONNECTION
                    </button>
                </div>
            ) : null}

            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                {/* Mock Terminal Background */}
                <div className="text-xs leading-none whitespace-pre-wrap p-4">
                    {Array(40).fill(0).map((_, i) => (
                        <div key={i}>{`> SYSTEM_CHECK_${Math.random().toString(36).substring(7).toUpperCase()} ... [OK]`}</div>
                    ))}
                </div>
            </div>

            {/* Progress Bar */}
            <div className={`text-4xl font-black tracking-widest mb-8 animate-pulse z-10 ${error ? 'text-red-600' : 'text-green-500'}`}>
                {text}
            </div>

            <div className={`w-96 max-w-[80%] h-6 border-2 relative overflow-hidden z-10 ${error ? 'bg-red-900/20 border-red-700' : 'bg-green-900/20 border-green-700'}`}>
                <div
                    className={`h-full transition-all duration-75 ease-out ${error ? 'bg-red-600' : 'bg-green-600'}`}
                    style={{ width: `${progress}%` }}
                />
                {/* Striped overlay pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
            </div>

            {!error && (
                <div className="mt-4 font-mono text-sm tracking-widest opacity-80 z-10">
                    {`> PROGRESS: ${Math.round(progress)}%`}
                </div>
            )}
        </div>
    );
};
