import React from 'react';
import { GameState, PlayerState, TurnOwner, ShellType, LogEntry, AnimationState, AimTarget, CameraView } from '../../types';
import { wait } from '../gameUtils';
import { audioManager } from '../audioManager';

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

interface ShootingContext {
    gameState: GameState;
    setGameState: StateSetter<GameState>;
    player: PlayerState;
    setPlayer: StateSetter<PlayerState>;
    dealer: PlayerState;
    setDealer: StateSetter<PlayerState>;
    setAnim: (update: Partial<AnimationState> | ((prev: AnimationState) => Partial<AnimationState>)) => void;
    setKnownShell: StateSetter<ShellType | null>;
    setAimTarget: StateSetter<AimTarget>;
    setCameraView: StateSetter<CameraView>;
    setOverlayText: StateSetter<string | null>;
    setOverlayColor: StateSetter<'none' | 'red' | 'green' | 'scan'>;
    setShowFlash: StateSetter<boolean>;
    setShowBlood: StateSetter<boolean>;
    addLog: (text: string, type: LogEntry['type']) => void;
    playerName: string;
    startRound: (resetItems?: boolean) => void;
    setIsProcessing: StateSetter<boolean>;
}

export const performShot = async (
    shooter: TurnOwner,
    target: TurnOwner,
    ctx: ShootingContext
) => {
    const {
        gameState, setGameState, player, setPlayer, dealer, setDealer,
        setAnim, setKnownShell, setAimTarget, setCameraView, setOverlayText, setOverlayColor,
        setShowFlash, setShowBlood, addLog, playerName, startRound, setIsProcessing
    } = ctx;

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

    setTimeout(() => {
        if (isLive) audioManager.playSound('liveshell');
        else audioManager.playSound('blankshell');
    }, 50);

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
        // INSTANT HIT - Player knocked down
        setAnim(prev => ({ ...prev, playerHit: true, playerRecovering: true }));
        setOverlayColor('red'); // Instant Red Screen
        setShowBlood(true);
        // Player hit lasts 2.5s, then recovery animation begins
        setTimeout(() => {
            setAnim(prev => ({ ...prev, playerHit: false }));
            setShowBlood(false);
            setOverlayColor('none');
            // Recovery animation continues for another 2s
            setTimeout(() => {
                setAnim(prev => ({ ...prev, playerRecovering: false }));
            }, 2000);
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
            // Mark dealer as recovering during stand-up animation
            setAnim(prev => ({ ...prev, dealerRecovering: true }));

            await wait(2000);

            if (newHp > 0) {
                setAnim(prev => ({ ...prev, dealerDropping: false }));
                await wait(1500); // Longer recovery time for dealer stand-up
                setAnim(prev => ({ ...prev, dealerRecovering: false }));
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
        addLog(`${shooterName} GOES AGAIN`, 'neutral');
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
            audioManager.playSound('checkhandcuffs');

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
    setCameraView(nextOwner === 'PLAYER' ? 'PLAYER' : 'PLAYER'); // Default to PLAYER (or dealer idle view?)
    // Originally setCameraView(nextOwner === 'PLAYER' ? 'PLAYER' : 'PLAYER'); // Wait, why both PLAYER?
    // Original code: setCameraView(nextOwner === 'PLAYER' ? 'PLAYER' : 'PLAYER'); 
    // Yes, originally it forced PLAYER view even if dealer turn, maybe because DealerAI handles view switching? 
    // Or maybe it's a bug/feature. I'll keep it as is.

    setIsProcessing(false);
};
