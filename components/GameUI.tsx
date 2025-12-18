import React, { useEffect, useState } from 'react';
import { GameState, PlayerState, LogEntry, TurnOwner, ItemType, AimTarget, ShellType, CameraView, GameSettings } from '../types';
import { Settings as SettingsIcon, Skull } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { StatusDisplay } from './ui/StatusDisplay';
import { Inventory } from './ui/Inventory';
import { Controls } from './ui/Controls';
import { BootScreen } from './ui/BootScreen';
import { IntroScreen } from './ui/IntroScreen';
import ShellBackground from './ui/ShellBackground';
import { GameOverScreen } from './ui/GameOverScreen';
import { LootOverlay } from './ui/LootOverlay';
import { Icons } from './ui/Icons';

interface GameUIProps {
    gameState: GameState;
    player: PlayerState;
    dealer: PlayerState;
    logs: LogEntry[];
    overlayText: string | null;
    overlayColor: 'none' | 'red' | 'green' | 'scan';
    showBlood: boolean;
    showFlash: boolean;
    showLootOverlay: boolean;
    triggerHeal: number;
    triggerDrink: number;
    knownShell: ShellType | null;
    receivedItems: ItemType[];
    playerName: string;
    cameraView: CameraView;
    aimTarget?: AimTarget; // Added for controls logic
    isProcessing: boolean;
    isRecovering?: boolean; // Added for blocking gun pickup during recovery
    settings: GameSettings;
    onStartGame: (name: string, hardMode?: boolean) => void;
    onResetGame: (toMenu: boolean) => void;
    onFireShot: (target: TurnOwner) => void;
    onUseItem: (index: number) => void;
    onHoverTarget: (target: AimTarget) => void;
    onPickupGun: () => void;
    onOpenSettings: () => void;
    onOpenGuide: () => void;
    onOpenScoreboard: () => void;
    onUpdateName?: (name: string) => void;
    onStealItem?: (index: number) => void;
    onBootComplete?: () => void;
    matchData?: any;
}

const RenderColoredText = ({ text }: { text: string }) => {
    if (!text) return null;
    const parts = text.split(/(LIVE|BLANK)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part === 'LIVE') return <span key={i} className="text-red-600 animate-pulse font-black">{part}</span>;
                if (part === 'BLANK') return <span key={i} className="text-blue-500 font-black">{part}</span>;
                return <span key={i}>{part}</span>;
            })}
        </>
    );
};

