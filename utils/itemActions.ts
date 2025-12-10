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
    addLog: (text: string, type: LogEntry['type']) => void
) => {
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
    }
};