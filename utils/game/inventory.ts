import React from 'react';
import { GameState, PlayerState, ItemType } from '../../types';
import { wait, randomInt } from '../gameUtils';
import { MAX_ITEMS } from '../../constants';

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

// From useGameLogic
// Adjusted for Hard Mode support
const getRandomItem = (isHardMode: boolean = false): ItemType => {
    if (isHardMode) {
        // Hard Mode (Total: 108)
        const r = Math.random() * 108;
        if (r < 20) return 'BEER';
        if (r < 26) return 'CIGS';
        if (r < 38) return 'GLASS';
        if (r < 50) return 'CUFFS';
        if (r < 68) return 'PHONE';
        if (r < 80) return 'SAW';
        if (r < 90) return 'INVERTER';
        if (r < 100) return 'ADRENALINE';
        if (r < 104) return 'CHOKE';
        return 'BIG_INVERTER';
    } else {
        // Normal Mode (Total: 145)
        const r = Math.random() * 145;
        if (r < 20) return 'BEER';
        if (r < 38) return 'CIGS';
        if (r < 52) return 'GLASS';
        if (r < 67) return 'CUFFS';
        if (r < 85) return 'PHONE';
        if (r < 97) return 'SAW';
        if (r < 111) return 'INVERTER';
        if (r < 125) return 'ADRENALINE';
        if (r < 135) return 'CHOKE';
        return 'BIG_INVERTER';
    }
};

const getDealerCheatingItem = (hp: number): ItemType => {
    const r = Math.random();

    // LOW HEALTH PANIC MODE (<= 2 HP)
    // He wants to SURVIVE.
    if (hp <= 2) {
        if (r < 0.40) return 'CIGS';        // 40% Heal
        if (r < 0.60) return 'BEER';        // 20% Skip current shell
        if (r < 0.70) return 'ADRENALINE';  // 10% Steal Cigs
        if (r < 0.80) return 'CUFFS';       // 10% Stop player
        if (r < 0.90) return 'SAW';         // 10% Desperation Damage
        return 'CHOKE';                     // 10% Desperation Damage
    }

    // AGGRESSIVE MODE (> 2 HP)
    // He wants to KILL.
    if (r < 0.25) return 'SAW';         // 25% double damage
    if (r < 0.50) return 'CHOKE';       // 25% huge damage/skip
    if (r < 0.65) return 'GLASS';       // 15% intel
    if (r < 0.75) return 'CUFFS';       // 10% control
    if (r < 0.85) return 'INVERTER';    // 10% manipulation
    if (r < 0.90) return 'BIG_INVERTER';// 5% chaos
    if (r < 0.95) return 'PHONE';       // 5% intel
    return 'ADRENALINE';                // 5% steal
};

export const distributeItems = async (
    forceClear: boolean,
    gameState: GameState,
    setPlayer: StateSetter<PlayerState>,
    setDealer: StateSetter<PlayerState>,
    setGameState: StateSetter<GameState>,
    setReceivedItems: StateSetter<ItemType[]>,
    setShowLootOverlay: StateSetter<boolean>,
    dealerHp: number = 2 // Default to 2 if not provided
) => {
    // If forceClear, ensure items are cleared FIRST before anything else
    if (forceClear) {
        setPlayer(p => ({ ...p, items: [] }));
        setDealer(d => ({ ...d, items: [] }));
        await wait(50); // Small delay to ensure state is flushed
    }

    // Generate items based on round count
    let amount = 2;

    if (gameState.isHardMode) {
        // HARD MODE LOGIC
        const currentStage = gameState.hardModeState?.round || 1;
        if (currentStage === 1) amount = 2;
        else if (currentStage === 2) amount = 2;
        else if (currentStage === 3) amount = randomInt(1, 4);
        else amount = 4;
    } else {
        // NORMAL MODE LOGIC
        const roundNum = forceClear ? 1 : gameState.roundCount + 1;
        if (roundNum >= 10) amount = 4;
        else if (roundNum >= 4) amount = 3;
        else amount = 2;
    }

    const generateLoot = (forDealer: boolean) => {
        const batch: ItemType[] = [];
        const counts: Record<string, number> = {};

        for (let i = 0; i < amount; i++) {
            let item: ItemType | null = null;
            let tries = 0;

            // Soft duplicate limit: Max 2 of same item per batch
            do {
                let candidate: ItemType;

                if (forDealer && gameState.isHardMode) {
                    // CHEATING LOGIC FOR DEALER IN HARD MODE
                    candidate = getDealerCheatingItem(dealerHp);
                } else {
                    // Standard Logic
                    candidate = getRandomItem(gameState.isHardMode);
                }

                const currentCount = counts[candidate] || 0;

                if (currentCount < 2) {
                    item = candidate;
                }
                tries++;
            } while (!item && tries < 15);

            // Fallback if random keeps giving same item
            if (!item) {
                if (forDealer && gameState.isHardMode) item = getDealerCheatingItem(dealerHp);
                else item = getRandomItem(gameState.isHardMode);
            }

            batch.push(item);
            counts[item] = (counts[item] || 0) + 1;
        }
        return batch;
    };

    // Generate loot pools separately
    const pNew = generateLoot(false); // Player uses standard random
    const dNew = generateLoot(true);  // Dealer uses Cheating AI if Hard Mode

    // SAFETY: Clear any previous overlay state explicitely before showing new
    setShowLootOverlay(false);
    setReceivedItems([]);
    await wait(200); // Increased wait to ensure UI unmounts completely

    // Show NEW items in overlay - ONLY SHOW PLAYER ITEMS
    setGameState(prev => ({ ...prev, phase: 'LOOTING' }));
    setReceivedItems([...pNew]); // Use spread to ensure new array reference

    // Tiny delay to allow React to render the items in state before showing overlay
    // preventing "empty" or "old" flash
    await wait(50);

    setShowLootOverlay(true);
    await wait(2500); // Allow time to see items (reduced for pacing)

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