export const GameUI: React.FC<GameUIProps> = ({
    gameState,
    player,
    dealer,
    logs,
    overlayText,
    overlayColor,
    showBlood,
    showFlash,
    showLootOverlay,
    triggerHeal,
    triggerDrink,
    knownShell,
    receivedItems,
    playerName,
    cameraView,
    aimTarget = 'IDLE',
    isProcessing,
    settings,
    onStartGame,
    onResetGame,
    onFireShot,
    onUseItem,
    onHoverTarget,
    onPickupGun,
    onOpenSettings,
    onOpenGuide,
    onOpenScoreboard,
    onUpdateName,
    onStealItem,
    onBootComplete,
    isRecovering = false,
    matchData
}) => {
    const [inputName, setInputName] = useState(playerName || '');

    useEffect(() => { if (playerName) setInputName(playerName); }, [playerName]);

    const handleStartGame = (hardMode?: boolean) => {
        if (inputName.trim()) {
            if (onUpdateName) onUpdateName(inputName.trim());
            try {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => { });
                }
            } catch (e) { }
            onStartGame(inputName.trim(), hardMode);
        }
    };


    const [smokeActive, setSmokeActive] = useState(false);
    useEffect(() => {
        if (triggerHeal > 0) {
            setSmokeActive(true);
            setTimeout(() => setSmokeActive(false), 2000);
        }
    }, [triggerHeal]);

    const [drinkActive, setDrinkActive] = useState(false);
    useEffect(() => {
        if (triggerDrink > 0) {
            setDrinkActive(true);
            setTimeout(() => setDrinkActive(false), 1500);
        }
    }, [triggerDrink]);

    const isGunHeld = cameraView === 'GUN' || aimTarget === 'CHOOSING' || aimTarget === 'OPPONENT' || aimTarget === 'SELF';
    const isMyTurn = (gameState.phase === 'PLAYER_TURN');

    // Robust UI Scaling: Scale the UI container while keeping it centered and contained
    const [screenSize, setScreenSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
        const handleResize = () => setScreenSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isVeryNarrow = screenSize.w < 400;
    const isMobileViewport = screenSize.w < 768;

    // Auto-adjust scale for small screens if needed, otherwise use user setting
    const baseScale = isMobileViewport ? Math.min(settings.uiScale, 0.75) : settings.uiScale;
    const finalScale = isVeryNarrow ? baseScale * 0.85 : baseScale;

    const uiStyle = {
        transform: `scale(${finalScale})`,
        transformOrigin: 'center center',
        width: `${100 / finalScale}%`,
        height: `${100 / finalScale}%`,
        left: `${(100 - (100 / finalScale)) / 2}%`,
        top: `${(100 - (100 / finalScale)) / 2}%`,
    };

    return (
        <>
            {/* Falling Shells Background - Always mounted for persistence, paused when not needed */}
            <div className={`absolute inset-0 bg-black transition-opacity ${gameState.phase === 'BOOT' || gameState.phase === 'INTRO' ? 'opacity-100 duration-1000' : 'opacity-0 duration-0 pointer-events-none'}`}>
                <ShellBackground active={gameState.phase === 'BOOT' || gameState.phase === 'INTRO'} />
            </div>

            {gameState.phase === 'BOOT' && <BootScreen onContinue={onBootComplete} />}

            {/* FX Layers */}
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 z-10 ${overlayColor === 'red' ? 'bg-red-900/40' : overlayColor === 'green' ? 'bg-green-900/20' : overlayColor === 'scan' ? 'bg-fuchsia-900/30 mix-blend-overlay' : ''}`} />

            {/* Cinematic Framing */}
            <div className={`fixed inset-0 pointer-events-none z-[100] ${(gameState.phase === 'RESOLVING' || gameState.phase === 'STEALING' || gameState.phase === 'LOOTING' || gameState.phase === 'GAME_OVER') ? 'letterbox-active' : ''}`}>
                <div className="letterbox-top" />
                <div className="letterbox-bottom" />
            </div>

            {/* Cinematic Vignette */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] mix-blend-multiply" />

            {showFlash && <div className="absolute inset-0 z-50 flash-screen" />}
            {smokeActive && <div className="absolute inset-0 z-30 pointer-events-none bg-stone-500/30 animate-[pulse_2s_ease-out] mix-blend-hard-light backdrop-blur-[2px]" />}
            {drinkActive && <div className="absolute inset-0 z-30 pointer-events-none bg-yellow-600/10 backdrop-blur-[3px]" />}
            {showBlood && (
                <div className="absolute inset-0 pointer-events-none z-40 blood-overlay blood-active">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/black-linen-2.png')] mix-blend-multiply" />
                </div>
            )}

            {/* Scaled UI */}
            <div className={`absolute z-20 pointer-events-none ${gameState.isHardMode ? 'vhs-flicker' : ''}`} style={uiStyle}>
                {/* Dynamic Scanline for Hard Mode */}
                {gameState.isHardMode && <div className="scan-line" />}

                {/* Known Shell - Mobile Optimized */}
                {knownShell && (
                    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center px-4">
                        <div className="text-2xl md:text-7xl font-black tracking-widest bg-black/80 px-3 py-2 md:px-8 md:py-4 border-y-2 md:border-y-4 border-stone-100 animate-[text-pop_0.3s_ease-out] text-center">
                            CHAMBER: <RenderColoredText text={knownShell} />
                        </div>
                    </div>
                )}

                {/* Cuffs Indicators */}
                {(player.isHandcuffed || dealer.isHandcuffed) && (
                    <div className={`absolute ${player.isHandcuffed ? 'bottom-[30%] left-4 md:left-[20%]' : 'top-[20%] right-4 md:right-[20%]'} z-20 animate-pulse pointer-events-none`}>
                        <div className="text-sm md:text-2xl font-black text-stone-100 bg-red-600 px-2 py-0.5 md:px-4 md:py-1 rotate-12 shadow-lg border border-white">CUFFED</div>
                    </div>
                )}

                {/* Overlay Text - Centered Announcements */}
                {overlayText && !showLootOverlay && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
                        {gameState.isHardMode && (overlayText.includes('ROUND') || overlayText.includes('STAGE')) ? (
                            <div className="flex flex-col items-center animate-[red-glitch_0.3s_infinite]">
                                <div className="text-3xl md:text-8xl font-black italic tracking-tighter text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] pop-in text-center bg-black/95 px-10 py-6 border-y-4 border-red-700 flex items-center gap-6 md:gap-12 skew-x-[-8deg] relative overflow-hidden group">
                                    {/* Scanline overlay for the box */}
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(220,38,38,0.1)_50%)] bg-[length:100%_4px] pointer-events-none" />

                                    <div className="flex flex-col items-center relative z-10">
                                        <div className="flex items-center gap-6 md:gap-10">
                                            <Skull size={56} className="text-red-700/50 hidden md:block" />
                                            <span>{overlayText}</span>
                                            <Skull size={56} className="text-red-700/50 hidden md:block" />
                                        </div>
                                    </div>

                                    {/* Edge highlight */}
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                                </div>
                            </div>
                        ) : (
                            <div className="text-lg md:text-4xl font-black tracking-tight text-stone-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] pop-in text-center bg-black/80 px-4 py-2 md:px-8 md:py-4 border-y-2 border-stone-100/20 backdrop-blur-sm rounded-sm">
                                <RenderColoredText text={overlayText} />
                            </div>
                        )}
                    </div>
                )}

                {/* Stealing Overlay - CINEMATIC EXTRACTION */}
                {gameState.phase === 'STEALING' && (
                    <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-[16px] px-6 pointer-events-auto animate-in fade-in duration-700 overflow-hidden">
                        {/* Atmospheric Overlays */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.3),transparent_70%)]" />
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-linen-2.png')] animate-[pulse_4s_infinite]" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-[scanline_3s_linear_infinite] shadow-[0_0_20px_rgba(220,38,38,0.5)]" />

                        <div className="relative z-10 flex flex-col items-center max-w-5xl w-full">
                            <div className="mb-14 text-center">
                                <h2 className="text-5xl md:text-8xl font-black text-white tracking-[-0.05em] mb-4 uppercase drop-shadow-[0_0_40px_rgba(255,0,0,0.4)] italic">
                                    Adrenaline <span className="text-red-700 animate-pulse">Extraction</span>
                                </h2>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-stone-400 font-bold tracking-[0.6em] text-[9px] md:text-xs uppercase bg-black/40 px-6 py-1.5 rounded-full border border-red-900/30">
                                        Neural Link Active • Seize Repository
                                    </p>
                                    <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-red-900/50 to-transparent mt-2" />
                                </div>
                            </div>

                            {/* Extraction Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6 w-full">
                                {dealer.items.length === 0 ? (
                                    <div className="col-span-full py-20 text-center">
                                        <p className="text-stone-600 font-black tracking-[0.3em] uppercase italic text-xl">Inventory Empty</p>
                                    </div>
                                ) : (
                                    dealer.items.map((item, idx) => {
                                        const isAdrenaline = item === 'ADRENALINE';
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => !isAdrenaline && onStealItem && onStealItem(idx)}
                                                disabled={isAdrenaline}
                                                className={`group relative flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border transition-all duration-500 overflow-hidden ${isAdrenaline
                                                    ? 'bg-black/60 border-white/5 cursor-not-allowed grayscale'
                                                    : 'bg-stone-900/40 border-white/10 hover:border-red-600/50 hover:bg-red-950/20 hover:scale-105 active:scale-95 shadow-xl hover:shadow-red-900/20'
                                                    }`}
                                            >
                                                {/* Card BG Deco */}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />

                                                {isAdrenaline ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20">
                                                        <Icons.Adrenaline size={48} className="text-stone-700 mb-2" />
                                                        <span className="text-[8px] font-black text-stone-600 tracking-widest uppercase bg-stone-900 px-2 py-0.5 rounded">Locked</span>
                                                    </div>
                                                ) : (
                                                    <div className="relative z-10 flex flex-col items-center">
                                                        <div className={`mb-4 transition-transform group-hover:scale-110 duration-500 ${item === 'BEER' ? 'text-amber-500' :
                                                            item === 'CIGS' ? 'text-red-500' :
                                                                item === 'GLASS' ? 'text-cyan-500' :
                                                                    item === 'CUFFS' ? 'text-stone-400' :
                                                                        item === 'SAW' ? 'text-orange-600' :
                                                                            item === 'PHONE' ? 'text-blue-300' :
                                                                                item === 'INVERTER' ? 'text-green-400' :
                                                                                    item === 'CHOKE' ? 'text-stone-300' :
                                                                                        item === 'REMOTE' ? 'text-red-500' :
                                                                                            item === 'BIG_INVERTER' ? 'text-orange-500' : 'text-stone-300'
                                                            }`}>
                                                            {item === 'BEER' && <Icons.Beer size={48} />}
                                                            {item === 'CIGS' && <Icons.Cigs size={48} />}
                                                            {item === 'GLASS' && <Icons.Glass size={48} />}
                                                            {item === 'CUFFS' && <Icons.Cuffs size={48} />}
                                                            {item === 'SAW' && <Icons.Saw size={48} />}
                                                            {item === 'PHONE' && <Icons.Phone size={48} />}
                                                            {item === 'INVERTER' && <Icons.Inverter size={48} />}
                                                            {item === 'CHOKE' && <Icons.Choke size={48} />}
                                                            {item === 'REMOTE' && <Icons.Remote size={48} />}
                                                            {item === 'BIG_INVERTER' && <Icons.BigInverter size={48} />}
                                                        </div>
                                                        <span className="text-[10px] md:text-sm font-black text-stone-200 tracking-[0.2em] uppercase group-hover:text-white transition-colors">
                                                            {item === 'INVERTER' ? 'INVERT' : item === 'BIG_INVERTER' ? 'BIG INV' : item}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Hover Overlay info */}
                                                {!isAdrenaline && (
                                                    <div className="absolute bottom-0 left-0 w-full h-1/4 bg-red-600 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform">
                                                        <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase">SEIZE</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="mt-16 text-stone-600 text-[10px] font-bold tracking-[0.5em] uppercase flex items-center gap-6">
                                <div className="h-[1px] w-12 bg-stone-800" />
                                Operation Immediate Extraction
                                <div className="h-[1px] w-12 bg-stone-800" />
                            </div>
                        </div>
                    </div>
                )}

                {showLootOverlay && <LootOverlay receivedItems={receivedItems} />}

                {/* Intro Screen */}
                {gameState.phase === 'INTRO' && (
                    <IntroScreen
                        playerName={playerName}
                        inputName={inputName}
                        setInputName={setInputName}
                        onStartGame={handleStartGame}
                        onOpenSettings={onOpenSettings}
                        onOpenGuide={onOpenGuide}
                        onOpenScoreboard={onOpenScoreboard}
                    />
                )}

                {/* Game Over - Singleplayer only */}
                {gameState.phase === 'GAME_OVER' && (
                    <GameOverScreen
                        winner={gameState.winner}
                        onResetGame={onResetGame}
                        matchData={matchData}
                    />
                )}

                {/* Main HUD */}
                {gameState.phase !== 'INTRO' && gameState.phase !== 'BOOT' && gameState.phase !== 'GAME_OVER' && !showLootOverlay && (
                    <div className="absolute inset-0 z-20 p-2 md:p-8 flex flex-col justify-between pointer-events-none">

                        {/* Top Bar */}
                        <div className="flex justify-between items-start gap-2">
                            <StatusDisplay player={player} dealer={dealer} playerName={playerName} gameState={gameState} />
                            <button onClick={() => {
                                audioManager.playSound('click');
                                onOpenSettings();
                            }} className="pointer-events-auto p-1 md:p-2 text-stone-600 hover:text-white transition-colors shrink-0">
                                <SettingsIcon size={18} className="md:w-5 md:h-5" />
                            </button>
                        </div>

                        {/* Controls - Positioned Absolute to prevent floating high on mobile */}
                        <div className="absolute bottom-16 lg:bottom-40 left-0 right-0 flex justify-center pointer-events-none z-30 pb-2 lg:pb-0">
                            {/* Only show controls if not stealing phase */}
                            {gameState.phase !== 'STEALING' && isMyTurn && !showLootOverlay && (
                                <Controls
                                    isGunHeld={isGunHeld}
                                    isProcessing={isProcessing}
                                    isRecovering={isRecovering}
                                    onPickupGun={onPickupGun}
                                    onFireShot={onFireShot}
                                    onHoverTarget={onHoverTarget}
                                    currentAimTarget={aimTarget}
                                    isMultiplayer={false}
                                />
                            )}
                        </div>

                        {/* Bottom - Chat/Logs + Inventory */}
                        <div className="flex justify-between items-end gap-2 w-full h-16 lg:h-40 pointer-events-none">
                            <div className="flex-1" />

                            {/* Inventory */}
                            {/* Inventory vs Steal UI */}
                            {gameState.phase === 'STEALING' ? (
                                <Inventory
                                    player={dealer} // Show DEALER items to steal
                                    dealer={player} // (Swap context)
                                    gameState={gameState}
                                    cameraView={cameraView}
                                    isProcessing={false}
                                    onUseItem={(idx) => {
                                        audioManager.playSound('grab');
                                        if (onStealItem) onStealItem(idx);
                                    }}
                                    disabled={false}
                                />
                            ) : (
                                <Inventory
                                    player={player}
                                    dealer={dealer}
                                    gameState={gameState}
                                    cameraView={cameraView}
                                    isProcessing={isProcessing}
                                    onUseItem={(idx) => {
                                        audioManager.playSound('grab');
                                        onUseItem(idx);
                                    }}
                                    disabled={false}
                                    isGunHeld={isGunHeld}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};