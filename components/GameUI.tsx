import React, { useEffect, useRef, useState } from 'react';
import { GameState, PlayerState, LogEntry, TurnOwner, ItemType, AimTarget, ShellType } from '../types';
import { Zap, Crosshair, RefreshCcw, ShieldAlert, Heart, Hammer, ArrowDown, Skull, Users, Home, ChevronDown, ChevronUp, RotateCcw, Power } from 'lucide-react';
import { ITEM_DESCRIPTIONS } from '../constants';

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
  onStartGame: (name: string) => void;
  onResetGame: (toMenu: boolean) => void;
  onFireShot: (target: TurnOwner) => void;
  onUseItem: (index: number) => void;
  onHoverTarget: (target: AimTarget) => void;
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
  onStartGame,
  onResetGame,
  onFireShot,
  onUseItem,
  onHoverTarget
}) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [inputName, setInputName] = useState(playerName || '');
  const [isLogsOpen, setIsLogsOpen] = useState(true); 
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Boot Sequence Effect
  useEffect(() => {
    if (gameState.phase === 'BOOT') {
        setBootLines([]);
        setLoadingProgress(0);
        
        const sequence = [
            { text: "BIOS CHECK...", delay: 100 },
            { text: "CPU: QUANTUM CORE... OK", delay: 300 },
            { text: "MEMORY: 64TB... OK", delay: 500 },
            { text: "LOADING KERNEL...", delay: 800 },
            { text: "MOUNTING VOLUMES...", delay: 1200 },
            { text: "  > /DEV/SDA1... OK", delay: 1400 },
            { text: "  > /DEV/SDA2... OK", delay: 1500 },
            { text: "LOADING ASSETS:", delay: 1800 },
            { text: "  > MODELS... OK", delay: 2200 },
            { text: "  > TEXTURES... OK", delay: 2600 },
            { text: "  > SOUNDS... OK", delay: 3000 },
            { text: "INITIALIZING AI DEALER...", delay: 3500 },
            { text: "ESTABLISHING SECURE CONNECTION...", delay: 4200 },
            { text: "SYSTEM READY.", delay: 5000 }
        ];

        let timeouts: ReturnType<typeof setTimeout>[] = [];
        
        sequence.forEach(({ text, delay }) => {
            const t = setTimeout(() => {
                setBootLines(prev => [...prev, text]);
            }, delay);
            timeouts.push(t);
        });

        const interval = setInterval(() => {
            setLoadingProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return p + Math.random() * 5;
            });
        }, 150);

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
        };
    }
  }, [gameState.phase]);

  useEffect(() => {
    if (isLogsOpen && logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isLogsOpen]);

  const [smokeActive, setSmokeActive] = React.useState(false);
  useEffect(() => {
      if (triggerHeal > 0) {
          setSmokeActive(true);
          const t = setTimeout(() => setSmokeActive(false), 2000);
          return () => clearTimeout(t);
      }
  }, [triggerHeal]);

  const [drinkActive, setDrinkActive] = React.useState(false);
  useEffect(() => {
      if (triggerDrink > 0) {
          setDrinkActive(true);
          const t = setTimeout(() => setDrinkActive(false), 1500);
          return () => clearTimeout(t);
      }
  }, [triggerDrink]);

  return (
    <>
      {/* Boot / Loading Screen */}
      {gameState.phase === 'BOOT' && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col justify-between p-8 md:p-12 font-mono">
            <div className="flex justify-between items-start text-stone-600 text-xs">
                <span>AADISH_OS v0.9.5</span>
                <span>MEM: 65536KB OK</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full gap-4">
                 <div className="text-green-500 text-sm md:text-base space-y-1 h-64 overflow-hidden flex flex-col justify-end">
                    {bootLines.map((line, i) => (
                        <div key={i} className={`typewriter ${line.includes('DEALER') ? 'text-red-500 font-bold' : ''}`}>
                            {`> ${line}`}
                        </div>
                    ))}
                    <div className="text-green-500 animate-pulse">_</div>
                 </div>

                 <div className="w-full h-6 bg-stone-900 border border-stone-700 p-1 relative">
                    <div 
                        className="h-full bg-green-700 relative overflow-hidden transition-all duration-100 ease-linear"
                        style={{ width: `${Math.min(100, loadingProgress)}%` }}
                    >
                         <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[scanline_1s_infinite]" />
                    </div>
                 </div>
                 <div className="text-right text-green-500 text-xs">{Math.min(100, Math.floor(loadingProgress))}%</div>
            </div>

            <div className="text-center text-stone-800 text-xs animate-pulse">
                PLEASE WAIT WHILE WE CONNECT TO THE DARK WEB...
            </div>
        </div>
      )}

      {/* Screen Effects */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 z-10 ${overlayColor === 'red' ? 'bg-red-900/40' : overlayColor === 'green' ? 'bg-green-900/20' : ''}`} />
      
      {showFlash && <div className="absolute inset-0 z-50 flash-screen" />}
      
      {smokeActive && (
          <div className="absolute inset-0 z-30 pointer-events-none bg-stone-500/30 animate-[pulse_2s_ease-out] mix-blend-hard-light backdrop-blur-[2px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent,rgba(255,255,255,0.2))] animate-[ping_3s_infinite]" />
              <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-gray-500/50 to-transparent animate-pulse" />
          </div>
      )}

      {drinkActive && (
          <div className="absolute inset-0 z-30 pointer-events-none bg-yellow-600/10 backdrop-blur-[3px] animate-[pulse_1s_ease-in-out]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-900/10 to-transparent" />
          </div>
      )}

      {knownShell && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
               <div className="text-5xl md:text-7xl font-black tracking-widest bg-black/80 px-8 py-4 border-y-4 border-stone-100 animate-[text-pop_0.3s_ease-out]">
                   CHAMBER IS <RenderColoredText text={knownShell} />
               </div>
          </div>
      )}

      {showBlood && (
          <div className="absolute inset-0 pointer-events-none z-40 animate-[blood-pulse_2s_infinite]">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(160,0,0,0.5)_80%,rgba(80,0,0,0.9)_100%)] mix-blend-multiply" />
          </div>
      )}

      {player.isHandcuffed && (
           <div className="absolute top-[60%] left-[20%] z-20 animate-pulse pointer-events-none">
              <div className="text-2xl font-black text-stone-100 bg-red-600 px-4 py-1 rotate-12 shadow-lg border-2 border-white">
                  CUFFED
              </div>
           </div>
      )}
      {dealer.isHandcuffed && (
           <div className="absolute top-[30%] right-[20%] z-20 animate-pulse pointer-events-none">
              <div className="text-2xl font-black text-stone-100 bg-red-600 px-4 py-1 -rotate-12 shadow-lg border-2 border-white">
                  CUFFED
              </div>
           </div>
      )}

      {overlayText && (
         <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className={`text-6xl md:text-8xl font-black tracking-tighter text-stone-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] pop-in text-center px-4`}>
                <RenderColoredText text={overlayText} />
            </div>
         </div>
      )}

      {showLootOverlay && (
         <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
             <h2 className="text-4xl font-black mb-12 tracking-widest text-stone-200 text-glitch">SHIPMENT RECEIVED</h2>
             <div className="flex gap-6 flex-wrap justify-center max-w-4xl">
                 {receivedItems.map((item, i) => (
                    <div key={i} className="flex flex-col items-center pop-in" style={{animationDelay: `${i * 0.15}s`}}>
                        <div className="w-24 h-32 bg-stone-950 border border-stone-600 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            {item === 'BEER' && <RefreshCcw className="text-amber-500" size={40} />}
                            {item === 'CIGS' && <Heart className="text-red-500" size={40} />}
                            {item === 'GLASS' && <Crosshair className="text-cyan-500" size={40} />}
                            {item === 'CUFFS' && <ShieldAlert className="text-stone-400" size={40} />}
                            {item === 'SAW' && <Hammer className="text-orange-600" size={40} />}
                        </div>
                        <span className="font-bold text-stone-400 text-sm tracking-widest">{item}</span>
                    </div>
                 ))}
             </div>
         </div>
      )}

      {gameState.phase === 'INTRO' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95">
          <div className="text-center max-w-lg w-full p-6">
            <h1 className="text-6xl md:text-9xl font-black mb-12 text-stone-100 tracking-tighter text-glitch leading-none">AADISH<br/><span className="text-red-600">ROULETTE</span></h1>
            
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-left">
                    <label className="text-stone-500 font-bold tracking-widest text-sm">PLAYER NAME</label>
                    <input 
                        type="text" 
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        placeholder="ENTER NAME..."
                        maxLength={12}
                        className="bg-stone-900 border-2 border-stone-700 p-4 text-2xl font-black text-white outline-none focus:border-red-600 tracking-widest uppercase placeholder:text-stone-700 transition-colors"
                    />
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => inputName.trim() && onStartGame(inputName.trim())}
                        disabled={!inputName.trim()}
                        className="flex-1 px-8 py-5 bg-stone-100 text-black font-black text-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-widest"
                    >
                        START GAME
                    </button>
                    
                    <button 
                        className="flex-1 px-8 py-5 bg-stone-900 border-2 border-stone-800 text-stone-600 font-black text-xl cursor-not-allowed opacity-70 tracking-widest flex items-center justify-center gap-2"
                        title="COMING SOON"
                    >
                        <Users size={20} />
                        MULTIPLAYER
                    </button>
                </div>
            </div>
            
            <div className="mt-12 text-stone-800 text-xs font-mono">
                VER 0.9.5 // WAITING FOR CONNECTION...
            </div>
          </div>
        </div>
      )}

      {gameState.phase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
           <div className="relative mb-12 text-center">
               <div className={`text-9xl font-black tracking-tighter animate-pulse ${gameState.winner === 'PLAYER' ? 'text-green-500' : 'text-red-600'}`}>
                  {gameState.winner === 'PLAYER' ? 'SURVIVED' : 'KIA'}
               </div>
               <div className="text-2xl tracking-[1em] text-stone-500 font-bold mt-2">
                  {gameState.winner === 'PLAYER' ? 'PAYOUT PENDING' : 'STATUS: DECEASED'}
               </div>
           </div>

           {gameState.winner === 'DEALER' && <Skull size={80} className="text-red-800 mb-12 animate-pulse" />}
           
           <div className="flex flex-col md:flex-row gap-6 w-full max-w-xl px-8">
             <button 
                onClick={() => onResetGame(false)} 
                className="flex-1 py-6 bg-stone-100 text-black font-black text-xl hover:bg-red-600 hover:text-white transition-all tracking-widest flex items-center justify-center gap-3 group"
             >
               <RotateCcw size={24} className="group-hover:-rotate-180 transition-transform duration-500" />
               RESTART
             </button>
             <button 
                onClick={() => onResetGame(true)} 
                className="flex-1 py-6 bg-stone-900 border-2 border-stone-800 text-stone-400 font-black text-xl hover:bg-stone-800 hover:text-white transition-all tracking-widest flex items-center justify-center gap-3"
             >
               <Power size={24} />
               MAIN MENU
             </button>
           </div>
           
           <div className="mt-12 text-stone-800 font-mono text-sm">
                SESSION ID: {Math.floor(Math.random() * 999999).toString(16).toUpperCase()}
           </div>
        </div>
      )}

      {/* HUD Layer */}
      {gameState.phase !== 'INTRO' && gameState.phase !== 'BOOT' && gameState.phase !== 'GAME_OVER' && !showLootOverlay && (
        <div className="absolute inset-0 z-20 p-4 md:p-8 flex flex-col justify-between pointer-events-none">
          
          {/* Top: Status & Turn Info */}
          <div className="flex justify-between items-start w-full">
             {/* Player Stats */}
             <div className="flex flex-col items-start w-1/3">
                <span className="text-xs font-bold tracking-[0.3em] text-stone-500 mb-2 uppercase">{playerName || 'YOU'}</span>
                <div className="flex gap-2 mb-2">
                   {[...Array(player.maxHp)].map((_, i) => (
                      <div key={i} className={`w-3 h-8 md:w-4 md:h-12 flex items-center justify-center transition-all duration-300 ${i < player.hp ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-stone-900 border border-stone-800'}`}>
                        {i >= player.hp && <div className="w-full h-[1px] bg-stone-800 rotate-45" />}
                      </div>
                   ))}
                </div>
             </div>

             {/* Center Turn Indicator */}
             <div className="text-center mt-2 flex-1">
                 <div className={`text-2xl md:text-3xl font-black tracking-widest transition-colors duration-500 ${gameState.turnOwner === 'PLAYER' ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                     {gameState.turnOwner === 'PLAYER' ? 'YOUR TURN' : 'DEALER TURN'}
                 </div>
                 <div className="text-stone-600 text-xs mt-2 font-mono tracking-widest">
                    {gameState.liveCount + gameState.blankCount} ROUNDS IN CHAMBER
                 </div>
             </div>

             {/* Dealer Stats */}
             <div className="flex flex-col items-end w-1/3">
                <span className="text-xs font-bold tracking-[0.3em] text-stone-500 mb-2">DEALER</span>
                <div className="flex gap-2 mb-2">
                   {[...Array(dealer.maxHp)].map((_, i) => (
                      <div key={i} className={`w-3 h-8 md:w-4 md:h-12 flex items-center justify-center transition-all duration-300 ${i < dealer.hp ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-stone-900 border border-stone-800'}`}>
                         {i >= dealer.hp && <div className="w-full h-[1px] bg-stone-800 rotate-45" />}
                      </div>
                   ))}
                </div>
                <div className="flex gap-1 mt-4 flex-wrap justify-end max-w-[200px]">
                    {dealer.items.map((item, i) => (
                        <div key={i} className="w-8 h-8 bg-stone-900 border border-stone-700 flex items-center justify-center opacity-70">
                            {item === 'BEER' && <RefreshCcw size={14} className="text-amber-500" />}
                            {item === 'CIGS' && <Heart size={14} className="text-red-500" />}
                            {item === 'GLASS' && <Crosshair size={14} className="text-cyan-500" />}
                            {item === 'CUFFS' && <ShieldAlert size={14} className="text-stone-400" />}
                            {item === 'SAW' && <Hammer size={14} className="text-orange-600" />}
                        </div>
                    ))}
                </div>
             </div>
          </div>

          {/* Middle: Controls */}
          {gameState.phase === 'PLAYER_TURN' && !overlayText && (
            <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-8 pointer-events-auto items-center">
               <button 
                  onClick={() => onFireShot('DEALER')}
                  onMouseEnter={() => onHoverTarget('OPPONENT')}
                  onMouseLeave={() => onHoverTarget('IDLE')}
                  className="bg-black/80 border-2 border-red-900 px-6 py-4 md:px-8 md:py-5 text-red-500 font-black text-lg md:text-xl hover:bg-red-900 hover:text-white transition-all hover:scale-105 hover:border-red-500 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm tracking-widest clip-path-slant"
               >
                  SHOOT DEALER
               </button>
               <button 
                  onClick={() => onFireShot('PLAYER')}
                  onMouseEnter={() => onHoverTarget('SELF')}
                  onMouseLeave={() => onHoverTarget('IDLE')}
                  className="bg-black/80 border-2 border-stone-700 px-6 py-4 md:px-8 md:py-5 text-stone-400 font-black text-lg md:text-xl hover:bg-stone-800 hover:text-white transition-all hover:scale-105 hover:border-stone-400 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm tracking-widest"
               >
                  SHOOT SELF
               </button>
            </div>
          )}

          {/* Bottom: Logs & Inventory - Reduced Height for Mobile */}
          <div className="flex justify-between items-end mt-auto gap-4 w-full h-32 md:h-40 pointer-events-none">
             {/* Collapsible Log Window */}
             <div className={`w-1/2 md:w-1/3 transition-all duration-300 flex flex-col pointer-events-auto shadow-lg backdrop-blur-md border border-stone-800 bg-black/80 ${isLogsOpen ? 'h-full' : 'h-10'}`}>
                <div 
                    onClick={() => setIsLogsOpen(!isLogsOpen)}
                    className="flex items-center justify-between p-2 cursor-pointer bg-stone-900 border-b border-stone-800 hover:bg-stone-800 transition-colors"
                >
                    <span className="text-xs font-bold tracking-widest text-stone-400">LOG</span>
                    {isLogsOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
                {isLogsOpen && (
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] md:text-sm p-2 md:p-4 flex flex-col justify-end">
                        <div>
                            {logs.map(log => (
                            <div key={log.id} className={`mb-1 ${log.type === 'danger' ? 'text-red-500' : log.type === 'safe' ? 'text-green-500' : log.type === 'info' ? 'text-cyan-400' : 'text-stone-500'}`}>
                                {`> ${log.text}`}
                            </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                )}
             </div>

             <div className="flex-1 flex justify-end gap-2 pointer-events-auto h-full items-end">
                <div className="flex gap-1 md:gap-2 p-2 md:p-3 bg-black/80 border-t border-l border-r border-stone-800 backdrop-blur-sm min-h-[80px] md:min-h-[100px] items-end overflow-x-auto max-w-full">
                    {player.items.map((item, idx) => {
                        const isCuffDisabled = item === 'CUFFS' && dealer.isHandcuffed;
                        return (
                            <div key={idx} className="group relative shrink-0">
                                <button
                                    onClick={() => onUseItem(idx)}
                                    disabled={gameState.phase !== 'PLAYER_TURN' || isCuffDisabled}
                                    className={`w-14 h-16 md:w-20 md:h-24 bg-stone-900 border border-stone-700 flex flex-col items-center justify-center hover:bg-stone-800 hover:border-stone-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 group-hover:-translate-y-2 duration-200 ${isCuffDisabled ? 'opacity-30' : ''}`}
                                >
                                    {item === 'BEER' && <RefreshCcw className="text-amber-500 mb-1 md:mb-2" size={24} />}
                                    {item === 'CIGS' && <Heart className="text-red-500 mb-1 md:mb-2" size={24} />}
                                    {item === 'GLASS' && <Crosshair className="text-cyan-500 mb-1 md:mb-2" size={24} />}
                                    {item === 'CUFFS' && <ShieldAlert className="text-stone-400 mb-1 md:mb-2" size={24} />}
                                    {item === 'SAW' && <Hammer className="text-orange-600 mb-1 md:mb-2" size={24} />}
                                    <span className="text-[8px] md:text-[10px] text-stone-500 font-bold tracking-widest hidden md:block">{item}</span>
                                </button>
                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-stone-950 border border-stone-600 p-3 text-xs text-center hidden group-hover:block z-50 text-stone-200 shadow-xl">
                                    <div className="font-bold text-white mb-1 tracking-widest">{item}</div>
                                    {ITEM_DESCRIPTIONS[item]}
                                    {isCuffDisabled && <div className="text-red-500 mt-1">DEALER IS CUFFED</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};