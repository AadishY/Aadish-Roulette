import { useState, useEffect, useRef } from 'react';
import { GameState, PlayerState, ShellType, ItemType, LogEntry, TurnOwner, CameraView, AimTarget, AnimationState } from '../types';
import { wait } from '../utils/gameUtils';
import { GameStateData, MPPlayer, GameOverData } from './useSocket';

interface UseMultiplayerGameProps {
    mpGameState: GameStateData | null;
    myPlayerId: string | null;
    lastAction: any;
    knownShell: string | null;
    onShoot: (targetId: string) => void;
    onUseItem: (itemIndex: number) => void;
    onGrabGun?: () => void;
    // Loot from socket
    socketReceivedLoot?: string[];
    socketShowLootOverlay?: boolean;
    // Announcements
    socketAnnouncement?: string | null;
    // Game over
    gameOverData?: GameOverData | null;
}

export const useMultiplayerGame = ({
    mpGameState,
    myPlayerId,
    lastAction,
    knownShell,
    onShoot,
    onUseItem,
    onGrabGun,
    socketReceivedLoot = [],
    socketShowLootOverlay = false,
    socketAnnouncement = null,
    gameOverData = null
}: UseMultiplayerGameProps) => {

    const [gameState, setGameState] = useState<GameState>({
        phase: 'LOAD',
        turnOwner: 'PLAYER',
        winner: null,
        chamber: [],
        currentShellIndex: 0,
        liveCount: 0,
        blankCount: 0,
        roundCount: 0
    });

    const [player, setPlayer] = useState<PlayerState>({
        hp: 4,
        maxHp: 4,
        items: [],
        isHandcuffed: false,
        isSawedActive: false,
    });

    const [dealer, setDealer] = useState<PlayerState>({
        hp: 4,
        maxHp: 4,
        items: [],
        isHandcuffed: false,
        isSawedActive: false,
    });

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [localKnownShell, setLocalKnownShell] = useState<ShellType | null>(null);
    const [aimTarget, setAimTarget] = useState<AimTarget>('IDLE');
    const [cameraView, setCameraView] = useState<CameraView>('PLAYER');
    const [overlayColor, setOverlayColor] = useState<'none' | 'red' | 'green' | 'scan'>('none');
    const [overlayText, setOverlayText] = useState<string | null>(null);
    const [showBlood, setShowBlood] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Use socket data
    const receivedItems = socketReceivedLoot as ItemType[];
    const showLootOverlay = socketShowLootOverlay;

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

    const setAnim = (update: Partial<AnimationState> | ((prev: AnimationState) => Partial<AnimationState>)) => {
        setAnimState(prev => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }));
    };

    const addLog = (text: string, type: LogEntry['type'] = 'neutral') => {
        setLogs(prev => [...prev.slice(-19), { id: Date.now() + Math.random(), text, type }]);
    };

    // Get players
    const myPlayer = mpGameState?.players[myPlayerId || ''];
    const opponentIds = mpGameState ? Object.keys(mpGameState.players).filter(id => id !== myPlayerId) : [];
    const mainOpponentId = opponentIds[0];
    const mainOpponent = mpGameState?.players[mainOpponentId];

    // Show socket announcements as overlay text (and clear when null)
    useEffect(() => {
        if (socketAnnouncement) {
            setOverlayText(socketAnnouncement);
        } else {
            // Clear overlay when announcement clears (after timeout in useSocket)
            setOverlayText(null);
        }
    }, [socketAnnouncement]);

    // Game over handling
    useEffect(() => {
        if (gameOverData) {
            const isWinner = gameOverData.winnerId === myPlayerId;
            setGameState(prev => ({
                ...prev,
                phase: 'GAME_OVER',
                winner: isWinner ? 'PLAYER' : 'DEALER'
            }));
        }
    }, [gameOverData, myPlayerId]);

    // Sync multiplayer state
    useEffect(() => {
        if (!mpGameState || !myPlayerId) return;

        const me = mpGameState.players[myPlayerId];
        if (!me) return;

        setPlayer({
            hp: me.hp,
            maxHp: me.maxHp,
            items: me.items as ItemType[],
            isHandcuffed: me.isHandcuffed,
            isSawedActive: me.isSawedActive
        });

        if (mainOpponent) {
            setDealer({
                hp: mainOpponent.hp,
                maxHp: mainOpponent.maxHp,
                items: mainOpponent.items as ItemType[],
                isHandcuffed: mainOpponent.isHandcuffed,
                isSawedActive: mainOpponent.isSawedActive
            });
        }

        const isMyTurn = mpGameState.currentTurnPlayerId === myPlayerId;

        // Don't override GAME_OVER phase
        if (gameOverData) return;

        setGameState(prev => ({
            ...prev,
            phase: isMyTurn ? 'PLAYER_TURN' : 'DEALER_TURN',
            turnOwner: isMyTurn ? 'PLAYER' : 'DEALER',
            currentShellIndex: mpGameState.currentShellIndex,
            liveCount: mpGameState.liveCount,
            blankCount: mpGameState.blankCount
        }));
    }, [mpGameState, myPlayerId, mainOpponent, gameOverData]);

    // Sync known shell
    useEffect(() => {
        if (knownShell) {
            setLocalKnownShell(knownShell as ShellType);
            setOverlayText(`CHAMBER IS ${knownShell}`);
            setTimeout(() => {
                setLocalKnownShell(null);
                setOverlayText(null);
            }, 5000);
        }
    }, [knownShell]);

    // Handle actions
    const lastActionRef = useRef<number>(0);

    useEffect(() => {
        if (!lastAction || !mpGameState || !myPlayerId) return;

        const now = Date.now();
        if (now - lastActionRef.current < 500) return;
        lastActionRef.current = now;

        const processAction = async () => {
            if (lastAction.action === 'shoot') {
                setIsProcessing(true);

                const shooterId = lastAction.shooterId;
                const targetId = lastAction.targetId;
                const shell = lastAction.shell;
                const damage = lastAction.damage;
                const isLive = shell === 'LIVE';
                const iAmShooter = shooterId === myPlayerId;
                const iAmTarget = targetId === myPlayerId;

                if (iAmShooter) {
                    setCameraView('GUN');
                    setAimTarget(targetId === myPlayerId ? 'SELF' : 'OPPONENT');
                }

                await wait(300);

                setAnim(prev => ({
                    ...prev,
                    isLiveShot: isLive,
                    triggerRecoil: prev.triggerRecoil + 1,
                    muzzleFlashIntensity: isLive ? 100 : 0
                }));

                if (isLive) {
                    if (iAmTarget) {
                        setAnim(prev => ({ ...prev, playerHit: true }));
                        setOverlayColor('red');
                        setShowBlood(true);
                        setTimeout(() => {
                            setShowBlood(false);
                            setAnim(prev => ({ ...prev, playerHit: false }));
                        }, 2000);
                    } else if (!iAmShooter || !iAmTarget) {
                        setAnim(prev => ({
                            ...prev,
                            dealerHit: true,
                            dealerDropping: lastAction.targetHp <= 0
                        }));
                        setOverlayColor('green');
                        setTimeout(() => setAnim(prev => ({ ...prev, dealerHit: false })), 200);
                    }

                    setShowFlash(true);
                    setTimeout(() => {
                        setShowFlash(false);
                        setAnim({ muzzleFlashIntensity: 0 });
                    }, 100);
                }

                setOverlayText(shell);

                await wait(400);
                setAnim(prev => ({
                    ...prev,
                    ejectedShellColor: isLive ? 'red' : 'blue',
                    triggerRack: prev.triggerRack + 1
                }));

                await wait(1000);
                setOverlayText(null);
                setOverlayColor('none');
                setAimTarget('IDLE');

                if (iAmShooter) {
                    setCameraView('PLAYER');
                }

                setIsProcessing(false);
            }

            if (lastAction.type === 'item' || lastAction.item) {
                const item = lastAction.item;
                const iUsedIt = lastAction.playerId === myPlayerId;

                setIsProcessing(true);

                await wait(500);

                switch (item) {
                    case 'BEER':
                        if (lastAction.ejectedShell) {
                            setAnim(prev => ({
                                ...prev,
                                ejectedShellColor: lastAction.ejectedShell === 'LIVE' ? 'red' : 'blue',
                                triggerRack: prev.triggerRack + 1,
                                triggerDrink: prev.triggerDrink + 1
                            }));
                        }
                        break;

                    case 'CIGS':
                        if (iUsedIt) {
                            setAnim(prev => ({ ...prev, triggerHeal: prev.triggerHeal + 1 }));
                        }
                        break;

                    case 'SAW':
                        setAnim(prev => ({
                            ...prev,
                            triggerSparks: prev.triggerSparks + 1,
                            isSawing: true
                        }));
                        setTimeout(() => setAnim(prev => ({ ...prev, isSawing: false })), 1500);
                        break;

                    case 'CUFFS':
                        setAnim(prev => ({ ...prev, triggerCuff: prev.triggerCuff + 1 }));
                        break;

                    case 'GLASS':
                        if (iUsedIt) {
                            setOverlayColor('scan');
                            setTimeout(() => setOverlayColor('none'), 1000);
                        }
                        break;
                }

                await wait(500);
                setIsProcessing(false);
            }
        };

        processAction();
    }, [lastAction, mpGameState, myPlayerId]);

    // Shooting
    const fireShot = async (shooter: TurnOwner, target: TurnOwner) => {
        if (isProcessing) return;
        if (!mpGameState || !myPlayerId) return;
        if (mpGameState.currentTurnPlayerId !== myPlayerId) return;

        setIsProcessing(true);
        setCameraView('GUN');

        let targetId: string;
        if (target === 'PLAYER') {
            targetId = myPlayerId;
        } else {
            targetId = mainOpponentId;
        }

        setAimTarget(target === 'PLAYER' ? 'SELF' : 'OPPONENT');
        await wait(300);

        onShoot(targetId);
    };

    // Items
    const usePlayerItem = async (index: number) => {
        if (isProcessing) return;
        if (!mpGameState || !myPlayerId) return;
        if (mpGameState.currentTurnPlayerId !== myPlayerId) return;

        if (cameraView === 'GUN') {
            addLog("DROP GUN FIRST", 'info');
            return;
        }

        onUseItem(index);
    };

    // Pickup gun
    const pickupGun = () => {
        if (isProcessing) return;
        setCameraView('GUN');
        if (onGrabGun) onGrabGun();
    };

    return {
        gameState,
        player,
        dealer,
        logs,
        animState,
        knownShell: localKnownShell,
        aimTarget,
        cameraView,
        overlayColor,
        overlayText,
        showBlood,
        showFlash,
        receivedItems,
        showLootOverlay,
        isProcessing,
        fireShot,
        usePlayerItem,
        setAimTarget,
        setCameraView,
        pickupGun,
        myPlayerId,
        mpGameState,
        allOpponents: opponentIds.map(id => mpGameState?.players[id]).filter(Boolean) as MPPlayer[]
    };
};
