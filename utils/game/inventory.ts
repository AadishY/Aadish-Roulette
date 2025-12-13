import React from 'react';
import { GameState, PlayerState, ItemType } from '../../types';
import { wait, randomInt } from '../gameUtils';
import { MAX_ITEMS } from '../../constants';

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

// From useGameLogic
const getRandomItem = (): ItemType => {
    // BEER: 20%
    // CIGS: 14%
    // GLASS: 12%
    // CUFFS: 14%
    // PHONE: 16%
    // SAW: 10%
    // INVERTER: 16%
    // ADRENALINE: 10%
    // Total Weight: 112

    const r = Math.random() * 112;
    if (r < 20) return 'BEER';
    if (r < 34) return 'CIGS';
    if (r < 46) return 'GLASS';
    if (r < 60) return 'CUFFS';
    if (r < 76) return 'PHONE';
    if (r < 86) return 'SAW';
    if (r < 102) return 'INVERTER';
    return 'ADRENALINE';
};

export const distributeItems = async (
    forceClear: boolean,
    gameState: GameState,
    setPlayer: StateSetter<PlayerState>,
    setDealer: StateSetter<PlayerState>,
    setGameState: StateSetter<GameState>,
    setReceivedItems: StateSetter<ItemType[]>,
    setShowLootOverlay: StateSetter<boolean>
) => {
    // If forceClear, ensure items are cleared FIRST before anything else
    if (forceClear) {
        setPlayer(p => ({ ...p, items: [] }));
        setDealer(d => ({ ...d, items: [] }));
        await wait(50); // Small delay to ensure state is flushed
    }

    // Generate items based on round count
    // Rounds 1-3: 2 items, Rounds 4-9: 3 items, Rounds 10+: 4 items
    const roundNum = forceClear ? 1 : gameState.roundCount + 1;

    let amount = 2; // Default start with 2 items
    if (roundNum >= 10) amount = 4;
    else if (roundNum >= 4) amount = 3;
    else amount = 2;

    const generateLoot = () => {
        return Array(amount).fill(null).map(() => getRandomItem());
    };

    // Generate BOTH loot pools at the same time
    const pNew = generateLoot();
    const dNew = generateLoot();

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
