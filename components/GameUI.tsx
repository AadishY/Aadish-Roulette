import React, { useEffect, useState } from 'react';
import { GameState, PlayerState, LogEntry, TurnOwner, ItemType, AimTarget, ShellType, CameraView, GameSettings } from '../types';
import { Settings as SettingsIcon, Send } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { StatusDisplay } from './ui/StatusDisplay';
import { Inventory } from './ui/Inventory';
import { Controls } from './ui/Controls';
import { BootScreen } from './ui/BootScreen';
import { IntroScreen } from './ui/IntroScreen';
import ShellBackground from './ui/ShellBackground';
import { GameOverScreen } from './ui/GameOverScreen';
import { LootOverlay } from './ui/LootOverlay';
import { LogsDisplay } from './ui/LogsDisplay';
import { MultiplayerHUD } from './MultiplayerHUD';
import { GameStateData } from '../hooks/useSocket';
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
    onStartGame: (name: string) => void;
    onStartMultiplayer: () => void;
    onResetGame: (toMenu: boolean) => void;
    onFireShot: (target: TurnOwner) => void;
    onUseItem: (index: number) => void;
    onHoverTarget: (target: AimTarget) => void;
    onPickupGun: () => void;
    onOpenSettings: () => void;
    onOpenGuide: () => void;
    onUpdateName?: (name: string) => void;
    messages?: any[];
    onSendMessage?: (msg: string) => void;
    isMultiplayer?: boolean;
    mpGameState?: GameStateData | null;
    mpMyPlayerId?: string | null;
    onMpShoot?: (targetId: string) => void;
    onStealItem?: (index: number) => void;
    onBootComplete?: () => void;
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
    onStartMultiplayer,
    onUpdateName,
    messages = [],
    onSendMessage,
    isMultiplayer = false,
    mpGameState,
    mpMyPlayerId,
    onMpShoot,
    onStealItem,
    onBootComplete,
    isRecovering = false
}) => {
    const [inputName, setInputName] = useState(playerName || '');
    const [chatMsg, setChatMsg] = useState('');

    useEffect(() => { if (playerName) setInputName(playerName); }, [playerName]);

    const handleStartGame = () => {
        if (inputName.trim()) {
            if (onUpdateName) onUpdateName(inputName.trim());
            try {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => { });
                }
            } catch (e) { }
            onStartGame(inputName.trim());
        }
    };

    const handleStartMP = () => {
        if (inputName.trim()) {
            if (onUpdateName) onUpdateName(inputName.trim());
            localStorage.setItem('aadish_roulette_name', inputName.trim());
            onStartMultiplayer();
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
    const isMyTurn = isMultiplayer
        ? (mpGameState?.currentTurnPlayerId === mpMyPlayerId)
        : (gameState.phase === 'PLAYER_TURN');

    const uiStyle = {
        transform: `scale(${settings.uiScale})`,
        transformOrigin: 'center center',
        width: `${100 / settings.uiScale}%`,
        height: `${100 / settings.uiScale}%`,
        left: `${(100 - (100 / settings.uiScale)) / 2}%`,
        top: `${(100 - (100 / settings.uiScale)) / 2}%`,
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSendMessage && chatMsg.trim()) {
            onSendMessage(chatMsg.trim());
            setChatMsg('');
        }
    };

    return (
        <>
            {/* Falling Shells Background - Persistent across Boot and Intro */}
            {(gameState.phase === 'BOOT' || gameState.phase === 'INTRO') && (
                <ShellBackground />
            )}

            {gameState.phase === 'BOOT' && <BootScreen onContinue={onBootComplete} />}

            {/* FX Layers */}
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 z-10 ${overlayColor === 'red' ? 'bg-red-900/40' : overlayColor === 'green' ? 'bg-green-900/20' : overlayColor === 'scan' ? 'bg-fuchsia-900/30 mix-blend-overlay' : ''}`} />
            {showFlash && <div className="absolute inset-0 z-50 flash-screen" />}
            {smokeActive && <div className="absolute inset-0 z-30 pointer-events-none bg-stone-500/30 animate-[pulse_2s_ease-out] mix-blend-hard-light backdrop-blur-[2px]" />}
            {drinkActive && <div className="absolute inset-0 z-30 pointer-events-none bg-yellow-600/10 backdrop-blur-[3px]" />}
            {showBlood && <div className="absolute inset-0 pointer-events-none z-40 animate-[blood-pulse_2s_infinite]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(160,0,0,0.5)_80%,rgba(80,0,0,0.9)_100%)] mix-blend-multiply" /></div>}

            {/* Scaled UI */}
            <div className="absolute z-20 pointer-events-none" style={uiStyle}>

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
                        <div className="text-lg md:text-4xl font-black tracking-tight text-stone-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] pop-in text-center bg-black/60 px-4 py-2 md:px-8 md:py-4">
                            <RenderColoredText text={overlayText} />
                        </div>
                    </div>
                )}

                {/* Stealing Overlay - ENLARGED for better clicking */}
                {gameState.phase === 'STEALING' && (
                    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm px-4 pointer-events-auto">
                        <div className="text-2xl md:text-5xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] animate-pulse mb-4">
                            ⚡ STEAL AN ITEM ⚡
                        </div>
                        <div className="text-sm md:text-xl text-stone-300 font-bold bg-black/70 px-4 py-2 mb-8 border border-stone-700">
                            CLICK AN ITEM TO STEAL AND USE IT
                        </div>

                        {/* Enlarged Dealer Items */}
                        <div className="flex gap-4 md:gap-6 flex-wrap justify-center max-w-4xl">
                            {dealer.items.length === 0 ? (
                                <div className="text-stone-500 text-lg font-bold py-8">NO ITEMS TO STEAL</div>
                            ) : (
                                dealer.items.map((item, idx) => {
                                    const isAdrenaline = item === 'ADRENALINE';
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !isAdrenaline && onStealItem && onStealItem(idx)}
                                            disabled={isAdrenaline}
                                            className={`flex flex-col items-center justify-center w-20 h-24 md:w-28 md:h-36 bg-gradient-to-b transition-all shadow-lg relative ${isAdrenaline
                                                ? 'from-stone-900 to-stone-950 border-2 border-stone-700 cursor-not-allowed opacity-50'
                                                : 'from-stone-800 to-stone-900 border-2 border-pink-600 hover:border-pink-400 hover:bg-stone-700 cursor-pointer shadow-pink-900/30 hover:shadow-pink-500/50 hover:scale-110 active:scale-95'
                                                }`}
                                        >
                                            {isAdrenaline && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                                                    <span className="text-red-500 text-2xl md:text-3xl">🚫</span>
                                                </div>
                                            )}
                                            <div className={`mb-2 ${isAdrenaline ? 'text-stone-600' :
                                                item === 'BEER' ? 'text-amber-500' :
                                                    item === 'CIGS' ? 'text-red-500' :
                                                        item === 'GLASS' ? 'text-cyan-500' :
                                                            item === 'CUFFS' ? 'text-stone-400' :
                                                                item === 'SAW' ? 'text-orange-600' :
                                                                    item === 'PHONE' ? 'text-blue-300' :
                                                                        item === 'INVERTER' ? 'text-green-400' : 'text-stone-300'
                                                }`}>
                                                {item === 'BEER' && <Icons.Beer size={36} />}
                                                {item === 'CIGS' && <Icons.Cigs size={36} />}
                                                {item === 'GLASS' && <Icons.Glass size={36} />}
                                                {item === 'CUFFS' && <Icons.Cuffs size={36} />}
                                                {item === 'SAW' && <Icons.Saw size={36} />}
                                                {item === 'PHONE' && <Icons.Phone size={36} />}
                                                {item === 'INVERTER' && <Icons.Inverter size={36} />}
                                                {item === 'ADRENALINE' && <Icons.Adrenaline size={36} />}
                                            </div>
                                            <span className={`text-xs md:text-sm font-bold tracking-wider ${isAdrenaline ? 'text-stone-600 line-through' : 'text-stone-200'}`}>
                                                {item === 'INVERTER' ? 'INVERT' : item}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-6 text-stone-500 text-xs md:text-sm">
                            Stolen item will be USED IMMEDIATELY • <span className="text-red-500">ADRENALINE cannot be stolen</span>
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
                        onStartMultiplayer={handleStartMP}
                        onOpenSettings={onOpenSettings}
                        onOpenGuide={onOpenGuide}
                    />
                )}

                {/* Game Over - Singleplayer only */}
                {gameState.phase === 'GAME_OVER' && !isMultiplayer && (
                    <GameOverScreen winner={gameState.winner} onResetGame={onResetGame} />
                )}

                {/* Main HUD */}
                {gameState.phase !== 'INTRO' && gameState.phase !== 'BOOT' && gameState.phase !== 'GAME_OVER' && !showLootOverlay && (
                    <div className="absolute inset-0 z-20 p-2 md:p-8 flex flex-col justify-between pointer-events-none">

                        {/* Top Bar */}
                        <div className="flex justify-between items-start gap-2">
                            {isMultiplayer && mpGameState && mpMyPlayerId ? (
                                <MultiplayerHUD gameState={mpGameState} myPlayerId={mpMyPlayerId} />
                            ) : (
                                <StatusDisplay player={player} dealer={dealer} playerName={playerName} gameState={gameState} />
                            )}
                            <button onClick={() => {
                                audioManager.playSound('click');
                                onOpenSettings();
                            }} className="pointer-events-auto p-1 md:p-2 text-stone-600 hover:text-white transition-colors shrink-0">
                                <SettingsIcon size={18} className="md:w-5 md:h-5" />
                            </button>
                        </div>

                        {/* Controls - Bottom */}
                        <div className="flex-1 w-full flex items-end justify-center pointer-events-none mb-4 md:mb-8">
                            {/* Only show controls if not stealing phase */}
                            {gameState.phase !== 'STEALING' && gameState.phase !== 'GAME_OVER' && isMyTurn && !showLootOverlay && (
                                <Controls
                                    isGunHeld={isGunHeld}
                                    isProcessing={isProcessing}
                                    isRecovering={isRecovering}
                                    onPickupGun={onPickupGun}
                                    onFireShot={onFireShot}
                                    onHoverTarget={onHoverTarget}
                                    currentAimTarget={aimTarget}
                                    isMultiplayer={isMultiplayer}
                                    mpGameState={mpGameState}
                                    mpMyPlayerId={mpMyPlayerId}
                                    onMpShoot={onMpShoot}
                                />
                            )}
                        </div>

                        {/* Waiting Message */}
                        {isMultiplayer && !isMyTurn && mpGameState && !showLootOverlay && !isProcessing && (
                            <div className="flex-1 flex items-center justify-center pointer-events-none">
                                <div className="text-lg md:text-3xl font-black text-stone-500 bg-black/80 px-4 py-2 md:px-6 md:py-3 border border-stone-800 animate-pulse">
                                    {mpGameState.currentTurnPlayerId && mpGameState.players[mpGameState.currentTurnPlayerId]
                                        ? `${mpGameState.players[mpGameState.currentTurnPlayerId].name}'S TURN`
                                        : 'WAITING...'}
                                </div>
                            </div>
                        )}

                        {/* Bottom - Chat/Logs + Inventory */}
                        <div className="flex justify-between items-end gap-2 w-full h-24 md:h-40 pointer-events-none">
                            {/* Chat (MP) or Logs (SP) */}
                            {isMultiplayer ? (
                                <div className="pointer-events-auto flex-1 max-w-[280px] md:max-w-[350px] bg-black/70 border border-stone-800 flex flex-col h-full text-[10px] md:text-xs font-mono">
                                    <div className="bg-stone-900 px-2 py-0.5 text-stone-500 font-bold text-[8px] md:text-[10px]">
                                        COMMS
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-1 md:p-2 space-y-0.5">
                                        {messages.slice(-10).map((m, idx) => (
                                            <div key={idx} className="break-words leading-tight">
                                                <span className="text-blue-400 font-bold">{m.sender}: </span>
                                                <span className="text-stone-300">{m.text}</span>
                                            </div>
                                        ))}
                                        {messages.length === 0 && <div className="text-stone-700 italic text-center text-[8px]">-</div>}
                                    </div>
                                    <form onSubmit={handleChatSubmit} className="border-t border-stone-800 flex">
                                        <input
                                            value={chatMsg}
                                            onChange={e => setChatMsg(e.target.value)}
                                            placeholder="TYPE..."
                                            className="flex-1 bg-transparent p-1 px-2 text-stone-200 outline-none placeholder-stone-700 text-[10px] md:text-xs min-w-0"
                                        />
                                        <button type="submit" className="px-2 text-stone-500 hover:text-white">
                                            <Send size={12} />
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <LogsDisplay logs={logs} />
                            )}

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
                                    disabled={isMultiplayer && !isMyTurn}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};