import { useState, useEffect, useRef } from 'react';
import { GameState, PlayerState, ShellType, ItemType, LogEntry, TurnOwner, CameraView, AimTarget, AnimationState } from '../types';
import { MAX_HP, MAX_ITEMS, ITEMS } from '../constants';
import { randomInt, wait } from '../utils/gameUtils';
import * as ItemActions from '../utils/itemActions';
import { audioManager } from '../utils/audioManager';

export const useGameLogic = () => {
  // --- State ---
  const [playerName, setPlayerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'BOOT', // Start with Boot sequence
    turnOwner: 'PLAYER',
    winner: null,
    chamber: [],
    currentShellIndex: 0,
    liveCount: 0,
    blankCount: 0,
    roundCount: 0
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
    triggerGlass: 0,
    triggerPhone: 0,
    triggerInverter: 0,
    triggerAdrenaline: 0,
    isSawing: false,
    ejectedShellColor: 'red',
    muzzleFlashIntensity: 0,
    isLiveShot: false,
    dealerHit: false,
    dealerDropping: false,
    playerHit: false
  });

  // Load name on mount and handle boot
  useEffect(() => {
    const saved = localStorage.getItem('aadish_roulette_name');
    if (saved) setPlayerName(saved);

    // Simulate System Boot
    if (gameState.phase === 'BOOT') {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, phase: 'INTRO' }));
      }, 5500);
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

  // Balanced Probabilities - Common items frequent, powerful items rare
  const getRandomItem = (): ItemType => {
    // BEER: 18% (Common - eject shell)
    // CIGS: 16% (Common - heal 1 HP)
    // GLASS: 14% (Useful - see current shell)
    // CUFFS: 14% (Useful - skip opponent turn)
    // PHONE: 10% (Strategic - see random shell)
    // SAW: 10% (Powerful - double damage)
    // INVERTER: 8% (Rare - flip shell type)
    // ADRENALINE: 10% (Steal and use item)

    const r = Math.random() * 100;
    if (r < 18) return 'BEER';
    if (r < 34) return 'CIGS';
    if (r < 48) return 'GLASS';
    if (r < 62) return 'CUFFS';
    if (r < 72) return 'PHONE';
    if (r < 82) return 'SAW';
    if (r < 90) return 'INVERTER';
    return 'ADRENALINE';
  };

  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Logic ---
  const resetGame = (toMenu: boolean = false) => {
    // Clear any pending restart
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    // Reset all states FIRST
    setReceivedItems([]); // Clear loot overlay items
    setShowLootOverlay(false);
    setOverlayText(null);

    setGameState({
      phase: toMenu ? 'INTRO' : 'LOAD',
      turnOwner: 'PLAYER',
      winner: null,
      chamber: [],
      currentShellIndex: 0,
      liveCount: 0,
      blankCount: 0,
      roundCount: 0
    });
    setPlayer({ hp: MAX_HP, maxHp: MAX_HP, items: [], isHandcuffed: false, isSawedActive: false });
    setDealer({ hp: MAX_HP, maxHp: MAX_HP, items: [], isHandcuffed: false, isSawedActive: false });
    setLogs([]);
    setKnownShell(null);
    setAnim({
      triggerRecoil: 0, triggerRack: 0, triggerSparks: 0, triggerHeal: 0, triggerDrink: 0, triggerCuff: 0,
      isSawing: false, ejectedShellColor: 'red', muzzleFlashIntensity: 0, isLiveShot: false, dealerHit: false, dealerDropping: false, playerHit: false
    });
    setCameraView('PLAYER');
    setShowBlood(false);
    setIsProcessing(false);

    if (!toMenu) {
      // Delay startRound to ensure all state resets are flushed to React
      resetTimeoutRef.current = setTimeout(() => {
        startRound(true);
        resetTimeoutRef.current = null;
      }, 200);
    }
  };

  const startGame = (name: string) => {
    localStorage.setItem('aadish_roulette_name', name);
    setPlayerName(name);
    setGameState(prev => ({ ...prev, phase: 'LOAD' }));
    startRound(true);
  };

  const startRound = async (resetItems: boolean = false) => {
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
      roundCount: resetItems ? 1 : prev.roundCount + 1, // Reset round count if new game
      phase: 'LOAD'
    }));

    setKnownShell(null);
    setPlayer(p => ({ ...p, isHandcuffed: false, isSawedActive: false, items: resetItems ? [] : p.items }));
    setDealer(d => ({ ...d, isHandcuffed: false, isSawedActive: false, items: resetItems ? [] : d.items }));
    setAnim({ dealerDropping: false, playerHit: false });

    // Force TABLE view during loot distribution
    setCameraView('TABLE');

    addLog('--- NEW BATCH ---');
    addLog(`${lives} LIVE, ${blanks} BLANK`);

    setOverlayText(`${lives} LIVE  |  ${blanks} BLANK`);
    await wait(3000);
    setOverlayText(null);

    await distributeItems(resetItems);

    setGameState(prev => ({ ...prev, phase: 'PLAYER_TURN', turnOwner: 'PLAYER' }));
    setCameraView('PLAYER'); // Switch to Player view only after items are done
    addLog('YOUR MOVE.');
  };

  const distributeItems = async (forceClear: boolean = false) => {
    // If forceClear, ensure items are cleared FIRST before anything else
    if (forceClear) {
      setPlayer(p => ({ ...p, items: [] }));
      setDealer(d => ({ ...d, items: [] }));
      await wait(50); // Small delay to ensure state is flushed
    }

    // Generate items based on round count
    const roundNum = forceClear ? 1 : gameState.roundCount + 1;

    let amount = 2; // Default start with 2 items
    if (roundNum === 1) amount = 2;
    else if (roundNum === 2) amount = 3;
    else amount = 4;


    const generateLoot = () => {
      return Array(amount).fill(null).map(() => getRandomItem());
    };

    // Generate BOTH loot pools at the same time
    const pNew = generateLoot();
    const dNew = generateLoot();

    // Store items for reference (for debugging consistency)
    // console.log('[LOOT] Player items:', pNew, 'Dealer items:', dNew);

    // SAFETY: Clear any previous overlay state
    setShowLootOverlay(false);
    setReceivedItems([]);
    await wait(100); // Wait for UI to clear

    // Show NEW items in overlay
    setGameState(prev => ({ ...prev, phase: 'LOOTING' }));
    setReceivedItems([...pNew]); // Use spread to ensure new array reference
    setShowLootOverlay(true);
    await wait(3500); // Allow time to see items

    // Apply items to inventories - player gets pNew, dealer gets dNew
    setPlayer(p => {
      const baseItems = forceClear ? [] : p.items;
      return { ...p, items: [...baseItems, ...pNew].slice(0, MAX_ITEMS) };
    });
    setDealer(d => {
      const baseItems = forceClear ? [] : d.items;
      return { ...d, items: [...baseItems, ...dNew].slice(0, MAX_ITEMS) };
    });

    // Clean up overlay
    setShowLootOverlay(false);
    setReceivedItems([]);
  };

  const pickupGun = () => {
    if (isProcessing) return;
    setCameraView('GUN');
  };

  const fireShot = async (shooter: TurnOwner, target: TurnOwner) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const { chamber, currentShellIndex } = gameState;

    if (currentShellIndex >= chamber.length) {
      startRound();
      setIsProcessing(false);
      return;
    }

    setGameState(prev => ({ ...prev, phase: 'RESOLVING' }));
    setCameraView('GUN');

    const isSelf = shooter === target;
    setAimTarget(isSelf ? 'SELF' : 'OPPONENT');

    await wait(50);

    const shell = chamber[currentShellIndex];
    const isLive = shell === 'LIVE';

    if (isLive) audioManager.playSound('liveshell');
    else audioManager.playSound('blankshell');

    setAnim(prev => ({
      ...prev,
      isLiveShot: isLive,
      triggerRecoil: prev.triggerRecoil + 1,
      muzzleFlashIntensity: isLive ? 100 : 0
    }));

    if (isLive && target === 'DEALER') {
      // INSTANT HIT
      setAnim(prev => ({ ...prev, dealerHit: true, dealerDropping: true }));
      setTimeout(() => setAnim(prev => ({ ...prev, dealerHit: false })), 200); // Short blood duration, drop persists
    }

    if (isLive && target === 'PLAYER') {
      // INSTANT HIT
      setAnim(prev => ({ ...prev, playerHit: true }));
      setOverlayColor('red'); // Instant Red Screen
      setShowBlood(true);
      setTimeout(() => {
        setAnim(prev => ({ ...prev, playerHit: false }));
        setShowBlood(false);
        setOverlayColor('none');
      }, 2500);
    }




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

    // Handle Damage - Updated to remove delayed visual effects for player as they are now instant
    if (damage > 0) {
      if (target === 'PLAYER') {
        setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - damage) }));
        // Visuals moved to instant block
      } else {
        const newHp = Math.max(0, dealer.hp - damage);
        setDealer(p => ({ ...p, hp: newHp }));
        setOverlayColor('green');

        await wait(2000);

        if (newHp > 0) {
          setAnim(prev => ({ ...prev, dealerDropping: false }));
          await wait(1000);
        }
        setOverlayColor('none');
      }
    }

    // Reset Saw
    if (shooter === 'PLAYER') setPlayer(p => ({ ...p, isSawedActive: false }));
    else setDealer(d => ({ ...d, isSawedActive: false }));

    setKnownShell(null);
    await wait(1000);

    // Win Check
    if (player.hp - (target === 'PLAYER' ? damage : 0) <= 0) {
      setGameState(prev => ({ ...prev, phase: 'GAME_OVER', winner: 'DEALER' }));
      setIsProcessing(false);
      return;
    }
    if (dealer.hp - (target === 'DEALER' ? damage : 0) <= 0) {
      setGameState(prev => ({ ...prev, phase: 'GAME_OVER', winner: 'PLAYER' }));
      setIsProcessing(false);
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
      setIsProcessing(false);
      return;
    }

    // Determine Turn
    let nextOwner = shooter;
    let turnChanged = false;

    const shooterName = shooter === 'PLAYER' ? playerName.toUpperCase() : 'DEALER';
    if (!isLive && shooter === target) {
      addLog(`${shooterName} GOES AGAIN`);
    } else {
      nextOwner = shooter === 'PLAYER' ? 'DEALER' : 'PLAYER';
      turnChanged = true;
    }

    // Handle Handcuffs Logic
    let skipped = false;
    if (turnChanged) {
      const nextPersonState = nextOwner === 'PLAYER' ? player : dealer;
      const nextPersonName = nextOwner === 'PLAYER' ? playerName.toUpperCase() : 'DEALER';
      if (nextPersonState.isHandcuffed) {
        const message = `${nextPersonName} CUFFED. SKIPPING.`;
        addLog(message, 'info');
        setOverlayText(`${nextOwner} CUFFED`);

        // Shake Animation - Just text/overlay handles this now
        // setAnim(p => ({ ...p, triggerCuff: p.triggerCuff + 1 }));

        await wait(2800); // Slower
        setOverlayText(null);

        if (nextOwner === 'PLAYER') setPlayer(p => ({ ...p, isHandcuffed: false }));
        else setDealer(d => ({ ...d, isHandcuffed: false }));

        nextOwner = shooter;
        skipped = true;
      }
    }

    const ownerPhase = nextOwner === 'PLAYER' ? 'PLAYER_TURN' : 'DEALER_TURN';
    setGameState(prev => ({ ...prev, turnOwner: nextOwner, phase: ownerPhase, lastTurnWasSkipped: skipped }));
    setCameraView(nextOwner === 'PLAYER' ? 'PLAYER' : 'PLAYER');
    setIsProcessing(false);
  };

  const processItemEffect = async (user: TurnOwner, item: ItemType): Promise<boolean> => {
    if (item === 'CUFFS') {
      const opponent = user === 'PLAYER' ? dealer : player;
      // Check if opponent is already cuffed OR if we just skipped their turn via cuffs
      if (opponent.isHandcuffed || gameState.lastTurnWasSkipped) {
        addLog(`${user === 'PLAYER' ? 'DEALER' : 'YOU'} CAN'T BE CUFFED AGAIN!`, 'info');
        if (user === 'PLAYER') {
          setPlayer(p => ({ ...p, items: [...p.items, 'CUFFS'] }));
        }
        return false;
      }
    }

    const userName = user === 'PLAYER' ? playerName.toUpperCase() : 'DEALER';
    setOverlayText(`${userName} USED ${item}`);

    addLog(`${userName} USED ${item}`, 'info');
    await wait(1500); // Brief display before animation starts
    setOverlayText(null);

    let roundEnded = false;

    switch (item) {
      case 'BEER':
        audioManager.playSound('blankshell');
        roundEnded = await ItemActions.handleBeer(
          gameState, setGameState,
          (v) => setAnim(p => ({ ...p, triggerRack: typeof v === 'function' ? v(p.triggerRack) : v })),
          (v) => setAnim(p => ({ ...p, ejectedShellColor: typeof v === 'function' ? v(p.ejectedShellColor) : v })),
          (v) => setAnim(p => ({ ...p, triggerDrink: typeof v === 'function' ? v(p.triggerDrink) : v })),
          setOverlayText,
          addLog, startRound
        );
        break;

      case 'CIGS':
        await ItemActions.handleCigs(user, setPlayer, setDealer,
          (v) => setAnim(p => ({ ...p, triggerHeal: typeof v === 'function' ? v(p.triggerHeal) : v }))
        );
        break;

      case 'SAW':
        await ItemActions.handleSaw(user, setPlayer, setDealer,
          (v) => setAnim(p => ({ ...p, triggerSparks: typeof v === 'function' ? v(p.triggerSparks) : v })),
          (v) => setAnim(p => ({ ...p, isSawing: typeof v === 'function' ? v(p.isSawing) : v }))
        );
        break;

      case 'CUFFS':
        await ItemActions.handleCuffs(user, setPlayer, setDealer, (v) => setAnim(p => ({ ...p, triggerCuff: typeof v === 'function' ? v(p.triggerCuff) : v })));
        await wait(500); // Pause after cuffs animation
        break;

      case 'GLASS':
        await ItemActions.handleGlass(user, gameState, setKnownShell,
          (v) => setAnim(p => ({ ...p, triggerGlass: typeof v === 'function' ? v(p.triggerGlass) : v })),
          addLog
        );
        break;

      case 'PHONE':
        await ItemActions.handlePhone(user, gameState,
          (v) => setAnim(p => ({ ...p, triggerPhone: typeof v === 'function' ? v(p.triggerPhone) : v })),
          addLog,
          setOverlayText
        );
        break;

      case 'INVERTER':
        await ItemActions.handleInverter(user, gameState, setGameState,
          (v) => setAnim(p => ({ ...p, triggerInverter: typeof v === 'function' ? v(p.triggerInverter) : v })),
          addLog,
          setOverlayText
        );
        break;

      case 'ADRENALINE':
        await ItemActions.handleAdrenaline(user,
          (v) => setAnim(p => ({ ...p, triggerAdrenaline: typeof v === 'function' ? v(p.triggerAdrenaline) : v })),
          setGameState, addLog, setOverlayText
        );
        await wait(500); // Pause before next action
        setTimeout(() => setOverlayColor('none'), 1200);
        break;
    }

    // Final synchronization wait - ensures animation is visually complete before proceeding
    await wait(300);

    return roundEnded;
  };

  const usePlayerItem = async (index: number) => {
    if (gameState.phase !== 'PLAYER_TURN') return;
    if (isProcessing) return;

    if (cameraView === 'GUN') {
      addLog("CAN'T USE ITEMS WHILE HOLDING GUN", 'info');
      return;
    }

    const item = player.items[index];
    if (!item) return;

    if (item === 'CUFFS' && dealer.isHandcuffed) return;

    setIsProcessing(true);

    const newItems = [...player.items];
    newItems.splice(index, 1);
    setPlayer(p => ({ ...p, items: newItems }));

    await processItemEffect('PLAYER', item);

    setIsProcessing(false);
  };

  // Helper to directly set game phase (useful for multiplayer)
  const setGamePhase = (phase: GameState['phase']) => {
    setGameState(prev => ({ ...prev, phase }));
  };

  const stealItem = async (index: number) => {
    // Prevent actions during steal
    if (isProcessing) return;

    // 1. Remove from dealer
    const itemToSteal = dealer.items[index];
    if (!itemToSteal) return;

    // Can't steal ADRENALINE with ADRENALINE
    if (itemToSteal === 'ADRENALINE') {
      addLog("CAN'T STEAL ADRENALINE!", 'danger');
      setOverlayText("❌ CAN'T STEAL ADRENALINE! PICK ANOTHER");
      await wait(2000);
      setOverlayText(null);
      // Stay in STEALING phase so player can pick another item
      return;
    }

    // Lock processing immediately
    setIsProcessing(true);

    const newDealerItems = [...dealer.items];
    newDealerItems.splice(index, 1);
    setDealer(prev => ({ ...prev, items: newDealerItems }));

    // Show steal message and wait for it to be visible
    addLog(`${playerName.toUpperCase()} STOLE ${itemToSteal}`, 'info');
    setOverlayText(`🎯 STOLE ${itemToSteal}!`);
    await wait(1800); // Let player see the steal message
    setOverlayText(null);

    setGameState(p => ({ ...p, phase: 'PLAYER_TURN' }));

    // 2. Use it immediately - with clear gap for readability
    await wait(800); // Gap between steal and use
    await processItemEffect('PLAYER', itemToSteal);

    // Final sync wait
    await wait(300);
    setIsProcessing(false);
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
    isProcessing,
    startGame,
    fireShot,
    usePlayerItem,
    stealItem, // Exported
    setAimTarget,
    setCameraView,
    setDealer,
    setPlayer,
    processItemEffect,
    resetGame,
    setPlayerName,
    pickupGun,
    setGamePhase,
    setOverlayText
  };
};