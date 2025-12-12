import React from 'react';
import { GameState, PlayerState, TurnOwner, ShellType, ItemType, LogEntry } from '../types';
import { wait } from './gameUtils';
import { audioManager } from './audioManager';

// Helper to update state safely
type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export const handleBeer = async (
    gameState: GameState,
    setGameState: StateSetter<GameState>,
    setTriggerRack: StateSetter<number>,
    setEjectedShellColor: StateSetter<'red' | 'blue'>,
    setTriggerDrink: StateSetter<number>,
    setOverlayText: StateSetter<string | null>,
    addLog: (text: string, type: LogEntry['type']) => void,
    startRound: () => void
): Promise<boolean> => {
    setTriggerDrink(p => p + 1); // Visual cue
    await wait(1500); // Wait for drinking animation

    const shell = gameState.chamber[gameState.currentShellIndex];
    setEjectedShellColor(shell === 'LIVE' ? 'red' : 'blue');
    setTriggerRack(p => p + 1);
    addLog(`RACKED: ${shell}`, shell === 'LIVE' ? 'danger' : 'safe');

    // Show overlay text for Beer result
    setOverlayText(`WAS ${shell}`);

    await wait(2000); // Wait for rack animation and message
    setOverlayText(null);

    const isLive = shell === 'LIVE';
    let roundEnded = false;

    setGameState(prev => {
        const next = prev.currentShellIndex + 1;
        return {
            ...prev,
            currentShellIndex: next,
            liveCount: isLive ? prev.liveCount - 1 : prev.liveCount,
            blankCount: !isLive ? prev.blankCount - 1 : prev.blankCount
        };
    });

    if (gameState.currentShellIndex + 1 >= gameState.chamber.length) {
        setTimeout(startRound, 1000);
        roundEnded = true;
    }

    await wait(300); // Final sync
    return roundEnded;
};

export const handleCigs = async (
    user: TurnOwner,
    setPlayer: StateSetter<PlayerState>,
    setDealer: StateSetter<PlayerState>,
    setTriggerHeal: StateSetter<number>
) => {
    setTriggerHeal(p => p + 1);
    // audioManager.playSound('grab', { playbackRate: 1.5 }); // Lighter sound
    await wait(2500); // Wait for smoking animation to complete
    if (user === 'PLAYER') setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 1) }));
    else setDealer(d => ({ ...d, hp: Math.min(d.maxHp, d.hp + 1) }));
    await wait(500); // Brief pause after
};

export const handleSaw = async (
    user: TurnOwner,
    setPlayer: StateSetter<PlayerState>,
    setDealer: StateSetter<PlayerState>,
    setTriggerSparks: StateSetter<number>,
    setIsSawing: StateSetter<boolean>
) => {
    setIsSawing(true);
    setTriggerSparks(p => p + 1);
    await wait(1500); // Wait for saw animation
    setIsSawing(false);

    if (user === 'PLAYER') setPlayer(p => ({ ...p, isSawedActive: true }));
    else setDealer(d => ({ ...d, isSawedActive: true }));
    await wait(500); // Brief pause after
};

export const handleCuffs = async (
    user: TurnOwner,
    setPlayer: StateSetter<PlayerState>,
    setDealer: StateSetter<PlayerState>,
    setTriggerCuff: StateSetter<number>
) => {
    setTriggerCuff(p => p + 1);
    // audioManager.playSound('blankshell', { playbackRate: 2.0 }); // High click
    await wait(1500); // Wait for cuff animation to complete
    if (user === 'PLAYER') setDealer(d => ({ ...d, isHandcuffed: true }));
    else setPlayer(p => ({ ...p, isHandcuffed: true }));
    await wait(300); // Final sync
};

export const handleGlass = async (
    user: TurnOwner,
    gameState: GameState,
    setKnownShell: StateSetter<ShellType | null>,
    setTriggerGlass: StateSetter<number>,
    addLog: (text: string, type: LogEntry['type']) => void
) => {
    // 1. Instant Animation Trigger
    setTriggerGlass(p => p + 1);
    // audioManager.playSound('grab', { playbackRate: 1.2 }); // Glass click


    // 2. Delay for lift up animation
    await wait(1200);

    const nextShell = gameState.chamber[gameState.currentShellIndex];

    if (user === 'PLAYER') {
        setKnownShell(nextShell);
        addLog(`IT IS ${nextShell}`, 'info');
        // Clear after 2.5 seconds
        setTimeout(() => setKnownShell(null), 2500);
        await wait(1200); // Wait for player to see result
    } else {
        // Dealer uses it: AI logic knows the shell, but we DO NOT show it to player
        addLog(`DEALER INSPECTS CHAMBER`, 'dealer');
        await wait(1500);
    }
    await wait(300); // Final sync
};

