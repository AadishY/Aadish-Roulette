import { useState, useEffect, useRef } from 'react';
import { GameState, PlayerState, ShellType, ItemType, LogEntry, TurnOwner, CameraView, AimTarget, AnimationState } from '../types';
import { MAX_HP, MAX_ITEMS, ITEMS } from '../constants';
import { randomInt, wait } from '../utils/gameUtils';
import * as ItemActions from '../utils/game/itemActions';
import { audioManager } from '../utils/audioManager';
import { performShot } from '../utils/game/shooting';
import { distributeItems as distributeItemsAction } from '../utils/game/inventory';
import { MatchStats } from '../utils/statsManager';

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

  // Stats Ref to track current match performance
  const matchStatsRef = useRef<MatchStats>({
    result: 'LOSS',
    roundsSurvived: 1,
    shotsFired: 0,
    shotsHit: 0,
    selfShots: 0,
    itemsUsed: {},
    damageDealt: 0,
    damageTaken: 0,
    totalScore: 0
  });

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
    playerHit: false,
    playerRecovering: false,
    dealerRecovering: false
  });

  // Load name on mount
  useEffect(() => {
    const saved = localStorage.getItem('aadish_roulette_name');
    if (saved) setPlayerName(saved);
    // Boot-to-Intro transition is now handled by user click in BootScreen
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
  // Helpers
  const addLog = (text: string, type: LogEntry['type'] = 'neutral') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
  };


  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset Stats on Start/Reset
  const resetStats = () => {
    matchStatsRef.current = {
      result: 'LOSS',
      roundsSurvived: 1,
      shotsFired: 0,
      shotsHit: 0,
      selfShots: 0,
      itemsUsed: {},
      damageDealt: 0,
      damageTaken: 0,
      totalScore: 0
    };
  };

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
    resetStats();

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
      isSawing: false, ejectedShellColor: 'red', muzzleFlashIntensity: 0, isLiveShot: false,
      dealerHit: false, dealerDropping: false, playerHit: false, playerRecovering: false, dealerRecovering: false
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
    // Ensure we don't have 0 blanks or 0 lives
    // Randomize lives count between 1 and total - 1
    // Bias slightly towards even split but allow variance
    let lives = Math.floor(total / 2);
    if (total > 2 && Math.random() > 0.5) {
      // 50% chance to skew slightly (+/- 1)
      lives += Math.random() > 0.5 ? 1 : -1;
    }
    // Clamp to ensure valid game state (at least 1 live, at least 1 blank)
    lives = Math.max(1, Math.min(lives, total - 1));
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

    if (!resetItems) {
      matchStatsRef.current.roundsSurvived = (gameState.roundCount || 0) + 1;
    } else {
      matchStatsRef.current.roundsSurvived = 1;
    }

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
    await distributeItemsAction(
      forceClear, gameState, setPlayer, setDealer, setGameState,
      setReceivedItems, setShowLootOverlay
    );
  };

  const pickupGun = () => {
    if (isProcessing) return;
    // PREVENT GUN PICKUP WHILE ANYONE IS KNOCKED DOWN OR RECOVERING
    if (animState.playerHit || animState.playerRecovering ||
      animState.dealerDropping || animState.dealerRecovering) {
      addLog('WAIT FOR RECOVERY...', 'info');
      return;
    }
    // New Logic: Don't move camera yet. Just show target choices.
    setAimTarget('CHOOSING');
  };

  const fireShot = async (shooter: TurnOwner, target: TurnOwner) => {
    if (isProcessing) return;

    // Trigger Gun Animation NOW
    // Trigger Gun Animation for BOTH Player and Dealer
    if (shooter === 'PLAYER') {
      setCameraView('GUN');
    }

    // Set Target Pointing (triggers animation)
    setAimTarget(target === (shooter === 'PLAYER' ? 'PLAYER' : 'DEALER') ? 'SELF' : 'OPPONENT');

    // Wait for Aim Animation (Reduced for responsiveness)
    await wait(300);

    // Update Stats - Shots Fired
    matchStatsRef.current.shotsFired++;
    if (target === shooter) matchStatsRef.current.selfShots++;

    await performShot(shooter, target, {
      gameState, setGameState, player, setPlayer, dealer, setDealer,
      setAnim, setKnownShell, setAimTarget, setCameraView, setOverlayText,
      setOverlayColor, setShowFlash, setShowBlood, addLog, playerName,
      startRound, setIsProcessing,
      // Pass stats ref to update hits/damage inside shooting logic
      matchStats: matchStatsRef
    });
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

    // Track Item Usage
    if (user === 'PLAYER') {
      matchStatsRef.current.itemsUsed[item] = (matchStatsRef.current.itemsUsed[item] || 0) + 1;
    }

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
          setGameState, addLog, setOverlayText, setOverlayColor
        );
        await wait(500); // Pause before next action
        break;
    }

    // Final synchronization wait - ensures animation is visually complete before proceeding
    await wait(300);

    return roundEnded;
  };

  const usePlayerItem = async (index: number) => {
    if (gameState.phase !== 'PLAYER_TURN') return;
    if (isProcessing) return;

    // Check if gun is held - blocking all item usage
    if (cameraView === 'GUN' || aimTarget !== 'IDLE') {
      addLog("CAN'T USE ITEMS WHILE HOLDING GUN", 'info');
      // Force UI update to ensure button text or blocked state is visible
      return;
    }

    const item = player.items[index];
    if (!item) return;

    if (item === 'CUFFS' && dealer.isHandcuffed) return;

    if (item === 'ADRENALINE') {
      const stealableItems = dealer.items.filter(i => i !== 'ADRENALINE' && i !== null);
      if (stealableItems.length === 0) {
        addLog("NOTHING TO STEAL", 'info');
        return;
      }
    }

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
    await wait(1000); // Faster feedback (was 1800)
    setOverlayText(null);

    setGameState(p => ({ ...p, phase: 'PLAYER_TURN' }));

    // 2. Use it immediately - with clear gap for readability
    await wait(400); // Quicker transition (was 800)
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
    setOverlayText,
    matchStats: matchStatsRef.current // Export stats
  };
};