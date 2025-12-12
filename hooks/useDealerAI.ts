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

                    // --- ADVANCED ITEM STRATEGY ---
                    // Priority: Survival > Guaranteed Kill > Intel > Risky Plays

                    // 1. HEAL IF CRITICAL
                    if (dealer.hp <= 2 && dealer.items.includes('CIGS')) {
                        itemToUse = 'CIGS';
                    }

                    // 2. USE MEMORY / GLASS
                    else if (!currentKnown && dealer.items.includes('GLASS') && totalRemaining > 1) {
                        // Only use glass if we are truly blind on current shell
                        itemToUse = 'GLASS';
                    }

                    // 3. PHONE INTEL (If we have future shells to check)
                    else if (totalRemaining >= 3 && dealer.items.includes('PHONE') && unknownTotal > 1 && !itemToUse) {
                        // Use phone to peek ahead if we don't know much
                        itemToUse = 'PHONE';
                    }

                    // 4. BEER (Skipping)
                    else if (dealer.items.includes('BEER') && !itemToUse) {
                        // Skip if KNOWN BLANK (Why wait? eject it)
                        if (currentKnown === 'BLANK') {
                            itemToUse = 'BEER';
                        }
                        // Skip if Unknown and odds are bad (High chance of blank, or we just want to dig for live)
                        // If we have many lives left but current is likely blank
                        else if (!currentKnown && currentLiveProb < 0.45 && totalRemaining > 1) {
                            itemToUse = 'BEER';
                        }
                    }

                    // 5. INVERTER (Flipping Polarities)
                    else if (dealer.items.includes('INVERTER') && !itemToUse) {
                        // If KNOWN BLANK -> Make LIVE to shoot player
                        if (currentKnown === 'BLANK') {
                            itemToUse = 'INVERTER';
                        }
                        // If KNOWN LIVE -> Make BLANK to save self?
                        // Only do this if player HP is high and we are low, and want to burn a shell safely?
                        // Rarely optimal. Better to shoot player.
                    }

                    // 6. HANDCUFFS (Lockdown)
                    else if (dealer.items.includes('CUFFS') && !player.isHandcuffed && !itemToUse) {
                        // Use if we are confident about damage (Live Prob > 60%) to chain turns
                        // OR if we are going to start a combo
                        if (currentLiveProb > 0.6) {
                            itemToUse = 'CUFFS';
                        }
                    }

                    // 7. SAW (Damage Boost)
                    else if (dealer.items.includes('SAW') && !dealer.isSawedActive && !itemToUse) {
                        // Use if confident LIVE (Known or High Prob)
                        if (currentLiveProb > 0.65) {
                            // Don't overkill 1HP player
                            if (player.hp > 1) {
                                itemToUse = 'SAW';
                            }
                        }
                    }

                    // 8. ADRENALINE (Steal)
                    else if (dealer.items.includes('ADRENALINE') && !itemToUse) {
                        // Steal if player has anything useful
                        if (player.items.length > 0) {
                            itemToUse = 'ADRENALINE';
                        }
                    }

                    // 9. SURPLUS CIGS (Top off health)
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

                    // 3. UNKNOWN -> PROBABILITY CHECK
                    else {
                        if (finalLiveProb > 0.55) target = 'PLAYER';
                        else if (finalLiveProb < 0.45) target = 'DEALER';
                        else target = Math.random() > 0.5 ? 'PLAYER' : 'DEALER';
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