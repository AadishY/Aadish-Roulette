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
                    await wait(1800); // Initial thinking pause - more deliberate

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
                        // Maximize damage
                        if (!itemToUse && dealer.items.includes('SAW') && !dealer.isSawedActive && player.hp > 1) {
                            itemIndex = dealer.items.indexOf('SAW');
                            itemToUse = 'SAW';
                        }
                        // Lock player
                        if (!itemToUse && dealer.items.includes('CUFFS') && !player.isHandcuffed) {
                            itemIndex = dealer.items.indexOf('CUFFS');
                            itemToUse = 'CUFFS';
                        }
                    }

                    // 2. KNOWS NEXT IS BLANK
                    if (currentKnowledge === 'BLANK') {
                        // Just shoot self, no items needed usually.
                        // UNLESS we want to cycle faster? Nah, save items.
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
                        // 50/50 or worse odds -> Beer to cycle
                        else if (!itemToUse && dealer.items.includes('BEER') && liveProb <= 0.5 && total > 1) {
                            itemIndex = dealer.items.indexOf('BEER');
                            itemToUse = 'BEER';
                        }
                        // High probability of live -> Aggressive Cuffs
                        else if (!itemToUse && dealer.items.includes('CUFFS') && !player.isHandcuffed && liveProb >= 0.5) {
                            itemIndex = dealer.items.indexOf('CUFFS');
                            itemToUse = 'CUFFS';
                        }
                    }

                    // 5. PHONE (Gain Future Knowledge)
                    if (!itemToUse && dealer.items.includes('PHONE') && !currentKnowledge && total > 2) {
                        itemIndex = dealer.items.indexOf('PHONE');
                        itemToUse = 'PHONE';
                    }

                    // 6. INVERTER (Tactical Flip)
                    // If we know it's blank, invert to Live to shoot player.
                    if (!itemToUse && dealer.items.includes('INVERTER')) {
                        if (currentKnowledge === 'BLANK') {
                            itemIndex = dealer.items.indexOf('INVERTER');
                            itemToUse = 'INVERTER';
                        }
                        // Or if 50/50 but we want to confirm a shot? No, Inverter is best used when we KNOW it's bad.
                    }

                    // 7. ADRENALINE (Steal)
                    // If player has something good or dealer is desperate.
                    if (!itemToUse && dealer.items.includes('ADRENALINE')) {
                        // Simple logic: Use it if player has items and dealer has < 4 items
                        if (player.items.length > 0 && dealer.items.length < 4) {
                            itemIndex = dealer.items.indexOf('ADRENALINE');
                            itemToUse = 'ADRENALINE';
                        }
                    }

                    // 8. SAW FALLBACK (High confidence)
                    if (!itemToUse && dealer.items.includes('SAW') && !dealer.isSawedActive && liveProb > 0.6) {
                        itemIndex = dealer.items.indexOf('SAW');
                        itemToUse = 'SAW';
                    }

                    // 9. CIGS if has plenty
                    if (!itemToUse && dealer.items.includes('CIGS') && dealer.hp < dealer.maxHp) {
                        const cigCount = dealer.items.filter(i => i === 'CIGS').length;
                        if (cigCount > 1 || dealer.hp < 2) {
                            itemIndex = dealer.items.indexOf('CIGS');
                            itemToUse = 'CIGS';
                        }
                    }

                    // --- EXECUTE ITEM ---
                    if (itemToUse) {
                        setDealer(d => ({ ...d, items: d.items.filter((_, i) => i !== itemIndex) }));


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

                        // Handling Adrenaline effect for Dealer:
                        // Dealer used Adrenaline, wait for animation, then steal logic.
                        if (itemToUse === 'ADRENALINE') {
                            await wait(500); // Sync with animation
                            // Check if player has items to steal
                            if (player.items.length > 0) {
                                // Dynamic Priority Stealing Logic
                                let priorities: ItemType[] = ['PHONE', 'INVERTER', 'GLASS', 'SAW', 'CUFFS', 'BEER', 'CIGS'];

                                // 1. Health Critical: Prioritize CIGS
                                if (dealer.hp < 3) {
                                    priorities = ['CIGS', ...priorities.filter(i => i !== 'CIGS')];
                                }

                                // 2. Select item
                                let stealIdx = -1;

                                for (const pItem of priorities) {
                                    // Check if Player has it
                                    const idx = player.items.indexOf(pItem);
                                    if (idx === -1) continue;

                                    // Check if Dealer already has it (Move to next priority if duplicate)
                                    // Exception: CIGS when low HP (always take more)
                                    const dealerHasIt = dealer.items.includes(pItem);
                                    if (dealerHasIt) {
                                        if (pItem === 'CIGS' && dealer.hp < 3) {
                                            // Take it anyway
                                        } else {
                                            continue; // Skip, look for something I don't have
                                        }
                                    }

                                    stealIdx = idx;
                                    break;
                                }

                                // Fallback: Take highest priority available even if duplicate
                                if (stealIdx === -1) {
                                    for (const pItem of priorities) {
                                        const idx = player.items.indexOf(pItem);
                                        if (idx !== -1) {
                                            stealIdx = idx;
                                            break;
                                        }
                                    }
                                }

                                // Last resort: Pick first non-ADRENALINE item
                                if (stealIdx === -1) {
                                    for (let i = 0; i < player.items.length; i++) {
                                        if (player.items[i] !== 'ADRENALINE') {
                                            stealIdx = i;
                                            break;
                                        }
                                    }
                                }

                                // If only adrenaline left, can't steal anything
                                if (stealIdx === -1) {
                                    if (setOverlayText) {
                                        setOverlayText("NO STEALABLE ITEMS!");
                                        setTimeout(() => setOverlayText?.(null), 1500);
                                    }
                                    // Continue to next action
                                } else {
                                    const stolenItem = player.items[stealIdx];

                                    // Show steal message
                                    if (setOverlayText) {
                                        setOverlayText(`🎯 DEALER STOLE ${stolenItem}!`);
                                        setTimeout(() => setOverlayText?.(null), 2000);
                                    }

                                    // Remove from player
                                    setPlayer(p => {
                                        const newItems = [...p.items];
                                        newItems.splice(stealIdx, 1);
                                        return { ...p, items: newItems };
                                    });

                                    await wait(1500); // Wait for steal message to be visible
                                    await processItemEffect('DEALER', stolenItem);
                                    await wait(500); // Post-effect sync
                                }
                            }
                        }

                        await wait(1800); // Post-item action pause

                        if (!roundEnded) {
                            await wait(1000); // Pause before next action
                            isAITurnInProgress.current = false;
                            setAiTick(t => t + 1); // Rerun logic
                        } else {
                            aiKnownShell.current = null;
                        }
                        return;
                    }

                    // --- SHOOT ---
                    // Phase 1: Pick up gun (show dealer preparing)
                    await wait(1000); // Initial pause
                    setTargetAim('IDLE'); // Gun at ready position first
                    await wait(1200); // Let gun move to ready position

                    let target: TurnOwner = 'PLAYER';

                    // Decision
                    if (currentKnowledge === 'LIVE') target = 'PLAYER';
                    else if (currentKnowledge === 'BLANK') target = 'DEALER';
                    else {
                        // Probabilistic approach with slight hesitation
                        await wait(600); // Extra thinking time when uncertain
                        if (liveProb >= 0.5) target = 'PLAYER'; // Aggressive
                        else target = 'DEALER'; // Play safe
                    }

                    // Phase 2: Aim at target (dramatic pause)
                    setTargetAim(target === 'PLAYER' ? 'OPPONENT' : 'SELF');
                    await wait(1800); // Let gun smoothly move to aim position

                    // Phase 3: Fire
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