import React from 'react';
import { GameState, PlayerState, TurnOwner, ShellType, ItemType, LogEntry } from '../types';
import { wait } from './gameUtils';

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
    await wait(1000);

    const shell = gameState.chamber[gameState.currentShellIndex];
    setEjectedShellColor(shell === 'LIVE' ? 'red' : 'blue');
    setTriggerRack(p => p + 1);
    addLog(`RACKED: ${shell}`, shell === 'LIVE' ? 'danger' : 'safe');

    // Show overlay text for Beer result
    setOverlayText(`WAS ${shell}`);

    await wait(1500);
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
    return roundEnded;
};

export const handleCigs = async (
    user: TurnOwner,
    setPlayer: StateSetter<PlayerState>,
    setDealer: StateSetter<PlayerState>,
    setTriggerHeal: StateSetter<number>
) => {
    setTriggerHeal(p => p + 1);
    await wait(1000);
    if (user === 'PLAYER') setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 1) }));
    else setDealer(d => ({ ...d, hp: Math.min(d.maxHp, d.hp + 1) }));
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
    // Reduced wait time for a snappier feel
    await wait(500);
    setIsSawing(false);

    if (user === 'PLAYER') setPlayer(p => ({ ...p, isSawedActive: true }));
    else setDealer(d => ({ ...d, isSawedActive: true }));
};

export const handleCuffs = (
    user: TurnOwner,
    setPlayer: StateSetter<PlayerState>,
    setDealer: StateSetter<PlayerState>,
    setTriggerCuff: StateSetter<number>
) => {
    setTriggerCuff(p => p + 1);
    if (user === 'PLAYER') setDealer(d => ({ ...d, isHandcuffed: true }));
    else setPlayer(p => ({ ...p, isHandcuffed: true }));
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

    // 2. Delay for lift up
    await wait(600);

    const nextShell = gameState.chamber[gameState.currentShellIndex];

    if (user === 'PLAYER') {
        setKnownShell(nextShell);
        addLog(`IT IS ${nextShell}`, 'info');
        // Clear after 2 seconds
        setTimeout(() => setKnownShell(null), 2000);
        await wait(1000);
    } else {
        // Dealer uses it: AI logic knows the shell, but we DO NOT show it to player
        addLog(`DEALER INSPECTS CHAMBER`, 'dealer');
        await wait(1500);
        addLog(`DEALER INSPECTS CHAMBER`, 'dealer');
        await wait(1500);
    }
};

export const handlePhone = async (
    user: TurnOwner,
    gameState: GameState,
    setTriggerPhone: StateSetter<number>,
    addLog: (text: string, type: LogEntry['type']) => void
) => {
    setTriggerPhone(p => p + 1);
    await wait(1000);

    const checkLimit = gameState.chamber.length;
    const current = gameState.currentShellIndex;

    // Logic: Reveal a random shell from future rounds.
    // If only 1 shell left (the current one), phone is useless or just mysterious.
    // User requested "shouldnt tell somethings wrong when <= 2 bullet".
    // I interpret: If total shells <= 2... wait, maybe they mean distinct bullets.
    // Standard: Look ahead.

    // Logic: Skip CURRENT (0) and NEXT (1). Start checking from current + 2.
    // If total shells < 3 (meaning 0, 1, or 2 remaining), it fails.

    const available = [];
    // Start loop from current + 2
    for (let i = current + 2; i < checkLimit; i++) {
        available.push(i);
    }

    if (available.length === 0) {
        if (user === 'PLAYER') {
            addLog("YOU ARE ON YOUR OWN BUD", 'neutral');
        } else {
            addLog("DEALER CHECKS PHONE", 'dealer');
        }
    } else {
        const randomIndex = available[Math.floor(Math.random() * available.length)];
        const shell = gameState.chamber[randomIndex];
        // Calculate offset relative to current. 
        // if index = current + 2, offset is 2. (The "3rd shell" in the sequence considering current is 1st)
        // Wait, "2nd shell" usually implies the one after current.
        // Let's stick to explicit ordering:
        // current (0) -> next (1) -> 3rd (2) -> 4th (3)
        // Ideally we say "3rd shell is..."

        const offset = randomIndex - current; // e.g. 2, 3, 4

        let positionText = "";
        // offset 1 is "NEXT SHELL" (Skipped now)
        if (offset === 2) positionText = "3RD SHELL";
        else if (offset === 3) positionText = "4TH SHELL";
        else if (offset === 4) positionText = "5TH SHELL";
        else positionText = `${offset + 1}TH SHELL`; // 0-indexed offset + 1 for human ordinal? 
        // No, offset is distance. 
        // current is #1. current+1 is #2. current+2 is #3.
        // So offset=2 is indeed 3rd shell.

        if (user === 'PLAYER') {
            addLog(`${positionText} IS ${shell}`, 'info');
        } else {
            addLog(`DEALER USES PHONE`, 'dealer');
        }
    }
    await wait(1000);
    await wait(1000);
};

export const handleInverter = async (
    user: TurnOwner,
    gameState: GameState,
    setGameState: StateSetter<GameState>,
    setTriggerInverter: StateSetter<number>,
    addLog: (text: string, type: LogEntry['type']) => void
) => {
    setTriggerInverter(p => p + 1);
    await wait(600); // Wait for anim

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
    // Maybe hidden text for dealer? But polarity inversion is usually public knowledge that it happened. 
    // The result (what it is NOW) is implicitly known if you knew what it was before, but often treated as "Changed current shell".
    await wait(800);
};

export const handleAdrenaline = async (
    user: TurnOwner,
    setTriggerAdrenaline: StateSetter<number>,
    setGameState: StateSetter<GameState>,
    addLog: (text: string, type: LogEntry['type']) => void
) => {
    setTriggerAdrenaline(p => p + 1);
    await wait(1000); // Inject animation

    if (user === 'PLAYER') {
        addLog("ADRENALINE RUSH! STEAL AN ITEM", 'info');
        setGameState(prev => ({ ...prev, phase: 'STEALING' }));
    } else {
        // Dealer Logic (simplified for now: Dealer just uses it to... heal? or steal?)
        // Implementing Dealer AI stealing is complex. For now, Dealer might skip Adrenaline or use it to heal 1 HP if we wanted.
        // Or steal a specific item.
        addLog("DEALER IS HYPED", 'dealer');
        // Dealer steals a random item from player if available
        // Return a signal or handle it here? simpler to handle here if we had access to stealItem/setPlayer
        // Since we don't have setPlayer, we need to signal the hook via phase or a new callback.
        // But for now, let's just make dealer purely visual or skip.
        // WAIT: User asked to "update dealerlogic for all new items". 
        // We will make the Dealer Logic in useGameLogic handle the stealing decision, 
        // this action function simply triggers the visuals/state.
        // But for Adrenaline, the Player sets phase to STEALING.
        // For Dealer, we should probably set phase to 'DEALER_STEAL_ANIM'? Or let AI logic handle it.
        // Let's assume AI logic handles the actual theft data manipulation.
    }
};