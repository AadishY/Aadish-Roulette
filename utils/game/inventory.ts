import React from 'react';
import { GameState, PlayerState, ItemType } from '../../types';
import { wait, randomInt } from '../gameUtils';
import { MAX_ITEMS } from '../../constants';

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

// From useGameLogic
// Adjusted for Hard Mode support
const getRandomItem = (isHardMode: boolean = false, isDealer: boolean = false): ItemType => {
    // PLAYER SPECIFIC CONTRACT LOGIC
    // Normal: 10%, Hard: 7%
    if (!isDealer) {
        if (isHardMode && Math.random() < 0.07) return 'CONTRACT';
        if (!isHardMode && Math.random() < 0.10) return 'CONTRACT';
    }

    // Standard Items (Re-normalized probabilities excluding Contract)
    const r = Math.random() * 100;

    if (isHardMode) {
        // Hard Mode Distribution
        if (r < 18) return 'BEER';
        if (r < 23) return 'CIGS';
        if (r < 33) return 'GLASS';
        if (r < 43) return 'CUFFS';
        if (r < 59) return 'PHONE';
        if (r < 69) return 'SAW';
        if (r < 78) return 'INVERTER';
        if (r < 87) return 'ADRENALINE';
        if (r < 91) return 'CHOKE';
        if (r < 95) return 'BIG_INVERTER';
        return 'ADRENALINE'; // Fallback
    } else {
        // Normal Mode Distribution
        if (r < 15) return 'BEER';
        if (r < 28) return 'CIGS';
        if (r < 38) return 'GLASS';
        if (r < 48) return 'CUFFS';
        if (r < 60) return 'PHONE';
        if (r < 70) return 'SAW';
        if (r < 80) return 'INVERTER';
        if (r < 88) return 'ADRENALINE';
        if (r < 94) return 'CHOKE';
        return 'BIG_INVERTER';
    }
};

// ... (getDealerCheatingItem kept same)

const getDealerCheatingItem = (hp: number): ItemType => {
    const r = Math.random();

    // LOW HEALTH PANIC MODE (<= 2 HP)
    // He wants to SURVIVE.
    // Contract is suicide here, avoid it.
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
    // CONTRACT REMOVED FOR DEALER
    return 'ADRENALINE';                // 10% steal
};

export const getContractLoot = (): ItemType[] => {
    // Weighted Pool based on Request: High Tier (50%) vs Others (10%)
    // High Tier (Weight 5): CHOKE, CIGS, SAW, GLASS
    // Low Tier (Weight 1): BEER, CUFFS, PHONE, INVERTER, ADRENALINE, REMOTE, BIG_INVERTER

    const highTier: ItemType[] = ['CHOKE', 'CIGS', 'SAW', 'GLASS', 'ADRENALINE'];
    const lowTier: ItemType[] = ['BEER', 'PHONE', 'INVERTER', 'BIG_INVERTER', 'CUFFS'];

    const weightedPool: ItemType[] = [];

    // Add High Tier (5x weight)
    highTier.forEach(item => {
        for (let i = 0; i < 5; i++) weightedPool.push(item);
    });

    // Add Low Tier (1x weight)
    lowTier.forEach(item => {
        weightedPool.push(item);
    });

    // Pick 2 random items from weighted pool
    const item1 = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    const item2 = weightedPool[Math.floor(Math.random() * weightedPool.length)];

    return [item1, item2];
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
                    candidate = getRandomItem(gameState.isHardMode, forDealer);
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
                else item = getRandomItem(gameState.isHardMode, forDealer);
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
