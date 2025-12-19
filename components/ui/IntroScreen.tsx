import React, { useEffect, useRef } from 'react';
import { Settings as SettingsIcon, HelpCircle, Trophy, ShieldAlert } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';


interface IntroScreenProps {
    playerName: string;
    inputName: string;
    setInputName: (name: string) => void;
    onStartGame: (hardMode?: boolean) => void;
    onOpenSettings: () => void;
    onOpenGuide: () => void;
    onOpenScoreboard: () => void;
    onStartMultiplayer: (name: string) => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
    inputName,
    setInputName,
    onStartGame,
    onOpenSettings,
    onOpenGuide,
    onOpenScoreboard,
    onStartMultiplayer
}) => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [scale, setScale] = React.useState(1);
    const [showHardModeWarning, setShowHardModeWarning] = React.useState(false);

    // PWA Install State
    const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
    const [isInstallable, setIsInstallable] = React.useState(false);

    const [isIOS, setIsIOS] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);
    const [isStandalone, setIsStandalone] = React.useState(false);

    useEffect(() => {
        // Detect Standalone Mode
        const checkStandalone = () => {
            const isS = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone ||
                document.referrer.includes('android-app://');
            setIsStandalone(!!isS);
        };
        checkStandalone();

        // Prevent keyboard popup on mobile (touch devices or small screens)
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < 1024;

        // Detect Mobile & iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);
        setIsMobile(isMobileUA);

        // ALWAYS Show Install Button on Mobile (Fallback instructions if event fails)
        if (isMobileUA || ios) setIsInstallable(true);

        const handleResize = () => {
            const hScale = Math.min(1, (window.innerHeight - 20) / 650);
            const wScale = Math.min(1, (window.innerWidth - 20) / 850);
            let newScale = Math.min(hScale, wScale);
            // On mobile, we want it a bit larger than 0.4 if possible
            if (window.innerWidth < 500) {
                newScale = Math.max(newScale, 0.55);
            } else {
                newScale = Math.max(newScale, 0.4);
            }
            if (newScale > 1.2) newScale = 1.2;
            setScale(newScale);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // Check if event was already captured globally
        if ((window as any).deferredPWAPrompt) {
            setDeferredPrompt((window as any).deferredPWAPrompt);
            setIsInstallable(true);
        }

        // PWA Install Handler
        const pwaHandler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
            (window as any).deferredPWAPrompt = e;
        };

        const globalPwaHandler = (e: any) => {
            if (e.detail) {
                setDeferredPrompt(e.detail);
                setIsInstallable(true);
            }
        };

        const appInstalledHandler = () => {
            setIsStandalone(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            (window as any).deferredPWAPrompt = null;
        };

        window.addEventListener('beforeinstallprompt', pwaHandler);
        window.addEventListener('pwa-prompt-available' as any, globalPwaHandler);
        window.addEventListener('appinstalled', appInstalledHandler);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('beforeinstallprompt', pwaHandler);
            window.removeEventListener('pwa-prompt-available' as any, globalPwaHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstallable(false);
            }
        } else {
            // Fallback: Instructions if browser prompt isn't ready/supported
            if (isIOS) {
                alert("📲 INSTALL ON iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'");
            } else {
                alert("📲 INSTALL MANUALLY:\n\n1. Tap the Browser Menu (three dots ⋮ or arrow)\n2. Select 'Add to Home Screen' or 'Install App'");
            }
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-auto bg-black/40 backdrop-blur-[2px]">
            {showHardModeWarning && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 animate-in fade-in zoom-in duration-500 p-4">
                    {/* Retro Static Overlay */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-screen bg-[url('https://media.giphy.com/media/oEI9uWU0WMrQmInJWC/giphy.gif')] bg-repeat" />

                    <div
                        className="relative bg-stone-950/80 backdrop-blur-xl border border-red-900/50 p-6 md:p-12 max-w-xl text-center shadow-[0_0_100px_rgba(220,38,38,0.2)] overflow-hidden group origin-center transition-transform duration-200"
                        style={{ transform: `scale(${scale})` }}
                    >
                        {/* Background Glitch Elements */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,rgba(220,38,38,0.05)_15px,rgba(220,38,38,0.05)_30px)]" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="text-red-700 mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"><ShieldAlert size={80} /></div>
                            <h2 className="text-5xl md:text-7xl font-black text-red-600 mb-2 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]">WARNING</h2>
                            <p className="text-stone-400 text-lg md:text-xl font-bold mb-8 tracking-[0.4em] uppercase">High Stakes Protocol</p>

                            <div className="bg-black/60 p-6 border border-red-900/30 mb-10 w-full backdrop-blur-md relative overflow-hidden group-hover:border-red-600/30 transition-colors">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-red-600/50 animate-[scan-line-move_3s_linear_infinite]" />
                                <div className="space-y-4">
                                    <p className="text-red-500/80 font-mono text-sm md:text-base font-bold tracking-[0.2em] flex items-center justify-center gap-4">
                                        <span className="w-1.5 h-1.5 bg-red-800 rounded-full" /> DEALER IS RUTHLESS
                                    </p>
                                    <p className="text-red-500/80 font-mono text-sm md:text-base font-bold tracking-[0.2em] flex items-center justify-center gap-4">
                                        <span className="w-1.5 h-1.5 bg-red-800 rounded-full" /> DOUBLE OR NOTHING
                                    </p>
                                    <p className="text-red-500/80 font-mono text-sm md:text-base font-bold tracking-[0.2em] flex items-center justify-center gap-4">
                                        <span className="w-1.5 h-1.5 bg-red-800 rounded-full" /> NO SECOND CHANCES
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5 w-full">
                                <button
                                    onClick={() => {
                                        audioManager.playSound('insert');
                                        onStartGame(true);
                                    }}
                                    className="w-full py-5 bg-red-900/20 hover:bg-red-700 text-white font-black text-2xl tracking-[0.3em] border-2 border-red-700/50 hover:border-red-500 transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(220,38,38,0.4)] active:scale-95 group relative overflow-hidden"
                                >
                                    <span className="relative z-10">ACCEPT FATE</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                </button>
                                <button
                                    onClick={() => setShowHardModeWarning(false)}
                                    className="w-full py-3 bg-transparent text-stone-600 font-bold hover:text-stone-400 transition-colors tracking-[0.4em] text-xs uppercase"
                                >
                                    — ABORT MISSION —
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="relative z-10 text-center max-w-xl w-full p-8 flex flex-col justify-center origin-center transition-all duration-300"
                style={{ transform: `scale(${scale})` }}
            >
                <div className="mb-10 relative">
                    <h1 className="text-7xl sm:text-8xl font-black mb-0 text-white tracking-tighter leading-[0.85] drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        AADISH<br />
                        <span className="text-red-700/90 tracking-[-0.05em] relative">
                            ROULETTE
                            <span className="absolute -inset-1 blur-2xl bg-red-950/20 -z-10" />
                        </span>
                    </h1>
                    <div className="mt-4 flex items-center justify-center gap-4">
                        <div className="h-[1px] w-12 bg-stone-800" />
                        <p className="text-stone-500 font-bold tracking-[0.6em] text-[10px] uppercase">Simulation 1.0.6</p>
                        <div className="h-[1px] w-12 bg-stone-800" />
                    </div>
                </div>

                <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
                    {/* Identity Section */}
                    <div className="text-center mb-2">
                        <p className="text-[10px] text-red-900/40 font-black tracking-[0.5em] uppercase mb-2 animate-pulse">Click to bind soul</p>
                        <div className="relative group">
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                placeholder="IDENTITY"
                                maxLength={12}
                                className="w-full bg-stone-950/40 border-2 border-stone-800/80 p-5 text-2xl font-black text-white outline-none focus:border-red-600/50 focus:bg-stone-900/20 transition-all duration-500 tracking-[0.2em] uppercase text-center placeholder-stone-800/50 backdrop-blur-xl rounded-xl"
                            />
                            <div className="absolute inset-x-0 -bottom-1 h-[2px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700" />
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onStartGame(false);
                        }} disabled={!inputName.trim()} className="col-span-8 px-4 py-5 bg-white text-black font-black text-xl hover:bg-stone-200 active:scale-[0.98] transition-all duration-300 disabled:opacity-20 disabled:grayscale tracking-[0.4em] rounded-xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] relative overflow-hidden group/btn uppercase leading-none">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                            <span>START GAME</span>
                        </button>

                        <button onClick={() => {
                            audioManager.playSound('click');
                            onStartMultiplayer(inputName.trim());
                        }} disabled={!inputName.trim()} className="col-span-4 py-5 bg-stone-950/60 border border-stone-800 text-stone-200 font-black text-[10px] md:text-sm hover:text-white hover:border-white active:scale-[0.98] transition-all duration-300 disabled:opacity-20 flex flex-col items-center justify-center gap-1 group rounded-xl hover:bg-stone-900/40 shadow-[0_10px_30px_rgba(255,255,255,0.02)] uppercase tracking-widest leading-none">
                            MULTIPLAYER
                        </button>

                        <button onClick={() => {
                            audioManager.playSound('click');
                            setShowHardModeWarning(true);
                        }} disabled={!inputName.trim()} className="col-span-12 py-3 bg-stone-950/60 border border-red-900/40 text-red-600 font-black text-[9px] md:text-xs hover:text-red-500 hover:border-red-600 active:scale-[0.98] transition-all duration-300 disabled:opacity-20 flex flex-col items-center justify-center gap-1 group rounded-xl hover:bg-red-950/20 shadow-[0_10px_30px_rgba(220,38,38,0.05)] uppercase tracking-widest leading-none">
                            HARD MODE
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-2">
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenGuide();
                        }} className="px-4 py-4 bg-stone-900/20 border border-stone-800/40 text-stone-500 font-black text-[9px] flex flex-col items-center justify-center gap-2 tracking-[0.3em] hover:text-cyan-400 hover:border-cyan-900/50 hover:bg-cyan-950/10 active:scale-95 transition-all duration-300 uppercase rounded-xl">
                            <HelpCircle size={18} className="text-stone-600" />
                            Guide
                        </button>
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenScoreboard();
                        }} className="px-4 py-4 bg-stone-900/20 border border-stone-800/40 text-stone-500 font-black text-[9px] flex flex-col items-center justify-center gap-2 tracking-[0.3em] hover:text-amber-500 hover:border-amber-900/50 hover:bg-amber-950/10 active:scale-95 transition-all duration-300 uppercase rounded-xl">
                            <Trophy size={18} className="text-stone-600" />
                            Stats
                        </button>
                        <button onClick={() => {
                            audioManager.playSound('click');
                            onOpenSettings();
                        }} className="px-4 py-4 bg-stone-900/20 border border-stone-800/40 text-stone-500 font-black text-[9px] flex flex-col items-center justify-center gap-2 tracking-[0.3em] hover:text-stone-100 hover:border-stone-600 hover:bg-stone-800/40 active:scale-95 transition-all duration-300 uppercase rounded-xl">
                            <SettingsIcon size={18} className="text-stone-600" />
                            Config
                        </button>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4">
                    {!isStandalone && (isInstallable || isMobile || isIOS) && (
                        <button
                            onClick={handleInstallClick}
                            className="px-6 py-2 rounded-full border border-blue-900/30 bg-blue-950/20 text-blue-500 text-[10px] font-black tracking-[0.5em] hover:bg-blue-900/30 hover:text-blue-400 transition-all animate-pulse uppercase"
                        >
                            Deploy Local App
                        </button>
                    )}
                    {isStandalone ? (
                        <div className="text-stone-700 text-[9px] font-black tracking-[0.8em] uppercase opacity-40">System Link: Established</div>
                    ) : (
                        <div className="text-stone-800 text-[9px] font-black tracking-[0.8em] uppercase">Web Instance • 1.0.6</div>
                    )}
                </div>
            </div>
        </div>
    );
};
