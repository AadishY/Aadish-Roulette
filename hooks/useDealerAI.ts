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
                    // 1. WAIT FOR PLAYER OR DEALER RECOVERY - Ensure smooth turn transition
                    let waitCount = 0;
                    while ((animStateRef.current.playerHit || animStateRef.current.playerRecovering || animStateRef.current.dealerRecovering) && waitCount < 30) {
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

                    // --- ADVANCED ITEM STRATEGY (V3 - SMARTER) ---

                    // 1. SURVIVAL HEAL
                    // Use Cigs if hurt at all, priority increases as HP drops.
                    // If HP <= 2, absolute top priority.
                    if (dealer.hp < dealer.maxHp && dealer.items.includes('CIGS') && !itemToUse) {
                        // Always heal if critical (<=2) or 50% chance if just scratched
                        if (dealer.hp <= 2 || Math.random() > 0.5) {
                            itemToUse = 'CIGS';
                        }
                    }

                    // 2. ADRENALINE THEFT
                    else if (dealer.items.includes('ADRENALINE') && player.items.length > 0 && !itemToUse) {
                        const threats = ['SAW', 'CUFFS', 'INVERTER', 'ADRENALINE', 'CIGS'];
                        const hasThreat = player.items.some(i => threats.includes(i));
                        // Steal if they have something good
                        if (hasThreat) itemToUse = 'ADRENALINE';
                    }

                    // 3. INVERTER (Aggressive Flip)
                    // If Known/High Prob BLANK -> Flip to LIVE to shoot player
                    else if (dealer.items.includes('INVERTER') && !itemToUse && totalRemaining > 1) {
                        if (currentKnown === 'BLANK' || (!currentKnown && currentLiveProb < 0.35)) {
                            itemToUse = 'INVERTER';
                        }
                    }

                    // 4. SAW (Damage Amp)
                    // Only use if we are fairly confident it's LIVE
                    else if (dealer.items.includes('SAW') && !dealer.isSawedActive && !itemToUse && player.hp > 1) {
                        if (currentKnown === 'LIVE' || currentLiveProb >= 0.55) {
                            itemToUse = 'SAW';
                        }
                    }

                    // 5. HANDCUFFS (Control)
                    // Use if we think it's LIVE (to shoot and keep turn) OR if we just want to block player
                    else if (dealer.items.includes('CUFFS') && !player.isHandcuffed && !itemToUse && totalRemaining > 1) {
                        // Don't cuff on the very last shell (pointless)
                        itemToUse = 'CUFFS';
                    }

                    // 6. MAGNIFYING GLASS (Intel)
                    else if (!currentKnown && dealer.items.includes('GLASS') && totalRemaining >= 2 && !itemToUse) {
                        itemToUse = 'GLASS';
                    }

                    // 7. PHONE (Future Intel)
                    else if (dealer.items.includes('PHONE') && unknownTotal > 2 && !itemToUse) {
                        itemToUse = 'PHONE';
                    }

                    // 8. BEER (Cycle)
                    // Skip if current is likely BLANK and we don't want to risk shooting self
                    // OR if current is UNKNOWN and we want to cycle to find a better shell
                    else if (dealer.items.includes('BEER') && !itemToUse) {
                        // If we are confused (40-60%) or think it's blank, just skip.
                        // Dealer prefers confirmed shots.
                        if (!currentKnown && totalRemaining > 2) {
                            itemToUse = 'BEER';
                        }
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
                        // If we sawed off, we are COMMITTED to violence unless we KNOW it's a blank
                        if (dealer.isSawedActive && finalLiveProb > 0.1) {
                            target = 'PLAYER';
                        }
                        // Standard Risk Assessment
                        // If chance is > 40%, shoot player. This is slightly aggressive.
                        // Ideally: Shoot Player if E(Shot) > E(Pass).
                        // E(Pass) = 1 (Keep turn). E(Shot) = P(Live) * Damage.
                        // But shooting self on Blank gives another turn.
                        // So if P(Live) < 50%, P(Blank) > 50%. Shooting self is +EV for turn retention.
                        // However, Dealer is a psycho.
                        else if (finalLiveProb >= 0.40) target = 'PLAYER';
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