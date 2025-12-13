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
    phase: 'BOOT',
    turnOwner: 'PLAYER',
    winner: null,
    chamber: [],
    currentShellIndex: 0,
    liveCount: 0,
    blankCount: 0,
    roundCount: 0,
    isHardMode: false
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
  }, []);

  const setAnim = (update: Partial<AnimationState> | ((prev: AnimationState) => Partial<AnimationState>)) => {
    setAnimState(prev => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }));
  };

  const [aimTarget, setAimTarget] = useState<AimTarget>('IDLE');
  const [cameraView, setCameraView] = useState<CameraView>('PLAYER');
  const [overlayColor, setOverlayColor] = useState<'none' | 'red' | 'green' | 'scan'>('none');
  const [overlayText, setOverlayText] = useState<string | null>(null);
  const [showBlood, setShowBlood] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const [receivedItems, setReceivedItems] = useState<ItemType[]>([]);
  const [showLootOverlay, setShowLootOverlay] = useState(false);

  const addLog = (text: string, type: LogEntry['type'] = 'neutral') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
  };

  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const resetGame = (toMenu: boolean = false) => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    setReceivedItems([]);
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
      roundCount: 0,
      isHardMode: false, // Reset to normal on full reset
      hardModeState: undefined
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
      resetTimeoutRef.current = setTimeout(() => {
        startRound(true);
        resetTimeoutRef.current = null;
      }, 200);
    }
  };

  const startGame = (name: string, hardMode: boolean = false) => {
    // Clear any pending resets from previous actions
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    localStorage.setItem('aadish_roulette_name', name);
    setPlayerName(name);

    // Full Reset (same as resetGame)
    const initialHp = 2; // Round 1 starts with 2 charges
    setPlayer({ hp: initialHp, maxHp: initialHp, items: [], isHandcuffed: false, isSawedActive: false });
    setDealer({ hp: initialHp, maxHp: initialHp, items: [], isHandcuffed: false, isSawedActive: false });
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
    matchStatsRef.current = {
      result: 'LOSS',
      roundsSurvived: 0,
      shotsFired: 0,
      shotsHit: 0,
      selfShots: 0,
      itemsUsed: {},
      damageDealt: 0,
      damageTaken: 0,
      totalScore: 0,
      isHardMode: hardMode,
      roundResults: []
    };

    const initialHardModeState = hardMode ? { round: 1, playerWins: 0, dealerWins: 0 } : undefined;

    setGameState({
      phase: 'LOAD',
      turnOwner: 'PLAYER',
      winner: null,
      chamber: [],
      currentShellIndex: 0,
      liveCount: 0,
      blankCount: 0,
      roundCount: 0,
      isHardMode: hardMode,
      hardModeState: initialHardModeState
    });

    matchStatsRef.current.isHardMode = hardMode;

    if (hardMode) {
      setOverlayText('ROUND 1');
      setTimeout(() => {
        setOverlayText(null);
        startRound(true, hardMode, initialHardModeState);
      }, 3000);
    } else {
      startRound(true, hardMode, initialHardModeState);
    }
  };

  const startRound = async (resetItems: boolean = false, hardModeOverride?: boolean, hardModeStateOverride?: any) => {
    // Resolve Hard Mode State
    // Prioritize override, then current state
    const isHM = hardModeOverride !== undefined ? hardModeOverride : gameState.isHardMode;
    const hmState = hardModeStateOverride !== undefined ? hardModeStateOverride : gameState.hardModeState;

    const total = randomInt(2, 8);
    const maxLives = Math.floor(total / 2);
    let lives = randomInt(1, maxLives);
    if (lives < maxLives && Math.random() > 0.4) {
      lives = maxLives;
    }
    const blanks = total - lives;

    let chamber = [...Array(lives).fill('LIVE'), ...Array(blanks).fill('BLANK')] as ShellType[];

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
      roundCount: resetItems ? 1 : prev.roundCount + 1,
      phase: 'LOAD',
      isHardMode: isHM, // Ensure synced
      hardModeState: hmState
    }));

    if (!resetItems && !isHM) {
      matchStatsRef.current.roundsSurvived = (gameState.roundCount || 0) + 1;
    } else {
      if (!isHM) matchStatsRef.current.roundsSurvived = 1;
      // In HM, roundsSurvived could track match rounds
    }

    setKnownShell(null);
    setAnim({ dealerDropping: false, playerHit: false });
    setCameraView('TABLE');

    // Hard Mode HP Setup
    let startingHp = MAX_HP;
    if (isHM) {
      const stage = hmState?.round || 1;
      if (stage === 1) startingHp = 2;
      else if (stage === 2) startingHp = 3;
      else startingHp = 4;
    }

    // Reset HP only if it's a NEW Stage (resetItems=true usually implies new stage in this logic flow)
    if (resetItems) {
      setPlayer(p => ({ ...p, isHandcuffed: false, isSawedActive: false, items: [], hp: startingHp, maxHp: startingHp }));
      setDealer(d => ({ ...d, isHandcuffed: false, isSawedActive: false, items: [], hp: startingHp, maxHp: startingHp }));
    } else {
      // Just reset status effects
      setPlayer(p => ({ ...p, isHandcuffed: false, isSawedActive: false }));
      setDealer(d => ({ ...d, isHandcuffed: false, isSawedActive: false }));
    }

    // Show Batch/Round Message
    // In Hard Mode, round announcements are handled by startGame/roundEnd logic
    // to allow for custom color effects and flow.

    addLog('--- NEW BATCH ---');
    addLog(`${lives} LIVE, ${blanks} BLANK`);

    setOverlayText(`${lives} LIVE  |  ${blanks} BLANK`);
    await wait(3000);
    setOverlayText(null);

    // Pass overrides to distributeItems if needed, or rely on setGameState above having propagated?
    // React state might not be ready. distributeItems uses the `gameState` passed to it IF we passed it.
    // Use the `isHM` flag in a modified distributeItems or rely on the state update.
    // Best to pass updated gameState structure to distributeItemsAction if possible, but it takes setter.
    // Workaround: We will rely on React State being "fast enough" or update distributeItems to take a partial override.
    // Actually, `distributeItemsAction` reads `gameState.isHardMode`. 
    // Since we called `setGameState` above, but this is async, we might read old state.
    // Fix: Pass an "effective game state" object.

    // Construct effective state for distribution
    const effectiveState = {
      ...gameState,
      isHardMode: isHM,
      hardModeState: hmState,
      roundCount: resetItems ? 1 : gameState.roundCount + 1
    };

    await distributeItemsAction(
      resetItems, effectiveState, setPlayer, setDealer, setGameState,
      setReceivedItems, setShowLootOverlay
    );

    setGameState(prev => ({ ...prev, phase: 'PLAYER_TURN', turnOwner: 'PLAYER' }));
    setCameraView('PLAYER');
    addLog('YOUR MOVE.');
  };

  /* Fixed Hard Mode logic */
  const handleHardModeRoundEnd = async (winner: TurnOwner) => {
    setIsProcessing(true);

    const currentState = gameState.hardModeState || { round: 1, playerWins: 0, dealerWins: 0 };
    const currentRound = currentState.round;

    let nextState = { ...currentState };
    if (winner === 'PLAYER') {
      nextState.playerWins++;
      matchStatsRef.current.roundsSurvived++;
    } else {
      nextState.dealerWins++;
    }

    // Track Round Result
    if (!matchStatsRef.current.roundResults) matchStatsRef.current.roundResults = [];
    matchStatsRef.current.roundResults.push(winner === 'PLAYER' ? 'WIN' : 'LOSS');

    // 1. Show Winner of Round Visuals
    const winMsg = winner === 'PLAYER' ? `${playerName} WON ROUND ${currentRound}` : `DEALER WON ROUND ${currentRound}`;
    const color = winner === 'PLAYER' ? 'green' : 'red';

    setOverlayColor(color);
    setOverlayText(winMsg);

    // Sound Effect
    if (winner === 'PLAYER') audioManager.playSound('insert');
    else audioManager.playSound('rack');

    // Wait for reading
    await wait(3000);

    // Check Match Over
    if (nextState.playerWins >= 2 || nextState.dealerWins >= 2) {
      setGameState(prev => ({ ...prev, winner, phase: 'GAME_OVER', hardModeState: nextState }));
      matchStatsRef.current.result = winner === 'PLAYER' ? 'WIN' : 'LOSS';
      matchStatsRef.current.totalScore = matchStatsRef.current.totalScore * 2;
      setIsProcessing(false);
      setOverlayColor('none');
      setOverlayText(null);
      return;
    }

    // Next Round Setup
    nextState.round++;
    setOverlayColor('none');
    setOverlayText(`ROUND ${nextState.round}`);

    // Validating Round Start
    addLog(`ROUND ${nextState.round} STARTING...`);

    // Wait for "Round X" text
    await wait(2000);

    setOverlayText(null);

    // Trigger Next Round
    setGameState(prev => ({ ...prev, hardModeState: nextState, phase: 'LOAD' }));
    await startRound(true, true, nextState);
    setIsProcessing(false);
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
    // setIsProcessing(true); // Lock input immediately to prevent mobile touch interference - moved below

    // Trigger Gun Animation for BOTH Player and Dealer
    if (shooter === 'PLAYER') {
      setCameraView('GUN');
    }

    // Determine intended aim target
    const intendedAim = target === (shooter === 'PLAYER' ? 'PLAYER' : 'DEALER') ? 'SELF' : 'OPPONENT';

    // --- DOUBLE TAP / SAFETY CHECK ---
    // If gun is not already pointing at the intended target, JUST AIM first.
    // This solves mobile tap issues (Tap 1 = Aim, Tap 2 = Shoot).
    // On Desktop, hover events handle the "Aim" part, so click immediately shoots.
    // NOTE: Only applies to PLAYER. Dealer AI should not be blocked.
    if (shooter === 'PLAYER' && aimTarget !== intendedAim) {
      setAimTarget(intendedAim);
      // No need to setIsProcessing(true) if we're just aiming and returning
      return;
    }

    // If we reach here, it means aimTarget === intendedAim OR shooter is DEALER
    // Lock input now that we're committing to the shot.
    setIsProcessing(true);

    // Proceed to Fire
    setAimTarget(intendedAim); // Ensure it's set, though it should already be
    // Tiny delay to ensure visual sync - extended to match animation speed
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
      matchStats: matchStatsRef,
      handleHardModeRoundEnd
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

    // Logic for ADRENALINE (Must have something to steal)
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
    await wait(800); // Faster feedback (was 1800)
    setOverlayText(null);

    setGameState(p => ({ ...p, phase: 'PLAYER_TURN' }));

    // 2. Use it immediately - with clear gap for readability
    await wait(100); // Quicker transition (was 800)
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