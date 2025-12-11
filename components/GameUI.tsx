import React, { useEffect, useState } from 'react';
import { GameState, PlayerState, LogEntry, TurnOwner, ItemType, AimTarget, ShellType, CameraView, GameSettings } from '../types';
import { Settings as SettingsIcon, Send } from 'lucide-react';
import { StatusDisplay } from './ui/StatusDisplay';
import { Inventory } from './ui/Inventory';
import { Controls } from './ui/Controls';
import { BootScreen } from './ui/BootScreen';
import { IntroScreen } from './ui/IntroScreen';
import { GameOverScreen } from './ui/GameOverScreen';
import { LootOverlay } from './ui/LootOverlay';
import { LogsDisplay } from './ui/LogsDisplay';
import { MultiplayerHUD } from './MultiplayerHUD';
import { GameStateData } from '../hooks/useSocket';

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
    isProcessing: boolean;
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
    onStealItem
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

    const isGunHeld = cameraView === 'GUN';
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
            {gameState.phase === 'BOOT' && <BootScreen />}

            {/* FX Layers */}
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 z-10 ${overlayColor === 'red' ? 'bg-red-900/40' : overlayColor === 'green' ? 'bg-green-900/20' : overlayColor === 'scan' ? 'bg-cyan-900/20' : ''}`} />
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

                {/* Stealing Overlay Message */}
                {gameState.phase === 'STEALING' && (
                    <div className="absolute inset-x-0 top-[15%] z-50 flex flex-col items-center justify-center pointer-events-none px-4">
                        <div className="text-2xl md:text-5xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] animate-pulse mb-2">
                            STEAL AN ITEM
                        </div>
                        <div className="text-sm md:text-xl text-stone-300 font-bold bg-black/70 px-4 py-1">
                            SELECT AN ITEM FROM OPPONENT
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
                            <button onClick={onOpenSettings} className="pointer-events-auto p-1 md:p-2 text-stone-600 hover:text-white transition-colors shrink-0">
                                <SettingsIcon size={18} className="md:w-5 md:h-5" />
                            </button>
                        </div>

                        {/* Center - Controls */}
                        {isMyTurn && !isProcessing && !showLootOverlay && (
                            <Controls
                                isGunHeld={isGunHeld}
                                isProcessing={isProcessing}
                                onPickupGun={onPickupGun}
                                onFireShot={onFireShot}
                                onHoverTarget={onHoverTarget}
                                isMultiplayer={isMultiplayer}
                                mpGameState={mpGameState}
                                mpMyPlayerId={mpMyPlayerId}
                                onMpShoot={onMpShoot}
                            />
                        )}

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
                                    onUseItem={onUseItem}
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