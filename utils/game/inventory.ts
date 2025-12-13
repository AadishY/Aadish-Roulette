import React from 'react';
import { GameState, PlayerState, ItemType } from '../../types';
import { wait, randomInt } from '../gameUtils';
import { MAX_ITEMS } from '../../constants';

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

// From useGameLogic
// Adjusted for Hard Mode support
const getRandomItem = (isHardMode: boolean = false): ItemType => {
    if (isHardMode) {
        // BEER: 20%, CIGS: 8%, GLASS: 12%, CUFFS: 10%, PHONE: 16%, SAW: 10%, INVERTER: 16%, ADRENALINE: 10%
        // Total: 102
        const r = Math.random() * 102;
        if (r < 20) return 'BEER';
        if (r < 28) return 'CIGS';
        if (r < 40) return 'GLASS';
        if (r < 50) return 'CUFFS';
        if (r < 66) return 'PHONE';
        if (r < 76) return 'SAW';
        if (r < 92) return 'INVERTER';
        return 'ADRENALINE';
    } else {
        // Normal Mode
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
    }
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
    let amount = 2;

    if (gameState.isHardMode) {
        // HARD MODE LOGIC
        // Round 1 (Batch 1? No, Round 1 of match): 2 items
        // Round 2: 3 items
        // Round 3: Random 1-4
        // Logic assumption: gameState.roundCount resets to 1 for each new Game Round in HM?
        // OR we track match round in hardModeState.
        // Let's assume gameState.hardModeState?.round is the source of truth for "Stage".

        // However, distributeItems is called with gameState. 
        // We need to know which STAGE we are in.
        // If forceClear is true, we are starting a new Stage (or batch 1 of stage?).
        // In Hard Mode, if we are in Stage 3, we always get 1-4 items per batch?
        // Prompt says "Round 3- 4 health and random no. of items between 1 to 4".

        const currentStage = gameState.hardModeState?.round || 1;

        if (currentStage === 1) amount = 2;
        else if (currentStage === 2) amount = 3;
        else if (currentStage === 3) amount = randomInt(1, 4);
        else amount = 4; // Fallback
    } else {
        // NORMAL MODE LOGIC
        // Rounds 1-3: 2 items, Rounds 4-9: 3 items, Rounds 10+: 4 items
        const roundNum = forceClear ? 1 : gameState.roundCount + 1;
        if (roundNum >= 10) amount = 4;
        else if (roundNum >= 4) amount = 3;
        else amount = 2;
    }

    const generateLoot = () => {
        const batch: ItemType[] = [];
        const counts: Record<string, number> = {};

        for (let i = 0; i < amount; i++) {
            let item: ItemType | null = null;
            let tries = 0;

            // Soft duplicate limit: Max 2 of same item per batch
            do {
                const candidate = getRandomItem(gameState.isHardMode);
                const currentCount = counts[candidate] || 0;

                if (currentCount < 2) {
                    item = candidate;
                }
                tries++;
            } while (!item && tries < 15);

            // Fallback if random keeps giving same item
            if (!item) item = getRandomItem(gameState.isHardMode);

            batch.push(item);
            counts[item] = (counts[item] || 0) + 1;
        }
        return batch;
    };

    // Generate BOTH loot pools at the same time
    const pNew = generateLoot();
    const dNew = generateLoot();

    // SAFETY: Clear any previous overlay state explicitely before showing new
    setShowLootOverlay(false);
    setReceivedItems([]);
    await wait(200); // Increased wait to ensure UI unmounts completely

    // Show NEW items in overlay
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
