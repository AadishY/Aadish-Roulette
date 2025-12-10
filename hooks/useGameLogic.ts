import { useState, useEffect } from 'react';
import { GameState, PlayerState, ShellType, ItemType, LogEntry, TurnOwner, CameraView, AimTarget, AnimationState } from '../types';
import { MAX_HP, MAX_ITEMS, ITEMS } from '../constants';
import { randomInt, wait } from '../utils/gameUtils';
import * as ItemActions from '../utils/itemActions';

export const useGameLogic = () => {
  // --- State ---
  const [playerName, setPlayerName] = useState('PLAYER');
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'BOOT', // Start with Boot sequence
    turnOwner: 'PLAYER',
    winner: null,
    chamber: [],
    currentShellIndex: 0,
    liveCount: 0,
    blankCount: 0
  });

  const [player, setPlayer] = useState<PlayerState>({
    hp: MAX_HP,
    maxHp: MAX_HP,
    items: [],
    isHandcuffed: false,
    isSawedActive: false,
  });

  const [dealer, setDealer] = useState<PlayerState>({
    hp: MAX_HP,
    maxHp: MAX_HP,
    items: [],
    isHandcuffed: false,
    isSawedActive: false,
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [knownShell, setKnownShell] = useState<ShellType | null>(null); 
  
  // Animation State Group
  const [animState, setAnimState] = useState<AnimationState>({
    triggerRecoil: 0,
    triggerRack: 0,
    triggerSparks: 0,
    triggerHeal: 0,
    triggerDrink: 0,
    triggerCuff: 0,
    isSawing: false,
    ejectedShellColor: 'red',
    muzzleFlashIntensity: 0,
    isLiveShot: false,
    dealerHit: false,
    dealerDropping: false
  });
  
  // Load name on mount and handle boot
  useEffect(() => {
      const saved = localStorage.getItem('aadish_roulette_name');
      if (saved) setPlayerName(saved);

      // Simulate System Boot
      if (gameState.phase === 'BOOT') {
        setTimeout(() => {
            setGameState(prev => ({ ...prev, phase: 'INTRO' }));
        }, 5500); // Extended slightly for new boot visuals
      }
  }, []);

  // Helpers for Animation State (to keep code clean)
  const setAnim = (update: Partial<AnimationState> | ((prev: AnimationState) => Partial<AnimationState>)) => {
      setAnimState(prev => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }));
  };

  // UI Visuals
  const [aimTarget, setAimTarget] = useState<AimTarget>('IDLE');
  const [cameraView, setCameraView] = useState<CameraView>('PLAYER');
  const [overlayColor, setOverlayColor] = useState<'none' | 'red' | 'green' | 'scan'>('none');
  const [overlayText, setOverlayText] = useState<string | null>(null);
  const [showBlood, setShowBlood] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  
  const [receivedItems, setReceivedItems] = useState<ItemType[]>([]);
  const [showLootOverlay, setShowLootOverlay] = useState(false);

  // --- Helpers ---
  const addLog = (text: string, type: LogEntry['type'] = 'neutral') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
  };

  const getRandomItem = (): ItemType => {
      const r = Math.random();
      // Weighted Probabilities:
      // Beer: 25%, Cigs: 25%, Glass: 20%, Cuffs: 15%, Saw: 15%
      if (r < 0.25) return 'BEER';
      if (r < 0.50) return 'CIGS';
      if (r < 0.70) return 'GLASS';
      if (r < 0.85) return 'CUFFS';
      return 'SAW';
  };

  // --- Logic ---
  const resetGame = (toMenu: boolean = false) => {
    // Reset all states
    setGameState({
        phase: toMenu ? 'INTRO' : 'LOAD',
        turnOwner: 'PLAYER',
        winner: null,
        chamber: [],
        currentShellIndex: 0,
        liveCount: 0,
        blankCount: 0
    });
    setPlayer({ hp: MAX_HP, maxHp: MAX_HP, items: [], isHandcuffed: false, isSawedActive: false });
    setDealer({ hp: MAX_HP, maxHp: MAX_HP, items: [], isHandcuffed: false, isSawedActive: false });
    setLogs([]);
    setKnownShell(null);
    setAnim({
        triggerRecoil: 0, triggerRack: 0, triggerSparks: 0, triggerHeal: 0, triggerDrink: 0, triggerCuff: 0,
        isSawing: false, ejectedShellColor: 'red', muzzleFlashIntensity: 0, isLiveShot: false, dealerHit: false, dealerDropping: false
    });
    setCameraView('PLAYER');
    setShowBlood(false);
    
    if (!toMenu) {
        startRound();
    }
  };

  const startGame = (name: string) => {
    localStorage.setItem('aadish_roulette_name', name);
    setPlayerName(name);
    setGameState(prev => ({ ...prev, phase: 'LOAD' }));
    startRound();
  };

  const startRound = async () => {
    const total = randomInt(2, 8);
    const lives = Math.max(1, Math.floor(total / 2));
    const blanks = total - lives;
    let chamber = [...Array(lives).fill('LIVE'), ...Array(blanks).fill('BLANK')] as ShellType[];
    
    // Shuffle
    for (let i = chamber.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chamber[i], chamber[j]] = [chamber[j], chamber[i]];
    }

    setGameState(prev => ({
      ...prev,
      chamber,
      currentShellIndex: 0,
      liveCount: lives,
      blankCount: blanks,
      phase: 'LOAD'
    }));

    setKnownShell(null);
    setPlayer(p => ({ ...p, isHandcuffed: false, isSawedActive: false }));
    setDealer(d => ({ ...d, isHandcuffed: false, isSawedActive: false }));
    setAnim({ dealerDropping: false }); // Reset dealer
    setCameraView('TABLE');

    addLog('--- NEW BATCH ---');
    addLog(`${lives} LIVE, ${blanks} BLANK`);
    
    setOverlayText(`${lives} LIVE  |  ${blanks} BLANK`);
    await wait(3000);
    setOverlayText(null);

    await distributeItems();
    
    setGameState(prev => ({ ...prev, phase: 'PLAYER_TURN', turnOwner: 'PLAYER' }));
    setCameraView('PLAYER');
    addLog('YOUR MOVE.');
  };

  const distributeItems = async () => {
    // Generate exactly 2-4 items per shipment based on round progress (optional complexity, kept simple for now)
    // Fixed: 3 items per drop
    const generateLoot = (count: number) => Array(count).fill(null).map(() => getRandomItem());
    
    const pNew = generateLoot(randomInt(2, 4));
    const dNew = generateLoot(randomInt(2, 4));

    setGameState(prev => ({ ...prev, phase: 'LOOTING' }));
    setReceivedItems(pNew);
    setShowLootOverlay(true);
    await wait(2500);
    
    // Strictly enforce MAX_ITEMS limit (8)
    setPlayer(p => ({ ...p, items: [...p.items, ...pNew].slice(0, MAX_ITEMS) }));
    setDealer(d => ({ ...d, items: [...d.items, ...dNew].slice(0, MAX_ITEMS) }));
    setShowLootOverlay(false);
    setReceivedItems([]);
  };

  const fireShot = async (shooter: TurnOwner, target: TurnOwner) => {
    const { chamber, currentShellIndex } = gameState;
    
    if (currentShellIndex >= chamber.length) {
      startRound();
      return;
    }

    setGameState(prev => ({ ...prev, phase: 'RESOLVING' }));
    setCameraView('GUN');
    
    // Determine Aim Direction relative to shooter
    const isSelf = shooter === target;
    setAimTarget(isSelf ? 'SELF' : 'OPPONENT');

    await wait(1200); 

    const shell = chamber[currentShellIndex];
    const isLive = shell === 'LIVE';

    setAnim(prev => ({
        ...prev,
        isLiveShot: isLive,
        triggerRecoil: prev.triggerRecoil + 1,
        muzzleFlashIntensity: isLive ? 100 : 0
    }));
    
    if (isLive) {
        setShowFlash(true);
        setTimeout(() => {
          setShowFlash(false);
          setAnim({ muzzleFlashIntensity: 0 });
        }, 100);
    }
    
    setOverlayText(shell); 
    
    let damage = isLive ? 1 : 0;
    const isSawed = shooter === 'PLAYER' ? player.isSawedActive : dealer.isSawedActive;
    if (isLive && isSawed) {
        damage = 2;
        addLog('CRITICAL HIT! (SAWED-OFF)', 'danger');
    }

    addLog(isLive ? `BANG! ${damage} DMG` : 'CLICK.', isLive ? 'danger' : 'safe');

    // Rack Sequence
    await wait(500); 
    setAnim(prev => ({ 
        ...prev, 
        ejectedShellColor: isLive ? 'red' : 'blue',
        triggerRack: prev.triggerRack + 1 
    }));

    await wait(1200);
    setOverlayText(null); 
    setAimTarget('IDLE'); 

    // Handle Damage
    if (damage > 0) {
      if (target === 'PLAYER') {
        setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - damage) }));
        setOverlayColor('red');
        setShowBlood(true);
        setTimeout(() => setShowBlood(false), 3500);
      } else {
        // DEALER DAMAGE LOGIC
        const newHp = Math.max(0, dealer.hp - damage);
        setDealer(p => ({ ...p, hp: newHp }));
        setAnim({ dealerHit: true, dealerDropping: true }); // Drop on EVERY hit
        setOverlayColor('green');
        
        setTimeout(() => setAnim({ dealerHit: false }), 500);

        // Stay down for a bit
        await wait(2000); 
        
        // If not dead, come back up
        if (newHp > 0) {
            setAnim({ dealerDropping: false });
            await wait(1000); // Time to rise
        }
      }
      setTimeout(() => setOverlayColor('none'), 500);
    }

    // Reset Saw
    if (shooter === 'PLAYER') setPlayer(p => ({ ...p, isSawedActive: false }));
    else setDealer(d => ({ ...d, isSawedActive: false }));
    
    setKnownShell(null); 
    await wait(1000);

    // Win Check
    if (player.hp - (target === 'PLAYER' ? damage : 0) <= 0) {
      setGameState(prev => ({ ...prev, phase: 'GAME_OVER', winner: 'DEALER' }));
      return;
    }
    if (dealer.hp - (target === 'DEALER' ? damage : 0) <= 0) {
      setGameState(prev => ({ ...prev, phase: 'GAME_OVER', winner: 'PLAYER' }));
      return;
    }

    // Update Shell Counts
    const nextIndex = currentShellIndex + 1;
    const remaining = chamber.length - nextIndex;
    
    setGameState(prev => ({ 
      ...prev, 
      currentShellIndex: nextIndex,
      liveCount: isLive ? prev.liveCount - 1 : prev.liveCount,
      blankCount: !isLive ? prev.blankCount - 1 : prev.blankCount
    }));

    if (remaining === 0) {
      startRound();
      return;
    }

    // Determine Turn
    let nextOwner = shooter;
    let turnChanged = false;

    if (!isLive && shooter === target) {
      addLog(`${shooter} GOES AGAIN`);
    } else {
      nextOwner = shooter === 'PLAYER' ? 'DEALER' : 'PLAYER';
      turnChanged = true;
    }

    // Handle Handcuffs
    const nextPersonState = nextOwner === 'PLAYER' ? player : dealer;
    if (turnChanged && nextPersonState.isHandcuffed) {
         addLog(`${nextOwner} IS CUFFED. SKIPPED.`);
         await wait(2000); // Longer pause for effect
         if (nextOwner === 'PLAYER') setPlayer(p => ({ ...p, isHandcuffed: false }));
         else setDealer(d => ({ ...d, isHandcuffed: false }));
         nextOwner = shooter;
    }

    const ownerPhase = nextOwner === 'PLAYER' ? 'PLAYER_TURN' : 'DEALER_TURN';
    setGameState(prev => ({ ...prev, turnOwner: nextOwner, phase: ownerPhase }));
    setCameraView(nextOwner === 'PLAYER' ? 'PLAYER' : 'PLAYER'); // Keep view on Player/Table mostly
  };

  // --- Item Logic ---
  const processItemEffect = async (user: TurnOwner, item: ItemType): Promise<boolean> => {
    // CUFF CHECK: Can't cuff if already cuffed
    if (item === 'CUFFS') {
        const opponent = user === 'PLAYER' ? dealer : player;
        if (opponent.isHandcuffed) {
             addLog(`${user === 'PLAYER' ? 'DEALER' : 'YOU'} ALREADY CUFFED!`, 'info');
             // Refund item if player (AI logic handles this differently but this safeguards UI clicks)
             if (user === 'PLAYER') {
                 setPlayer(p => ({ ...p, items: [...p.items, 'CUFFS'] }));
             }
             return false;
        }
    }

    setOverlayText(`${user} USES ${item}`);
    addLog(`${user} USED ${item}`, 'info');
    await wait(1200);
    setOverlayText(null);

    let roundEnded = false;

    switch (item) {
        case 'BEER':
            roundEnded = await ItemActions.handleBeer(
                gameState, setGameState, 
                (v) => setAnim(p => ({...p, triggerRack: typeof v === 'function' ? v(p.triggerRack) : v})),
                (v) => setAnim(p => ({...p, ejectedShellColor: typeof v === 'function' ? v(p.ejectedShellColor) : v})),
                (v) => setAnim(p => ({...p, triggerDrink: typeof v === 'function' ? v(p.triggerDrink) : v})),
                addLog, startRound
            );
            break;

        case 'CIGS':
            await ItemActions.handleCigs(user, setPlayer, setDealer, 
                (v) => setAnim(p => ({...p, triggerHeal: typeof v === 'function' ? v(p.triggerHeal) : v}))
            );
            break;

        case 'SAW':
            await ItemActions.handleSaw(user, setPlayer, setDealer, 
                (v) => setAnim(p => ({...p, triggerSparks: typeof v === 'function' ? v(p.triggerSparks) : v})),
                (v) => setAnim(p => ({...p, isSawing: typeof v === 'function' ? v(p.isSawing) : v}))
            );
            break;

        case 'CUFFS':
            ItemActions.handleCuffs(user, setPlayer, setDealer, (v) => setAnim(p => ({...p, triggerCuff: typeof v === 'function' ? v(p.triggerCuff) : v})));
            break;

        case 'GLASS':
            await ItemActions.handleGlass(user, gameState, setKnownShell, addLog);
            break;
    }

    return roundEnded;
  };

  const usePlayerItem = async (index: number) => {
    if (gameState.phase !== 'PLAYER_TURN') return;
    
    const item = player.items[index];
    if (!item) return;

    // Special check for Handcuffs legality
    if (item === 'CUFFS' && dealer.isHandcuffed) return; 

    // Remove item locally first to prevent double click abuse
    const newItems = [...player.items];
    newItems.splice(index, 1);
    setPlayer(p => ({ ...p, items: newItems }));

    // Execute Effect
    await processItemEffect('PLAYER', item);
  };

  return {
    gameState,
    player,
    dealer,
    logs,
    animState,
    knownShell,
    playerName,
    aimTarget,
    cameraView,
    overlayColor,
    overlayText,
    showBlood,
    showFlash,
    receivedItems,
    showLootOverlay,
    startGame,
    fireShot,
    usePlayerItem,
    setAimTarget,
    setCameraView,
    setDealer,
    processItemEffect,
    resetGame
  };
};
