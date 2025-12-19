import { useState, useEffect, useRef } from 'react';
import { GameState, PlayerState, ShellType, ItemType, LogEntry, TurnOwner, CameraView, AimTarget, AnimationState, RoomSettings } from '../types';
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
  const onBatchEndRef = useRef<(() => void) | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'BOOT',
    turnOwner: 'PLAYER',
    winner: null,
    chamber: [],
    currentShellIndex: 0,
    liveCount: 0,
    blankCount: 0,
    roundCount: 0,
    isHardMode: false,
    roomSettings: { rounds: 1, hp: 2, itemsPerShipment: 4 },
    multiModeState: { playerWins: 0, opponentWins: 0 }
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
    triggerChoke: 0,
    triggerRemote: 0,
    triggerBigInverter: 0,
    triggerContract: 0,
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

  const getOpponentName = () => {
    return gameState.isMultiplayer ? (gameState.opponentName || 'OPPONENT') : 'DEALER';
  };

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
      dealerHit: false, dealerDropping: false, playerHit: false, playerRecovering: false, dealerRecovering: false,
      triggerAdrenaline: 0, triggerChoke: 0, triggerPhone: 0, triggerInverter: 0, triggerRemote: 0, triggerBigInverter: 0, triggerContract: 0
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

  const startGame = (
    name: string,
    hardMode: boolean = false,
    isMultiplayer: boolean = false,
    opponentName: string = 'OPPONENT',
    turnOwner: TurnOwner = 'PLAYER',
    chamberOverride?: ShellType[],
    pItemsOverride?: ItemType[],
    dItemsOverride?: ItemType[],
    hpOverride?: number,
    mpSettings?: RoomSettings
  ) => {
    // Clear any pending resets from previous actions
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    localStorage.setItem('aadish_roulette_name', name);
    setPlayerName(name);

    setIsProcessing(true); // Lock input during initialization

    // HP from override or settings
    const initialHp = hpOverride || (mpSettings?.hp) || 2;

    setPlayer({ hp: initialHp, maxHp: initialHp, items: [], isHandcuffed: false, isSawedActive: false });
    setDealer({ hp: initialHp, maxHp: initialHp, items: [], isHandcuffed: false, isSawedActive: false });
    setLogs([]);
    setKnownShell(null);
    setAnim({
      triggerRecoil: 0, triggerRack: 0, triggerSparks: 0, triggerHeal: 0, triggerDrink: 0, triggerCuff: 0,
      isSawing: false, ejectedShellColor: 'red', muzzleFlashIntensity: 0, isLiveShot: false,
      dealerHit: false, dealerDropping: false, playerHit: false, playerRecovering: false, dealerRecovering: false,
      triggerAdrenaline: 0, triggerChoke: 0, triggerPhone: 0, triggerInverter: 0, triggerRemote: 0, triggerBigInverter: 0, triggerContract: 0
    });
    setCameraView('PLAYER');
    setShowBlood(false);

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
      turnOwner: turnOwner,
      winner: null,
      chamber: [],
      currentShellIndex: 0,
      liveCount: 0,
      blankCount: 0,
      roundCount: 0,
      isHardMode: hardMode,
      isMultiplayer: isMultiplayer,
      opponentName: opponentName,
      hardModeState: initialHardModeState,
      roomSettings: mpSettings || { rounds: 1, hp: 4, itemsPerShipment: 4 },
      multiModeState: { playerWins: 0, opponentWins: 0 }
    });

    matchStatsRef.current.isHardMode = hardMode;

    // Show ROUND 1 overlay explicitly for EVERY mode
    // setOverlayText('ROUND 1'); // Removed - Redundant with startRound
    // setOverlayColor('none');

    // Start with a delay to let player see the message
    setTimeout(() => {
      // setOverlayText(null);
      startRound(true, hardMode, initialHardModeState, chamberOverride, pItemsOverride, dItemsOverride, turnOwner, hpOverride);
    }, 100); // Reduced delay since startRound has its own delay
  };

  const startRound = async (
    resetItems: boolean = false,
    hardModeOverride?: boolean,
    hardModeStateOverride?: any,
    chamberOverride?: ShellType[],
    pItemsOverride?: ItemType[],
    dItemsOverride?: ItemType[],
    turnOwnerOverride?: TurnOwner,
    hpOverride?: number,
    multiWinsOverride?: { playerWins: number, opponentWins: number }
  ) => {
    // Resolve Hard Mode State
    // Prioritize override, then current state
    const isHM = hardModeOverride !== undefined ? hardModeOverride : gameState.isHardMode;
    const hmState = hardModeStateOverride !== undefined ? hardModeStateOverride : gameState.hardModeState;

    let chamber: ShellType[];
    let lives: number;
    let blanks: number;

    if (chamberOverride) {
      chamber = chamberOverride;
      lives = chamber.filter(s => s === 'LIVE').length;
      blanks = chamber.filter(s => s === 'BLANK').length;
    } else {
      const total = randomInt(2, 8);
      const maxLives = Math.floor(total / 2);
      lives = randomInt(1, maxLives);
      if (lives < maxLives && Math.random() > 0.4) {
        lives = maxLives;
      }
      blanks = total - lives;

      chamber = [...Array(lives).fill('LIVE'), ...Array(blanks).fill('BLANK')] as ShellType[];

      for (let i = chamber.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chamber[i], chamber[j]] = [chamber[j], chamber[i]];
      }
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
    let startingHp = hpOverride || MAX_HP;
    if (isHM && !hpOverride) {
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
      setPlayer(p => ({ ...p, isHandcuffed: false, isSawedActive: false, isChokeActive: false }));
      setDealer(d => ({ ...d, isHandcuffed: false, isSawedActive: false, isChokeActive: false }));
    }

    setIsProcessing(true);

    // 1. Show ROUND X announcement
    let displayRound = gameState.roundCount + 1;
    if (isHM) {
      displayRound = hmState?.round || 1;
    } else if (gameState.isMultiplayer) {
      const wins = multiWinsOverride || gameState.multiModeState;
      displayRound = (wins?.playerWins || 0) + (wins?.opponentWins || 0) + 1;
    }

    setOverlayText(`ROUND ${displayRound}`);
    setOverlayColor(isHM ? 'red' : 'none');
    audioManager.playSound('rack');
    await wait(2200);
    setOverlayText(null);
    setOverlayColor('none');

    // 2. Show LIVE/BLANK announcement
    addLog('--- NEW BATCH ---');
    addLog(`${lives} LIVE, ${blanks} BLANK`);
    setOverlayText(`${lives} LIVE  |  ${blanks} BLANK`);
    audioManager.playSound('insert');
    await wait(2200);
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
      setReceivedItems, setShowLootOverlay, dealer.hp,
      pItemsOverride, dItemsOverride
    );

    const nextTurn = turnOwnerOverride || 'PLAYER';
    setGameState(prev => ({ ...prev, phase: nextTurn === 'PLAYER' ? 'PLAYER_TURN' : 'DEALER_TURN', turnOwner: nextTurn }));
    if (nextTurn === 'PLAYER') {
      setCameraView('PLAYER');
      addLog('YOUR MOVE.');
    } else {
      setCameraView('DEALER');
      addLog(`${getOpponentName().toUpperCase()}'S TURN.`);
    }

    setIsProcessing(false);
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
    const winMsg = winner === 'PLAYER' ? `${playerName} WON ROUND ${currentRound}` : `${getOpponentName().toUpperCase()} WON ROUND ${currentRound}`;
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
    // Trigger Next Round
    await startRound(true, true, nextState);
    setIsProcessing(false);
  };

  const handleMPRoundEnd = async (winner: TurnOwner) => {
    setIsProcessing(true);

    const mSettings = gameState.roomSettings || { rounds: 1, hp: 4 };
    const winsNeeded = Math.ceil(mSettings.rounds / 2) || 1;

    // Increment wins locally first
    let pWin = (gameState.multiModeState?.playerWins || 0) + (winner === 'PLAYER' ? 1 : 0);
    let oWin = (gameState.multiModeState?.opponentWins || 0) + (winner === 'PLAYER' ? 0 : 1);

    setGameState(prev => ({
      ...prev,
      multiModeState: { playerWins: pWin, opponentWins: oWin }
    }));

    const winMsg = winner === 'PLAYER' ? `${playerName.toUpperCase()} WON THE MATCH!` : `${getOpponentName().toUpperCase()} WON THE MATCH!`;
    const color = winner === 'PLAYER' ? 'green' : 'red';

    setOverlayColor(color);
    setOverlayText(winMsg);
    await wait(3000);

    if (pWin >= winsNeeded || oWin >= winsNeeded) {
      setGameState(prev => ({ ...prev, winner, phase: 'GAME_OVER' }));
      setIsProcessing(false);
      return;
    }

    // Next Round
    const nextRoundNum = pWin + oWin + 1;
    setOverlayColor('none');
    setOverlayText(`ROUND ${nextRoundNum}`);
    await wait(2200);
    setOverlayText(null);

    // Reset HP but keep going
    const initialHp = mSettings.hp || 4;
    setPlayer(p => ({ ...p, hp: initialHp }));
    setDealer(d => ({ ...d, hp: initialHp }));

    // Start a new batch
    startRound(true, false, undefined, undefined, undefined, undefined, undefined, undefined, { playerWins: pWin, opponentWins: oWin });
    setIsProcessing(false);
  };


  const distributeItems = async (forceClear: boolean = false) => {
    await distributeItemsAction(
      forceClear, gameState, setPlayer, setDealer, setGameState,
      setReceivedItems, setShowLootOverlay, dealer.hp
    );
  };

  const pickupGun = () => {
    if (isProcessing) return;
    if (gameState.turnOwner !== 'PLAYER') {
      addLog("NOT YOUR TURN TO PICK UP THE GUN", 'info');
      return;
    }
    // PREVENT GUN PICKUP WHILE ANYONE IS KNOCKED DOWN OR RECOVERING
    if (animState.playerHit || animState.playerRecovering ||
      animState.dealerDropping || animState.dealerRecovering) {
      addLog('WAIT FOR RECOVERY...', 'info');
      return;
    }
    // New Logic: Don't move camera yet. Just show target choices.
    setAimTarget('CHOOSING');
    setCameraView('GUN'); // Set camera to gun view immediately
  };

  const fireShot = async (shooter: TurnOwner, target: TurnOwner) => {
    // Basic phase check
    if (gameState.phase !== 'PLAYER_TURN' && gameState.phase !== 'DEALER_TURN' && gameState.phase !== 'RESOLVING') return;

    // Strict turn check for local player
    if (shooter === 'PLAYER' && gameState.turnOwner !== 'PLAYER') {
      console.warn("Attempted to fire out of turn.");
      return;
    }

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
      onBatchEnd: onBatchEndRef.current || undefined,
      // Pass stats ref to update hits/damage inside shooting logic
      matchStats: matchStatsRef,
      handleHardModeRoundEnd,
      handleMPRoundEnd,
      opponentName: getOpponentName()
    });
  };

  const processItemEffect = async (user: TurnOwner, item: ItemType): Promise<boolean> => {
    if (item === 'CUFFS') {
      const opponent = user === 'PLAYER' ? dealer : player;
      // Check if opponent is already cuffed OR if we just skipped their turn via cuffs
      if (opponent.isHandcuffed || gameState.lastTurnWasSkipped) {
        addLog(`${user === 'PLAYER' ? getOpponentName().toUpperCase() : 'YOU'} CAN'T BE CUFFED AGAIN!`, 'info');
        if (user === 'PLAYER') {
          setPlayer(p => ({ ...p, items: [...p.items, 'CUFFS'] }));
        }
        return false;
      }
    }

    const userName = user === 'PLAYER' ? playerName.toUpperCase() : getOpponentName().toUpperCase();
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
          addLog, startRound,
          onBatchEndRef.current || undefined
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

      case 'BIG_INVERTER':
        await ItemActions.handleBigInverter(user, gameState, setGameState,
          (v) => setAnim(p => ({ ...p, triggerBigInverter: typeof v === 'function' ? v(p.triggerBigInverter) : v })),
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
        await wait(500); // Pause before next action
        break;

      case 'CHOKE':
        await ItemActions.handleChoke(user, setPlayer, setDealer,
          (v) => setAnim(p => ({ ...p, triggerChoke: typeof v === 'function' ? v(p.triggerChoke) : v })),
          addLog
        );
        break;

      case 'REMOTE':
        await ItemActions.handleRemote(user, gameState, setGameState,
          (v) => setAnim(p => ({ ...p, triggerRemote: typeof v === 'function' ? v(p.triggerRemote) : v })),
          addLog,
          setOverlayText
        );
        break;

      case 'CONTRACT':
        await ItemActions.handleContract(
          user, setPlayer, setDealer,
          (v) => setAnim(p => ({ ...p, triggerContract: typeof v === 'function' ? v(p.triggerContract) : v })),
          addLog, setOverlayText, setOverlayColor
        );
        break;
    }

    // Final synchronization wait - ensures animation is visually complete before proceeding
    await wait(300);

    return roundEnded;
  };

  const usePlayerItem = async (index: number) => {
    if (gameState.phase !== 'PLAYER_TURN') return;
    if (gameState.turnOwner !== 'PLAYER') return; // Strict turn check
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

  const stealItem = async (index: number, stealer: TurnOwner = 'PLAYER') => {
    // Prevent actions during steal
    if (isProcessing) return;

    const target = stealer === 'PLAYER' ? dealer : player;
    const user = stealer === 'PLAYER' ? player : dealer;
    const setUser = stealer === 'PLAYER' ? setPlayer : setDealer;
    const setTarget = stealer === 'PLAYER' ? setDealer : setPlayer;

    const itemToSteal = target.items[index];
    if (!itemToSteal) return;

    if (itemToSteal === 'ADRENALINE') {
      if (stealer === 'PLAYER') {
        addLog("CAN'T STEAL ADRENALINE!", 'danger');
        setOverlayText("❌ CAN'T STEAL ADRENALINE! PICK ANOTHER");
        await wait(2000);
        setOverlayText(null);
      }
      return;
    }

    setIsProcessing(true);

    const newTargetItems = [...target.items];
    newTargetItems.splice(index, 1);
    setTarget(prev => ({ ...prev, items: newTargetItems }));

    const stealerName = stealer === 'PLAYER' ? (playerName || 'PLAYER') : (gameState.opponentName || 'OPPONENT');
    addLog(`${stealerName.toUpperCase()} STOLE ${itemToSteal}`, 'info');
    setOverlayText(`🎯 ${stealerName.toUpperCase()} STOLE ${itemToSteal}!`);
    await wait(800);
    setOverlayText(null);

    if (stealer === 'PLAYER') {
      setGameState(p => ({ ...p, phase: 'PLAYER_TURN' }));
    } else {
      setGameState(p => ({ ...p, phase: 'DEALER_TURN' }));
    }

    await wait(100);
    await processItemEffect(stealer, itemToSteal);

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
    setIsProcessing,
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
    pickupGun: (picker: TurnOwner = 'PLAYER') => {
      if (gameState.phase !== 'PLAYER_TURN' && gameState.phase !== 'DEALER_TURN' && gameState.phase !== 'RESOLVING') return;

      // Strict turn check
      if (picker === 'PLAYER' && gameState.turnOwner !== 'PLAYER') return;
      if (picker === 'DEALER' && gameState.turnOwner !== 'DEALER') return;

      if (picker === 'PLAYER') {
        setCameraView('GUN');
        setAimTarget('CHOOSING');
      } else {
        setCameraView('DEALER_GUN');
        setAimTarget('IDLE');
      }
    },
    syncState: (data: { player: PlayerState, dealer: PlayerState, gameState: Partial<GameState> }) => {
      if (data.player) setPlayer(p => ({ ...p, ...data.player }));
      if (data.dealer) setDealer(d => ({ ...d, ...data.dealer }));
      if (data.gameState) setGameState(s => ({ ...s, ...data.gameState }));
    },
    setGamePhase,
    setOverlayText,
    matchStats: matchStatsRef.current,
    setOnBatchEnd: (cb: () => void) => { onBatchEndRef.current = cb; },
    startRound,
    handleHardModeRoundEnd,
    handleMPRoundEnd
  };
};