export const handlePhone = async (
    user: TurnOwner,
    gameState: GameState,
    setTriggerPhone: StateSetter<number>,
    addLog: (text: string, type: LogEntry['type']) => void,
    setOverlayText?: StateSetter<string | null>
) => {
    setTriggerPhone(p => p + 1);
    // audioManager.playSound('grab', { playbackRate: 0.8 }); // Heavy plastic
    await wait(2500); // Wait for phone animation

    const checkLimit = gameState.chamber.length;
    const current = gameState.currentShellIndex;

    // Logic: Reveal a random shell from future rounds.
    const available = [];
    for (let i = current + 2; i < checkLimit; i++) {
        available.push(i);
    }

    if (available.length === 0) {
        if (user === 'PLAYER') {
            const msg = "📞 NO INTEL AVAILABLE";
            addLog("YOU ARE ON YOUR OWN BUD", 'neutral');
            if (setOverlayText) {
                setOverlayText(msg);
                setTimeout(() => setOverlayText?.(null), 2500);
            }
        } else {
            addLog("DEALER CHECKS PHONE", 'dealer');
        }
    } else {
        const randomIndex = available[Math.floor(Math.random() * available.length)];
        const actualShell = gameState.chamber[randomIndex];
        const offset = randomIndex - current;

        // 5% chance to LIE about the shell type
        const isLying = Math.random() < 0.05;
        const displayedShell = isLying ? (actualShell === 'LIVE' ? 'BLANK' : 'LIVE') : actualShell;

        let positionText = "";
        if (offset === 2) positionText = "3RD SHELL";
        else if (offset === 3) positionText = "4TH SHELL";
        else if (offset === 4) positionText = "5TH SHELL";
        else positionText = `${offset + 1}TH SHELL`;

        if (user === 'PLAYER') {
            const displayText = `📞 ${positionText} IS ${displayedShell}`;
            addLog(`${positionText} IS ${displayedShell}`, 'info');
            if (setOverlayText) {
                setOverlayText(displayText);
                setTimeout(() => setOverlayText?.(null), 3000);
            }
        } else {
            // Dealer gets the REAL info (AI knows truth)
            addLog(`DEALER USES PHONE`, 'dealer');
        }
    }
    await wait(2500); // Wait for full phone animation and result display
};

export const handleInverter = async (
    user: TurnOwner,
    gameState: GameState,
    setGameState: StateSetter<GameState>,
    setTriggerInverter: StateSetter<number>,
    addLog: (text: string, type: LogEntry['type']) => void,
    setOverlayText?: StateSetter<string | null>
) => {
    setTriggerInverter(p => p + 1);
    // audioManager.playSound('blankshell', { playbackRate: 1.8 }); // Electronic click
    await wait(1500); // Wait for animation to play

    const currentShell = gameState.chamber[gameState.currentShellIndex];
    const newType = currentShell === 'LIVE' ? 'BLANK' : 'LIVE';

    setGameState(prev => {
        const newChamber = [...prev.chamber];
        newChamber[prev.currentShellIndex] = newType;

        // Update counts
        const isLiveNow = newType === 'LIVE';
        return {
            ...prev,
            chamber: newChamber,
            liveCount: isLiveNow ? prev.liveCount + 1 : prev.liveCount - 1,
            blankCount: !isLiveNow ? prev.blankCount + 1 : prev.blankCount - 1
        };
    });

    addLog(`${user} INVERTED POLARITY`, 'info');

    // Display POLARITY CHANGED message on screen
    if (setOverlayText) {
        setOverlayText('⚡ POLARITY CHANGED ⚡');
        setTimeout(() => setOverlayText(null), 2000);
    }

    await wait(800); // Final sync
};

export const handleAdrenaline = async (
    user: TurnOwner,
    setTriggerAdrenaline: StateSetter<number>,
    setGameState: StateSetter<GameState>,
    addLog: (text: string, type: LogEntry['type']) => void,
    setOverlayText?: StateSetter<string | null>
) => {
    setTriggerAdrenaline(p => p + 1);
    // audioManager.playSound('grab', { playbackRate: 1.0 }); // Normal grab

    await wait(1800); // Wait for injection animation

    // Show message AFTER animation plays
    if (setOverlayText) {
        setOverlayText(user === 'PLAYER' ? '💉 ADRENALINE RUSH!' : '💉 DEALER USING ADRENALINE');
        setTimeout(() => setOverlayText?.(null), 1500);
    }

    await wait(500); // Pause before phase change

    if (user === 'PLAYER') {
        addLog("ADRENALINE RUSH! STEAL AN ITEM", 'info');
        setGameState(prev => ({ ...prev, phase: 'STEALING' }));
    } else {
        addLog("DEALER USING ADRENALINE", 'dealer');
    }
    await wait(300); // Final sync
};
