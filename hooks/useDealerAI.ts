import React, { useEffect, useRef, useState } from 'react';
import { GameState, PlayerState, ShellType, ItemType, TurnOwner, AimTarget, CameraView } from '../types';
import { wait } from '../utils/gameUtils';

interface DealerAIProps {
    gameState: GameState;
    dealer: PlayerState;
    player: PlayerState;
    knownShell: ShellType | null;
    fireShot: (shooter: TurnOwner, target: TurnOwner) => Promise<void>;
    processItemEffect: (user: TurnOwner, item: ItemType) => Promise<boolean>;
    setDealer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setTargetAim: (aim: AimTarget) => void;
    setCameraView: (view: CameraView) => void;
    setOverlayText?: React.Dispatch<React.SetStateAction<string | null>>;
    isMultiplayer?: boolean; // Disable AI in multiplayer mode
}

export const useDealerAI = ({
    gameState,
    dealer,
    player,
    knownShell,
    fireShot,
    processItemEffect,
    setDealer,
    setPlayer,
    setTargetAim,
    setCameraView,
    setOverlayText,
    isMultiplayer = false
}: DealerAIProps) => {
    const isAITurnInProgress = useRef(false);
    const aiKnownShell = useRef<ShellType | null>(null); // Dealer's private memory
    const [aiTick, setAiTick] = useState(0);

    useEffect(() => {
        // Reset memory if chamber shuffled
        if (gameState.phase === 'LOAD') {
            aiKnownShell.current = null;
        }
    }, [gameState.phase]);

    useEffect(() => {
        // Skip AI logic if in multiplayer mode
        if (isMultiplayer) {
            return;
        }

        if (gameState.phase === 'DEALER_TURN' && !isAITurnInProgress.current) {
            isAITurnInProgress.current = true;
            setTargetAim('IDLE');
            setCameraView('PLAYER');

            const runAITurn = async () => {
                try {
                    await wait(800); // Faster thinking

                    const lives = gameState.liveCount;
                    const blanks = gameState.blankCount;
                    const total = lives + blanks;
                    const liveProb = total > 0 ? lives / total : 0;

                    let currentKnowledge = aiKnownShell.current;
                    if (knownShell) currentKnowledge = knownShell;

                    let itemToUse: ItemType | null = null;
                    let itemIndex = -1;

                    // --- STRATEGY PHASE ---

                    // 1. KNOWS NEXT IS LIVE
                    if (currentKnowledge === 'LIVE') {
                        // Maximize damage with SAW
                        if (!itemToUse && dealer.items.includes('SAW') && !dealer.isSawedActive && player.hp > 1) {
                            itemIndex = dealer.items.indexOf('SAW');
                            itemToUse = 'SAW';
                        }
                        // Lock player to keep turn
                        if (!itemToUse && dealer.items.includes('CUFFS') && !player.isHandcuffed) {
                            itemIndex = dealer.items.indexOf('CUFFS');
                            itemToUse = 'CUFFS';
                        }
                        // Invert LIVE to BLANK? Only if we want to shoot self for a free turn and maybe save the live for later?
                        // Generally better to shoot player with LIVE. But if Player has 1 HP and we have SAW, maybe overkill?
                        // Let's stick to shooting player with LIVE.
                    }

                    // 2. KNOWS NEXT IS BLANK
                    if (currentKnowledge === 'BLANK') {
                        // INVERTER: Turn BLANK into LIVE to shoot player
                        if (!itemToUse && dealer.items.includes('INVERTER')) {
                            itemIndex = dealer.items.indexOf('INVERTER');
                            itemToUse = 'INVERTER';
                        }
                        // Otherwise, will shoot self.
                    }

                    // 3. LOW HP PANIC
                    if (!itemToUse && dealer.hp < 2 && dealer.items.includes('CIGS')) {
                        itemIndex = dealer.items.indexOf('CIGS');
                        itemToUse = 'CIGS';
                    }

                    // 4. UNCERTAIN STATE
                    if (!currentKnowledge) {
                        // Gather Info
                        if (dealer.items.includes('GLASS') && total > 1) {
                            itemIndex = dealer.items.indexOf('GLASS');
                            itemToUse = 'GLASS';
                        }
                        // PHONE provides future info
                        else if (!itemToUse && dealer.items.includes('PHONE') && total > 2) {
                            itemIndex = dealer.items.indexOf('PHONE');
                            itemToUse = 'PHONE';
                        }
                        // Bad Odds -> Beer to cycle
                        else if (!itemToUse && dealer.items.includes('BEER') && liveProb < 0.5 && total > 1) {
                            itemIndex = dealer.items.indexOf('BEER');
                            itemToUse = 'BEER';
                        }
                    }

                    // 5. INVERTER (Tactical without knowledge)
                    // If probability is extremely skewed towards BLANK (e.g. 1 live 4 blank), invert "might" help, but risky.
                    // Better to use with knowledge.

                    // 6. ADRENALINE (Steal)
                    if (!itemToUse && dealer.items.includes('ADRENALINE')) {
                        // Steal if player has SAW or INVERTER or GLASS
                        if (player.items.some(i => ['SAW', 'INVERTER', 'GLASS', 'CUFFS'].includes(i)) && dealer.items.length < 4) {
                            itemIndex = dealer.items.indexOf('ADRENALINE');
                            itemToUse = 'ADRENALINE';
                        }
                        // Or if dealer is just bored (has many items)
                        else if (dealer.items.length >= 3 && player.items.length > 0) {
                            itemIndex = dealer.items.indexOf('ADRENALINE');
                            itemToUse = 'ADRENALINE';
                        }
                    }

                    // 7. CIGS if has surplus or not max HP
                    if (!itemToUse && dealer.items.includes('CIGS') && dealer.hp < dealer.maxHp) {
                        const cigCount = dealer.items.filter(i => i === 'CIGS').length;
                        // Use if mostly healthy but have extras, or if damaged
                        if (cigCount > 1 || dealer.hp <= 2) {
                            itemIndex = dealer.items.indexOf('CIGS');
                            itemToUse = 'CIGS';
                        }
                    }

                    // --- EXECUTE ITEM ---
                    if (itemToUse) {
                        setDealer(d => ({ ...d, items: d.items.filter((_, i) => i !== itemIndex) }));

                        // Update AI internal knowledge based on item used
                        if (itemToUse === 'GLASS') {
                            const actual = gameState.chamber[gameState.currentShellIndex];
                            aiKnownShell.current = actual;
                        }
                        if (itemToUse === 'BEER') {
                            aiKnownShell.current = null;
                        }
                        if (itemToUse === 'INVERTER') {
                            if (aiKnownShell.current === 'BLANK') aiKnownShell.current = 'LIVE';
                            else if (aiKnownShell.current === 'LIVE') aiKnownShell.current = 'BLANK';
                        }

                        const roundEnded = await processItemEffect('DEALER', itemToUse);

                        // Handling Adrenaline Steal Logic
                        if (itemToUse === 'ADRENALINE') {
                            await wait(500);
                            if (player.items.length > 0) {
                                let priorities: ItemType[] = ['SAW', 'INVERTER', 'CUFFS', 'PHONE', 'GLASS', 'BEER', 'CIGS'];
                                if (dealer.hp < 2) priorities = ['CIGS', ...priorities.filter(i => i !== 'CIGS')];

                                let stealIdx = -1;
                                // Find highest priority item player has
                                for (const pItem of priorities) {
                                    const idx = player.items.indexOf(pItem);
                                    if (idx !== -1) {
                                        // Avoid duplicates unless stackable/useful
                                        if (dealer.items.includes(pItem) && pItem !== 'CIGS' && pItem !== 'BEER') continue;
                                        stealIdx = idx;
                                        break;
                                    }
                                }
                                if (stealIdx === -1 && player.items.length > 0) stealIdx = 0; // Fallback to first available

                                if (stealIdx !== -1) {
                                    const stolenItem = player.items[stealIdx];
                                    if (stolenItem !== 'ADRENALINE') { // Double check safety
                                        if (setOverlayText) {
                                            setOverlayText(`🎯 DEALER STOLE ${stolenItem}!`);
                                            setTimeout(() => setOverlayText?.(null), 1500);
                                        }

                                        setPlayer(p => {
                                            const newItems = [...p.items];
                                            newItems.splice(stealIdx, 1);
                                            return { ...p, items: newItems };
                                        });

                                        await wait(1000);
                                        // Update memory if we stole info items? No, standard effect applies
                                        if (stolenItem === 'GLASS') {
                                            const actual = gameState.chamber[gameState.currentShellIndex];
                                            aiKnownShell.current = actual;
                                        }
                                        if (stolenItem === 'INVERTER') {
                                            if (aiKnownShell.current === 'BLANK') aiKnownShell.current = 'LIVE';
                                            else if (aiKnownShell.current === 'LIVE') aiKnownShell.current = 'BLANK';
                                        }

                                        await processItemEffect('DEALER', stolenItem);
                                        await wait(400);
                                    }
                                } else {
                                    if (setOverlayText) {
                                        setOverlayText("NO STEALABLE ITEMS!");
                                        setTimeout(() => setOverlayText?.(null), 1000);
                                    }
                                }
                            }
                        }

                        await wait(600); // Shorter post-item pause

                        if (!roundEnded) {
                            await wait(400); // Quick breath before next action
                            isAITurnInProgress.current = false;
                            setAiTick(t => t + 1); // Recycle logic
                        } else {
                            aiKnownShell.current = null;
                        }
                        return;
                    }

                    // --- SHOOT ---
                    await wait(500); // Pickup gun
                    setTargetAim('IDLE');
                    await wait(600); // Ready

                    let target: TurnOwner = 'PLAYER';

                    // Final Decision
                    if (currentKnowledge === 'LIVE') target = 'PLAYER';
                    else if (currentKnowledge === 'BLANK') target = 'DEALER'; // Free turn
                    else {
                        // Uncertain: Calculate odds
                        if (liveProb > 0.5) target = 'PLAYER';
                        else if (liveProb < 0.5) target = 'DEALER';
                        else target = Math.random() > 0.5 ? 'PLAYER' : 'DEALER'; // 50/50 Coin toss
                    }

                    // Aim
                    setTargetAim(target === 'PLAYER' ? 'OPPONENT' : 'SELF');
                    await wait(1000); // Faster aim

                    // Fire
                    aiKnownShell.current = null;
                    await fireShot('DEALER', target);

                } catch (e) {
                    console.error("AI Error", e);
                } finally {
                    isAITurnInProgress.current = false;
                }
            };

            runAITurn();
        }
    }, [
        gameState.phase,
        aiTick,
        gameState.currentShellIndex,
        gameState.turnOwner
    ]);
};