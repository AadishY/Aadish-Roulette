import React, { useEffect, useRef, useState } from 'react';
import { GameState, PlayerState, LogEntry, TurnOwner, ItemType, AimTarget, ShellType, CameraView, GameSettings } from '../types';
import { Settings as SettingsIcon } from 'lucide-react';
import { StatusDisplay } from './ui/StatusDisplay';
import { Inventory } from './ui/Inventory';
import { Controls } from './ui/Controls';
import { BootScreen } from './ui/BootScreen';
import { IntroScreen } from './ui/IntroScreen';
import { GameOverScreen } from './ui/GameOverScreen';
import { LootOverlay } from './ui/LootOverlay';
import { LogsDisplay } from './ui/LogsDisplay';

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
    onUpdateName?: (name: string) => void;
    messages?: any[];
    onSendMessage?: (msg: string) => void;
    isMultiplayer?: boolean;
    players?: any[];
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
    onStartMultiplayer,
    onUpdateName,
    messages = [],
    onSendMessage,
    isMultiplayer = false,
    players
}) => {

    const [inputName, setInputName] = useState(playerName || '');
    const [chatMsg, setChatMsg] = useState('');

    useEffect(() => { if (playerName) setInputName(playerName); }, [playerName]);

    const handleStartGame = () => {
        if (inputName.trim()) {
            if (onUpdateName) onUpdateName(inputName.trim()); // Sync name up
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

            // Save name immediately for MP flow
            localStorage.setItem('aadish_roulette_name', inputName.trim());
            console.log("Saving name (MP Start):", inputName.trim());

            onStartMultiplayer();
        }
    };

    const [smokeActive, setSmokeActive] = React.useState(false);
    useEffect(() => {
        if (triggerHeal > 0) {
            setSmokeActive(true);
            setTimeout(() => setSmokeActive(false), 2000);
        }
    }, [triggerHeal]);

    const [drinkActive, setDrinkActive] = React.useState(false);
    useEffect(() => {
        if (triggerDrink > 0) {
            setDrinkActive(true);
            setTimeout(() => setDrinkActive(false), 1500);
        }
    }, [triggerDrink]);

    const isGunHeld = cameraView === 'GUN';

    // Apply UI Scaling to the wrapper
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

            {/* FX Layers - Not scaled */}
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 z-10 ${overlayColor === 'red' ? 'bg-red-900/40' : overlayColor === 'green' ? 'bg-green-900/20' : ''}`} />
            {showFlash && <div className="absolute inset-0 z-50 flash-screen" />}
            {smokeActive && <div className="absolute inset-0 z-30 pointer-events-none bg-stone-500/30 animate-[pulse_2s_ease-out] mix-blend-hard-light backdrop-blur-[2px]" />}
            {drinkActive && <div className="absolute inset-0 z-30 pointer-events-none bg-yellow-600/10 backdrop-blur-[3px]" />}
            {showBlood && <div className="absolute inset-0 pointer-events-none z-40 animate-[blood-pulse_2s_infinite]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(160,0,0,0.5)_80%,rgba(80,0,0,0.9)_100%)] mix-blend-multiply" /></div>}

            {/* Scaled UI Wrapper */}
            <div className="absolute z-20 pointer-events-none" style={uiStyle}>

                {/* Notifications */}
                {knownShell && (
                    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                        <div className="text-4xl md:text-7xl font-black tracking-widest bg-black/80 px-4 py-2 md:px-8 md:py-4 border-y-4 border-stone-100 animate-[text-pop_0.3s_ease-out]">
                            CHAMBER IS <RenderColoredText text={knownShell} />
                        </div>
                    </div>
                )}
                {(player.isHandcuffed || dealer.isHandcuffed) && (
                    <div className={`absolute ${player.isHandcuffed ? 'top-[60%] left-[10%] md:left-[20%]' : 'top-[20%] md:top-[30%] right-[10%] md:right-[20%]'} z-20 animate-pulse pointer-events-none`}>
                        <div className="text-xl md:text-2xl font-black text-stone-100 bg-red-600 px-2 py-1 md:px-4 md:py-1 rotate-12 shadow-lg border-2 border-white">CUFFED</div>
                    </div>
                )}
                {overlayText && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="text-4xl md:text-8xl font-black tracking-tighter text-stone-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] pop-in text-center px-4">
                            <RenderColoredText text={overlayText} />
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
                    />
                )}

                {/* Game Over */}
                {gameState.phase === 'GAME_OVER' && (
                    <GameOverScreen winner={gameState.winner} onResetGame={onResetGame} />
                )}

                {/* Main HUD */}
                {gameState.phase !== 'INTRO' && gameState.phase !== 'BOOT' && gameState.phase !== 'GAME_OVER' && !showLootOverlay && (
                    <div className="absolute inset-0 z-20 p-1 md:p-8 flex flex-col justify-between pointer-events-none">
                        <div className="flex justify-between items-start">
                            <StatusDisplay player={player} dealer={dealer} playerName={playerName} gameState={gameState} />
                            {/* In-Game Settings Button */}
                            <button onClick={onOpenSettings} className="pointer-events-auto p-2 text-stone-600 hover:text-white transition-colors">
                                <SettingsIcon size={20} />
                            </button>
                        </div>

                        {gameState.phase === 'PLAYER_TURN' && !overlayText && (
                            <Controls isGunHeld={isGunHeld} isProcessing={isProcessing} onPickupGun={onPickupGun} onFireShot={onFireShot} onHoverTarget={onHoverTarget} />
                        )}

                        <div className="flex justify-between items-end mt-auto gap-1 md:gap-4 w-full h-16 md:h-40 pointer-events-none">
                            {isMultiplayer ? (
                                <div className="pointer-events-auto w-full md:w-1/3 bg-black/60 border border-stone-800 flex flex-col h-full text-xs font-mono">
                                    <div className="bg-stone-900 px-2 py-1 text-stone-500 font-bold flex justify-between">
                                        <span>SECURE COMMS</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        {messages.map((m, idx) => (
                                            <div key={idx} className="break-words">
                                                <span className="text-stone-600">[{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] </span>
                                                <span className="text-blue-400 font-bold">{m.sender}: </span>
                                                <span className="text-stone-300">{m.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleChatSubmit} className="border-t border-stone-800 flex">
                                        <input
                                            value={chatMsg}
                                            onChange={e => setChatMsg(e.target.value)}
                                            placeholder="TRANSMIT..."
                                            className="flex-1 bg-transparent p-1 px-2 text-stone-200 outline-none placeholder-stone-700"
                                        />
                                    </form>
                                </div>
                            ) : (
                                <LogsDisplay logs={logs} />
                            )}
                            <Inventory player={player} dealer={dealer} gameState={gameState} cameraView={cameraView} isProcessing={isProcessing} onUseItem={onUseItem} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};