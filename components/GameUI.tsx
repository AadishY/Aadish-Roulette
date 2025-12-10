import React, { useEffect, useRef, useState } from 'react';
import { GameState, PlayerState, LogEntry, TurnOwner, ItemType, AimTarget, ShellType, CameraView } from '../types';
import { Users, RotateCcw, Power, ChevronDown, ChevronUp, Skull } from 'lucide-react';
import { StatusDisplay } from './ui/StatusDisplay';
import { Inventory } from './ui/Inventory';
import { Controls } from './ui/Controls';
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
  isProcessing: boolean;
  onStartGame: (name: string) => void;
  onResetGame: (toMenu: boolean) => void;
  onFireShot: (target: TurnOwner) => void;
  onUseItem: (index: number) => void;
  onHoverTarget: (target: AimTarget) => void;
  onPickupGun: () => void;
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
  onStartGame,
  onResetGame,
  onFireShot,
  onUseItem,
  onHoverTarget,
  onPickupGun
}) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [inputName, setInputName] = useState(playerName || '');
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => { if (playerName) setInputName(playerName); }, [playerName]);
  useEffect(() => { if (gameState.phase === 'INTRO' && nameInputRef.current) nameInputRef.current.focus(); }, [gameState.phase]);

  const handleStartGame = () => {
      if (inputName.trim()) {
          try {
              if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
              }
          } catch (e) {}
          onStartGame(inputName.trim());
      }
  };

  useEffect(() => {
    if (gameState.phase === 'BOOT') {
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
    }
  }, [gameState.phase]);

  useEffect(() => {
    if (isLogsOpen && logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isLogsOpen]);

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

  return (
    <>
      {gameState.phase === 'BOOT' && (
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
      )}

      {/* FX Layers */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 z-10 ${overlayColor === 'red' ? 'bg-red-900/40' : overlayColor === 'green' ? 'bg-green-900/20' : ''}`} />
      {showFlash && <div className="absolute inset-0 z-50 flash-screen" />}
      {smokeActive && <div className="absolute inset-0 z-30 pointer-events-none bg-stone-500/30 animate-[pulse_2s_ease-out] mix-blend-hard-light backdrop-blur-[2px]" />}
      {drinkActive && <div className="absolute inset-0 z-30 pointer-events-none bg-yellow-600/10 backdrop-blur-[3px]" />}
      {showBlood && <div className="absolute inset-0 pointer-events-none z-40 animate-[blood-pulse_2s_infinite]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(160,0,0,0.5)_80%,rgba(80,0,0,0.9)_100%)] mix-blend-multiply" /></div>}

      {/* Notifications */}
      {knownShell && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
               <div className="text-4xl md:text-7xl font-black tracking-widest bg-black/80 px-4 py-2 md:px-8 md:py-4 border-y-4 border-stone-100 animate-[text-pop_0.3s_ease-out]">
                   CHAMBER IS <RenderColoredText text={knownShell} />
               </div>
          </div>
      )}
      {(player.isHandcuffed || dealer.isHandcuffed) && (
           <div className={`absolute ${player.isHandcuffed ? 'top-[60%] left-[20%]' : 'top-[30%] right-[20%]'} z-20 animate-pulse pointer-events-none`}>
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
      {showLootOverlay && (
         <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
             <h2 className="text-3xl md:text-4xl font-black mb-8 md:mb-12 tracking-widest text-stone-200 text-glitch">SHIPMENT RECEIVED</h2>
             <div className="flex gap-4 md:gap-6 flex-wrap justify-center max-w-4xl">
                 {receivedItems.map((item, i) => (
                    <div key={i} className="flex flex-col items-center pop-in" style={{animationDelay: `${i * 0.15}s`}}>
                        <div className="w-16 h-20 md:w-24 md:h-32 bg-stone-950 border border-stone-600 flex items-center justify-center mb-2 md:mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            {item === 'BEER' && <Icons.Beer className="text-amber-500" size={28} />}
                            {item === 'CIGS' && <Icons.Cigs className="text-red-500" size={28} />}
                            {item === 'GLASS' && <Icons.Glass className="text-cyan-500" size={28} />}
                            {item === 'CUFFS' && <Icons.Cuffs className="text-stone-400" size={28} />}
                            {item === 'SAW' && <Icons.Saw className="text-orange-600" size={28} />}
                        </div>
                        <span className="font-bold text-stone-400 text-[10px] md:text-sm tracking-widest">{item}</span>
                    </div>
                 ))}
             </div>
         </div>
      )}

      {/* Intro Screen */}
      {gameState.phase === 'INTRO' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 overflow-y-auto">
          <div className="text-center max-w-lg w-full p-4 md:p-6 flex flex-col justify-center min-h-[350px]">
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-black mb-6 md:mb-12 text-stone-100 tracking-tighter text-glitch leading-none">AADISH<br/><span className="text-red-600">ROULETTE</span></h1>
            <div className="flex flex-col gap-4 md:gap-6">
                <input ref={nameInputRef} type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="ENTER NAME..." maxLength={12} className="bg-stone-900 border-2 border-stone-700 p-3 md:p-4 text-xl md:text-2xl font-black text-white outline-none focus:border-red-600 tracking-widest uppercase text-center" />
                <button onClick={handleStartGame} disabled={!inputName.trim()} className="w-full px-6 py-4 bg-stone-100 text-black font-black text-lg md:text-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 tracking-widest">START GAME</button>
            </div>
            <div className="mt-8 md:mt-12 text-stone-800 text-[10px] md:text-xs font-mono">VER 1.0.0 // FULLSCREEN RECOMMENDED</div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState.phase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
           <div className="relative mb-8 md:mb-12 text-center">
               <div className={`text-6xl md:text-9xl font-black tracking-tighter animate-pulse ${gameState.winner === 'PLAYER' ? 'text-green-500' : 'text-red-600'}`}>
                  {gameState.winner === 'PLAYER' ? 'SURVIVED' : 'KIA'}
               </div>
               <div className="text-lg md:text-2xl tracking-[0.5em] md:tracking-[1em] text-stone-500 font-bold mt-2">
                  {gameState.winner === 'PLAYER' ? 'PAYOUT PENDING' : 'STATUS: DECEASED'}
               </div>
           </div>
           {gameState.winner === 'DEALER' && <Skull size={60} className="md:w-20 md:h-20 text-red-800 mb-8 md:mb-12 animate-pulse" />}
           <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-xl px-8">
             <button onClick={() => onResetGame(false)} className="flex-1 py-4 md:py-6 bg-stone-100 text-black font-black text-lg md:text-xl hover:bg-red-600 hover:text-white transition-all tracking-widest flex items-center justify-center gap-3 group">
               <RotateCcw size={20} className="group-hover:-rotate-180 transition-transform" /> RESTART
             </button>
             <button onClick={() => onResetGame(true)} className="flex-1 py-4 md:py-6 bg-stone-900 border-2 border-stone-800 text-stone-400 font-black text-lg md:text-xl hover:bg-stone-800 hover:text-white transition-all tracking-widest flex items-center justify-center gap-3">
               <Power size={20} /> MAIN MENU
             </button>
           </div>
        </div>
      )}

      {/* Main HUD */}
      {gameState.phase !== 'INTRO' && gameState.phase !== 'BOOT' && gameState.phase !== 'GAME_OVER' && !showLootOverlay && (
        <div className="absolute inset-0 z-20 p-2 md:p-8 flex flex-col justify-between pointer-events-none">
          <StatusDisplay player={player} dealer={dealer} playerName={playerName} gameState={gameState} />
          
          {gameState.phase === 'PLAYER_TURN' && !overlayText && (
             <Controls isGunHeld={isGunHeld} isProcessing={isProcessing} onPickupGun={onPickupGun} onFireShot={onFireShot} onHoverTarget={onHoverTarget} />
          )}

          <div className="flex justify-between items-end mt-auto gap-1 md:gap-4 w-full h-16 md:h-40 pointer-events-none">
             {/* Logs */}
             <div className={`w-1/3 md:w-1/3 transition-all duration-300 flex flex-col pointer-events-auto shadow-lg backdrop-blur-md border border-stone-800 bg-black/80 ${isLogsOpen ? 'h-full' : 'h-5 md:h-10'}`}>
                <div onClick={() => setIsLogsOpen(!isLogsOpen)} className="flex items-center justify-between p-1 md:p-2 cursor-pointer bg-stone-900 border-b border-stone-800 hover:bg-stone-800 transition-colors">
                    <span className="text-[8px] md:text-xs font-bold tracking-widest text-stone-400">LOG</span>
                    {isLogsOpen ? <ChevronDown size={8} /> : <ChevronUp size={8} />}
                </div>
                {isLogsOpen && (
                    <div className="flex-1 overflow-y-auto font-mono text-[8px] md:text-sm p-1 md:p-4 flex flex-col justify-end">
                        <div>
                            {logs.map(log => (
                                <div key={log.id} className={`mb-0.5 md:mb-1 ${log.type === 'danger' ? 'text-red-500' : log.type === 'safe' ? 'text-green-500' : log.type === 'info' ? 'text-cyan-400' : 'text-stone-500'}`}>{`> ${log.text}`}</div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                )}
             </div>
             
             {/* Inventory */}
             <Inventory player={player} dealer={dealer} gameState={gameState} cameraView={cameraView} isProcessing={isProcessing} onUseItem={onUseItem} />
          </div>
        </div>
      )}
    </>
  );
};
