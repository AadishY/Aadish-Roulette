import React, { useEffect, useRef, useState } from 'react';
import { GameState, PlayerState, ShellType, ItemType, TurnOwner, AimTarget, CameraView, AnimationState } from '../types';
import { wait } from '../utils/gameUtils';

interface DealerAIProps {
    gameState: GameState;
    dealer: PlayerState;
    player: PlayerState;
    knownShell: ShellType | null;
    animState: AnimationState; // Added for recovery state checking
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
    animState,
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
    // AI Memory: Map<shellIndex, type> - Tracks specifically known shells (from Glass, Phone, etc.)
    const aiMemory = useRef<Map<number, ShellType>>(new Map());
    const [aiTick, setAiTick] = useState(0);

    // Reset memory on new round load
    useEffect(() => {
        if (gameState.phase === 'LOAD') {
            aiMemory.current.clear();
        }
    }, [gameState.phase]);

    // Use a ref to track current animState so the async loop sees the latest values
    const animStateRef = useRef(animState);
    useEffect(() => {
        animStateRef.current = animState;
    }, [animState]);

    useEffect(() => {
        if (isMultiplayer) return;

        if (gameState.phase === 'DEALER_TURN' && !isAITurnInProgress.current) {
            isAITurnInProgress.current = true;
            // setTargetAim('IDLE'); // Stick to current aim until ready
            setCameraView('PLAYER'); // Force camera to look at Dealer

            const runAITurn = async () => {
                try {
                    // 1. WAIT FOR PLAYER RECOVERY - Dealer waits if player is knocked down/recovering
                    let waitCount = 0;
                    while ((animStateRef.current.playerHit || animStateRef.current.playerRecovering) && waitCount < 30) {
                        await wait(500); // Check every 500ms
                        waitCount++;
                    }

                    await wait(800 + Math.random() * 600); // Organic thinking pause

                    // --- STATE ANALYSIS ---
                    const currentIdx = gameState.currentShellIndex;
                    const chamber = gameState.chamber;
                    const totalRemaining = chamber.length - currentIdx;

                    // Re-scan memory validity (remove old indices)
                    for (const k of aiMemory.current.keys()) {
                        if (k < currentIdx) aiMemory.current.delete(k);
                    }

                    // Calculate Probabilities
                    let knownLive = 0;
                    let knownBlank = 0;
                    let knownIndices = new Set<number>();

                    // Sum up what we know from memory within remaining range
                    for (let i = currentIdx; i < chamber.length; i++) {
                        if (aiMemory.current.has(i)) {
                            knownIndices.add(i);
                            if (aiMemory.current.get(i) === 'LIVE') knownLive++;
                            else knownBlank++;
                        }
                    }

                    // Global stats (AI knows the total counts like player)
                    const totalLive = gameState.liveCount;
                    const totalBlank = gameState.blankCount;

                    // Unknown stats
                    const unknownLive = Math.max(0, totalLive - knownLive);
                    const unknownTotal = Math.max(0, totalRemaining - knownIndices.size);

                    const unknownLiveProb = unknownTotal > 0 ? unknownLive / unknownTotal : 0;

                    // Determine status of CURRENT shell
                    let currentKnown = aiMemory.current.get(currentIdx);
                    // Also use user-provided knownShell prop if passed (e.g. from Glass used by player? No, dealer doesn't see that usually, but if global)
                    if (knownShell && !currentKnown) currentKnown = knownShell;

                    // Probability of current being LIVE
                    const currentLiveProb = currentKnown ? (currentKnown === 'LIVE' ? 1.0 : 0.0) : unknownLiveProb;

                    let itemToUse: ItemType | null = null;
                    let itemIndex = -1;

                    // --- ADVANCED ITEM STRATEGY (IMPROVED) ---
                    // Priority: Survival > Guaranteed Kill > Intel > Risky Plays

                    // 1. HEAL IF CRITICAL (HP <= 2)
                    if (dealer.hp <= 2 && dealer.items.includes('CIGS')) {
                        itemToUse = 'CIGS';
                    }

                    // 2. SAW (Aggressive finish)
                    // If we know it's live (or high chance), and player is not 1HP (waste), use saw.
                    else if (dealer.items.includes('SAW') && !dealer.isSawedActive && !itemToUse && player.hp > 1) {
                        if (currentLiveProb >= 0.60 || currentKnown === 'LIVE') {
                            itemToUse = 'SAW';
                        }
                    }

                    // 3. HANDCUFFS (Lockdown)
                    // If high chance of live, cuff them to chain turns.
                    else if (dealer.items.includes('CUFFS') && !player.isHandcuffed && !itemToUse) {
                        if (currentLiveProb >= 0.60) {
                            itemToUse = 'CUFFS';
                        }
                    }

                    // 4. USE MEMORY / GLASS
                    else if (!currentKnown && dealer.items.includes('GLASS') && totalRemaining > 1) {
                        itemToUse = 'GLASS';
                    }

                    // 5. PHONE INTEL
                    else if (totalRemaining >= 3 && dealer.items.includes('PHONE') && unknownTotal > 1 && !itemToUse) {
                        itemToUse = 'PHONE';
                    }

                    // 6. INVERTER (Strategic Flip)
                    else if (dealer.items.includes('INVERTER') && !itemToUse) {
                        // If KNOWN BLANK -> Make LIVE to shoot player
                        if (currentKnown === 'BLANK') {
                            itemToUse = 'INVERTER';
                        }
                        // If Unknown but stats say mostly blanks (Live Prob < 40%) -> Flip to make it likely Live
                        else if (!currentKnown && currentLiveProb < 0.40 && totalRemaining > 1) {
                            itemToUse = 'INVERTER';
                        }
                    }

                    // 7. BEER (Ejection)
                    else if (dealer.items.includes('BEER') && !itemToUse) {
                        // Eject specific shell if we want to dig
                        if (currentKnown === 'BLANK') {
                            itemToUse = 'BEER';
                        }
                        // If we have many items but don't know this shell, and it's likely blank, eject it.
                        else if (!currentKnown && currentLiveProb < 0.50 && totalRemaining > 1) {
                            // Only eject if we aren't desperate for a shot (e.g. if LiveProb is 40%, better to beer than shoot self?)
                            // Actually, lighter logic:
                            itemToUse = 'BEER';
                        }
                    }

                    // 8. ADRENALINE (Steal)
                    else if (dealer.items.includes('ADRENALINE') && !itemToUse) {
                        if (player.items.length > 0) {
                            itemToUse = 'ADRENALINE';
                        }
                    }

                    // 9. TOP OFF HEALTH (If surplus)
                    else if (dealer.items.includes('CIGS') && dealer.hp < dealer.maxHp && !itemToUse) {
                        itemToUse = 'CIGS';
                    }

                    // --- EXECUTE ITEM OR SHOOT ---

                    if (itemToUse) {
                        itemIndex = dealer.items.indexOf(itemToUse);
                        setDealer(d => ({ ...d, items: d.items.filter((_, i) => i !== itemIndex) }));

                        // --- LOGIC INTEGRATION ---
                        // Update Memory *before* action resolves to simulate knowledge
                        if (itemToUse === 'GLASS') {
                            aiMemory.current.set(currentIdx, chamber[currentIdx]);
                        }
                        if (itemToUse === 'BEER') {
                            // Ejecting current, remove from memory
                            aiMemory.current.delete(currentIdx);
                        }
                        if (itemToUse === 'INVERTER') {
                            const actual = chamber[currentIdx];
                            const inverted = actual === 'LIVE' ? 'BLANK' : 'LIVE';
                            // Manual update because game state update is async
                            aiMemory.current.set(currentIdx, inverted);
                        }
                        if (itemToUse === 'PHONE') {
                            // "Cheat": Peek at a random future shell
                            const futureIndices = [];
                            for (let i = currentIdx + 1; i < chamber.length; i++) futureIndices.push(i);
                            if (futureIndices.length > 0) {
                                const peekIdx = futureIndices[Math.floor(Math.random() * futureIndices.length)];
                                // 90% chance to remember correctly (simulating 'reading' the phone)
                                if (Math.random() < 0.9) {
                                    aiMemory.current.set(peekIdx, chamber[peekIdx]);
                                }
                            }
                        }

                        // Call Game Logic
                        const roundEnded = await processItemEffect('DEALER', itemToUse);

                        // Handle Adrenaline Steal specially
                        if (itemToUse === 'ADRENALINE') {
                            await wait(500);
                            let stealIdx = -1;
                            // Priority List
                            const priorities: ItemType[] = ['SAW', 'INVERTER', 'CUFFS', 'PHONE', 'GLASS', 'CIGS', 'BEER'];
                            // Adjust priority based on state
                            let activePriorities = priorities;
                            if (dealer.hp < 2) activePriorities = ['CIGS', 'ADRENALINE', ...priorities];

                            for (const pItem of activePriorities) {
                                const idx = player.items.indexOf(pItem as ItemType);
                                if (idx !== -1) {
                                    stealIdx = idx;
                                    break;
                                }
                            }
                            // Fallback
                            if (stealIdx === -1 && player.items.length > 0) stealIdx = 0;

                            if (stealIdx !== -1) {
                                const stolen = player.items[stealIdx];
                                setPlayer(p => {
                                    const ni = [...p.items];
                                    ni.splice(stealIdx, 1);
                                    return { ...p, items: ni };
                                });
                                // Show overlay
                                if (setOverlayText) {
                                    setOverlayText(`DEALER STOLE ${stolen}`);
                                    setTimeout(() => setOverlayText?.(null), 1500);
                                }
                                await wait(1000);

                                // Use if valid
                                if (stolen !== 'ADRENALINE') {
                                    // Memory updates for stolen items
                                    if (stolen === 'GLASS') aiMemory.current.set(currentIdx, chamber[currentIdx]);
                                    if (stolen === 'INVERTER') {
                                        const actual = chamber[currentIdx];
                                        aiMemory.current.set(currentIdx, actual === 'LIVE' ? 'BLANK' : 'LIVE');
                                    }
                                    await processItemEffect('DEALER', stolen);
                                }
                            } else {
                                if (setOverlayText) {
                                    setOverlayText("NOTHING TO STEAL");
                                    setTimeout(() => setOverlayText?.(null), 1000);
                                }
                            }
                        }

                        await wait(600);
                        if (!roundEnded) {
                            setAiTick(t => t + 1); // Continue turn
                        } else {
                            aiMemory.current.clear(); // Clear memory on round end
                        }
                        isAITurnInProgress.current = false;
                        return;
                    }

                    // --- SHOOTING DECISION ---
                    await wait(500); // Pickup
                    setTargetAim('IDLE');
                    await wait(600);

                    // Re-evaluate current shell status after items
                    currentKnown = aiMemory.current.get(currentIdx);
                    // Update probability if we just inverted it
                    const finalLiveProb = currentKnown ? (currentKnown === 'LIVE' ? 1.0 : 0.0) : unknownLiveProb;

                    let target: TurnOwner = 'PLAYER';

                    // 1. KNOWN LIVE -> SHOOT PLAYER
                    if (finalLiveProb === 1.0) target = 'PLAYER';

                    // 2. KNOWN BLANK -> SHOOT SELF (Free Turn)
                    else if (finalLiveProb === 0.0) target = 'DEALER';

                    // 3. UNKNOWN -> PROBABILITY CHECK (Optimized)
                    else {
                        // If chance is > 50% (or equal), calculate expected value dictates shooting opponent is better or equal
                        // But we want to be slightly careful? No, dealers are killers.
                        if (finalLiveProb >= 0.50) target = 'PLAYER';
                        // If < 50%, shoot self to cycle to next shell
                        else target = 'DEALER';
                    }

                    setTargetAim(target === 'PLAYER' ? 'OPPONENT' : 'SELF');
                    await wait(1000);

                    // Fire
                    aiMemory.current.delete(currentIdx); // Consumed
                    await fireShot('DEALER', target);

                } catch (e) {
                    console.error("Dealer AI Error:", e);
                } finally {
                    isAITurnInProgress.current = false;
                }
            };
            runAITurn();
        }
    }, [gameState.phase, aiTick, gameState.turnOwner]);
};