import React, { useEffect, useRef, useState } from 'react';
import { GameState, PlayerState, ShellType, ItemType, TurnOwner, AimTarget, CameraView, AnimationState } from '../types';
import { wait } from '../utils/gameUtils';

interface DealerAIProps {
    gameState: GameState;
    dealer: PlayerState;
    player: PlayerState;
    knownShell: ShellType | null;
    animState: AnimationState;
    fireShot: (shooter: TurnOwner, target: TurnOwner) => Promise<void>;
    processItemEffect: (user: TurnOwner, item: ItemType) => Promise<boolean>;
    setDealer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setTargetAim: (aim: AimTarget) => void;
    setCameraView: (view: CameraView) => void;
    setOverlayText?: React.Dispatch<React.SetStateAction<string | null>>;
    isMultiplayer?: boolean;
    isProcessing: boolean;
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
    isMultiplayer = false,
    isProcessing
}: DealerAIProps) => {
    const isAITurnInProgress = useRef(false);
    // AI Memory: Map<shellIndex, type> - Tracks specifically known shells
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
        if (isProcessing) return;

        if (gameState.phase === 'DEALER_TURN' && !isAITurnInProgress.current) {
            isAITurnInProgress.current = true;
            setCameraView('PLAYER');

            const runAITurn = async () => {
                try {
                    // Small human-like delay
                    await wait(800 + Math.random() * 800);

                    if (document.hidden) return; // Pause AI if tab is hidden
                    // Re-check validity after delay
                    if (gameState.phase !== 'DEALER_TURN' || gameState.winner || document.hidden) return;

                    const chamber = gameState.chamber;
                    const currentIdx = gameState.currentShellIndex;
                    const remainingShells = chamber.slice(currentIdx);
                    const totalRemaining = remainingShells.length;

                    // --- ANALYSIS ---
                    const liveCountReal = remainingShells.filter(s => s === 'LIVE').length;
                    // Cheat capability: Calculate real probabilities sometimes if wanted,
                    // but for fairness/logic we mimic knowledge.

                    // Check Global Known (Glass)
                    if (knownShell) {
                        aiMemory.current.set(currentIdx, knownShell);
                    }

                    let currentKnown = aiMemory.current.get(currentIdx);

                    // Count what IS known in memory ahead
                    let knownLiveDelta = 0;
                    let knownSafeCnt = 0;

                    // Simple logic for unknown probability
                    // (liveCount visible in game state is global real count? or tracked?
                    //  In this implementation, gameState.liveCount is visible to player, so AI uses it)
                    const visibleLive = gameState.liveCount;
                    const visibleBlank = gameState.blankCount;
                    // BUT these counts might be outdated if we haven't tracked properly, 
                    // usually gameState is accurate to "what is in the gun".

                    // Logic:
                    // unknownLive = VisibleLive - KnownLiveInFuture
                    // unknownTotal = TotalRemaining - KnownInFuture

                    // Let's assume naive probability for simplicity unless we have verified state
                    // (If we want a "God Tier" that knows everything, we can just peek `chamber[currentIdx]`)

                    const unknownLiveProb = (visibleLive / (visibleLive + visibleBlank)) || 0;

                    let itemToUse: ItemType | null = null;

                    // --- HARD MODE LOGIC (GOD TIER) ---
                    if (gameState.isHardMode) {
                        // 0. SUPERNATURAL INTUITION (The Dealer can smell the gunpowder)
                        // 40% chance to just KNOW update memory
                        if (!currentKnown && Math.random() < 0.40) {
                            const actual = chamber[currentIdx];
                            aiMemory.current.set(currentIdx, actual);
                            currentKnown = actual;
                        }

                        // 1. KILL CONFIRMATION (Priority 1)
                        if (currentKnown === 'LIVE') {
                            if (dealer.items.includes('SAW') && !dealer.isSawedActive) itemToUse = 'SAW';
                            else if (dealer.items.includes('CUFFS') && !player.isHandcuffed && totalRemaining > 1) itemToUse = 'CUFFS';
                        }

                        // 2. CONVERSION (Priority 2) - "No U" Strat
                        else if (currentKnown === 'BLANK' && dealer.items.includes('INVERTER')) {
                            itemToUse = 'INVERTER';
                        }
                        // 2.5 BIG INVERTER - If we have mostly blanks left, or current is blank and we have many shells
                        else if (dealer.items.includes('BIG_INVERTER') && !itemToUse) {
                            const remaining = remainingShells.length;
                            const knownBlanks = remainingShells.filter(s => s === 'BLANK').length; // Cheating peeking strictly for AI logic
                            // If more than 50% blanks, invert to get more lives
                            if (knownBlanks / remaining > 0.5) itemToUse = 'BIG_INVERTER';
                            // Or if current is blank and we have lot of shells, worth flipping
                            else if (currentKnown === 'BLANK' && remaining >= 3) itemToUse = 'BIG_INVERTER';
                        }

                        // 3. INFORMATION (Priority 3)
                        else if (!currentKnown && dealer.items.includes('GLASS') && !itemToUse) itemToUse = 'GLASS';
                        else if (dealer.items.includes('PHONE') && totalRemaining > 1 && !itemToUse) itemToUse = 'PHONE';

                        // 4. THEFT & DEFENSE (Priority 4)
                        else if (dealer.hp < dealer.maxHp && dealer.hp <= 2 && dealer.items.includes('CIGS')) itemToUse = 'CIGS';
                        // Adrenaline: Steal critical items
                        else if (dealer.items.includes('ADRENALINE') && player.items.length > 0 && !itemToUse) {
                            const targets = ['INVERTER', 'SAW', 'CIGS', 'GLASS'];
                            // Only use adrenaline if player ACTUALLY has something good
                            if (player.items.some(i => targets.includes(i))) itemToUse = 'ADRENALINE';
                        }

                        // NEW 5. CHOKE LOGIC (GOD TIER)
                        else if (dealer.items.includes('CHOKE') && !dealer.isChokeActive && !itemToUse && totalRemaining >= 2) {
                            // Perfect Kill: If we know next 2 are LIVE (or intuition)
                            // Hard mode logic peeks if currentKnown is consistent
                            const nextKnown = aiMemory.current.get(currentIdx + 1);
                            const actualNext = chamber[currentIdx + 1];

                            // Intuition: 40% chance to know next shell too
                            let knowsNext = !!nextKnown;
                            if (!knowsNext && Math.random() < 0.40) {
                                aiMemory.current.set(currentIdx + 1, actualNext);
                                knowsNext = true;
                            }

                            const shell1 = currentKnown || (Math.random() < 0.4 ? chamber[currentIdx] : null); // Sim intuition
                            const shell2 = nextKnown || (Math.random() < 0.4 ? actualNext : null);

                            // Optimize: 2 LIVES = KILL
                            if (shell1 === 'LIVE' && shell2 === 'LIVE') itemToUse = 'CHOKE';
                            // Safely clear 2 BLANKS
                            else if (shell1 === 'BLANK' && shell2 === 'BLANK') itemToUse = 'CHOKE';
                            // Mixed: Guaranteed Damage if 1 is Live + Choke -> Shoot Player
                            else if ((shell1 === 'LIVE' || shell2 === 'LIVE') && itemToUse === null) {
                                // High aggression if HP is full
                                if (dealer.hp > 2) itemToUse = 'CHOKE';
                            }
                        }

                        // 5. GAMBLE / CYCLE (Priority 5)
                        else if (dealer.items.includes('BEER') && !itemToUse && (dealer.hp === 1 || unknownLiveProb < 0.45)) itemToUse = 'BEER';
                        else if (dealer.hp < dealer.maxHp && dealer.items.includes('CIGS')) itemToUse = 'CIGS';
                    }
                    else {
                        // --- NORMAL LOGIC ---
                        if (dealer.hp < dealer.maxHp && dealer.items.includes('CIGS') && !itemToUse) {
                            if (dealer.hp <= 2 || Math.random() > 0.5) itemToUse = 'CIGS';
                        }
                        else if (dealer.items.includes('ADRENALINE') && player.items.length > 0 && !itemToUse) {
                            const threats = ['SAW', 'CUFFS', 'INVERTER', 'ADRENALINE', 'CIGS'];
                            if (player.items.some(i => threats.includes(i))) itemToUse = 'ADRENALINE';
                        }
                        // GOD MODE COMBO: BLANK -> INVERT -> LIVE -> SAW
                        else if (dealer.items.includes('INVERTER') && !itemToUse && currentKnown === 'BLANK') {
                            itemToUse = 'INVERTER';
                        }
                        // NEW: Big Inverter (Chaos)
                        else if (dealer.items.includes('BIG_INVERTER') && !itemToUse) {
                            // Use if current is BLANK or we have significantly more blanks
                            if (currentKnown === 'BLANK' || (visibleBlank > visibleLive && totalRemaining >= 3)) {
                                itemToUse = 'BIG_INVERTER';
                            }
                        }
                        else if (dealer.items.includes('SAW') && !dealer.isSawedActive && !itemToUse && currentKnown === 'LIVE' && player.hp > 1) {
                            itemToUse = 'SAW';
                        }
                        // Probabilistic Fallbacks
                        else if (dealer.items.includes('INVERTER') && !itemToUse && !currentKnown && unknownLiveProb < 0.35 && totalRemaining > 1) {
                            itemToUse = 'INVERTER';
                        }
                        else if (dealer.items.includes('SAW') && !dealer.isSawedActive && !itemToUse && !currentKnown && unknownLiveProb >= 0.55 && player.hp > 1) {
                            itemToUse = 'SAW';
                        }
                        else if (dealer.items.includes('CUFFS') && !player.isHandcuffed && !itemToUse && totalRemaining > 1) {
                            itemToUse = 'CUFFS';
                        }
                        else if (!currentKnown && dealer.items.includes('GLASS') && totalRemaining >= 2 && !itemToUse) {
                            itemToUse = 'GLASS';
                        }
                        else if (dealer.items.includes('PHONE') && totalRemaining > 2 && !itemToUse) {
                            itemToUse = 'PHONE';
                        }
                        else if (dealer.items.includes('BEER') && !itemToUse) {
                            if (currentKnown === 'BLANK' || (!currentKnown && totalRemaining > 2)) itemToUse = 'BEER';
                        }
                        // Normal Mode Choke: Random Aggression
                        else if (dealer.items.includes('CHOKE') && !dealer.isChokeActive && !itemToUse && totalRemaining >= 2) {
                            // 40% chance to use if we have > 2 shells left
                            if (Math.random() < 0.4) itemToUse = 'CHOKE';
                        }
                    }

                    // --- EXECUTION ---
                    if (itemToUse) {
                        const idx = dealer.items.indexOf(itemToUse);
                        if (idx !== -1) {
                            await wait(500);
                            setTargetAim('IDLE');
                            await wait(500);

                            // Helper to trigger item use
                            const triggerItemUse = async (index: number) => {
                                const item = dealer.items[index];
                                setDealer(d => {
                                    const ni = [...d.items];
                                    ni.splice(index, 1);
                                    return { ...d, items: ni };
                                });
                                await processItemEffect('DEALER', item);
                            };

                            if (itemToUse === 'ADRENALINE') {
                                // Remove Adrenaline
                                setDealer(d => {
                                    const ni = [...d.items];
                                    ni.splice(idx, 1);
                                    return { ...d, items: ni };
                                });
                                await processItemEffect('DEALER', 'ADRENALINE');
                                await wait(1500);

                                // Simulate Steal
                                let stealIdx = -1;
                                const priorities: ItemType[] = gameState.isHardMode
                                    ? ['INVERTER', 'SAW', 'CUFFS', 'CIGS', 'PHONE', 'GLASS', 'BEER']
                                    : ['SAW', 'INVERTER', 'CUFFS', 'PHONE', 'GLASS', 'CIGS', 'BEER'];

                                let activePriorities = priorities;
                                if (dealer.hp < 2) activePriorities = ['CIGS', 'ADRENALINE', ...priorities];

                                for (const pItem of activePriorities) {
                                    const pIdx = player.items.indexOf(pItem as ItemType);
                                    if (pIdx !== -1) {
                                        stealIdx = pIdx;
                                        break;
                                    }
                                }
                                if (stealIdx === -1 && player.items.length > 0) stealIdx = 0;

                                if (stealIdx !== -1) {
                                    const stolen = player.items[stealIdx];
                                    setPlayer(p => {
                                        const ni = [...p.items];
                                        ni.splice(stealIdx, 1);
                                        return { ...p, items: ni };
                                    });
                                    if (setOverlayText) {
                                        setOverlayText(`DEALER STOLE ${stolen}`);
                                        setTimeout(() => setOverlayText?.(null), 1500);
                                    }
                                    await wait(1000);

                                    if (stolen !== 'ADRENALINE') {
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
                                setAiTick(t => t + 1);
                                isAITurnInProgress.current = false;
                                return;
                            }
                            // Non-stealing items
                            else {
                                await triggerItemUse(idx);

                                // UPDATE MEMORY BASED ON ACTION
                                if (itemToUse === 'GLASS') {
                                    aiMemory.current.set(currentIdx, chamber[currentIdx]);
                                }
                                else if (itemToUse === 'INVERTER') {
                                    const actual = chamber[currentIdx];
                                    aiMemory.current.set(currentIdx, actual === 'LIVE' ? 'BLANK' : 'LIVE');
                                }
                                else if (itemToUse === 'BIG_INVERTER') {
                                    // Invert MEMORY for all remaining shells
                                    for (let i = currentIdx; i < chamber.length; i++) {
                                        if (aiMemory.current.has(i)) {
                                            const m = aiMemory.current.get(i);
                                            aiMemory.current.set(i, m === 'LIVE' ? 'BLANK' : 'LIVE');
                                        } else {
                                            // Cheat a bit -> If we know nothing, maybe we can assume random inversion? 
                                            // Or just clear memory actually, since we scrambled the "unknowns" anyway
                                            // But effectively, if we knew shell X, and use Big Inverter, we now know Shell X is opposite.
                                        }
                                    }
                                }
                                else if (itemToUse === 'PHONE') {
                                    // Dealer used phone: Memorize a random future shell
                                    // (handlePhone handles the UI, we handle the Brain)
                                    const available = [];
                                    const limit = chamber.length;
                                    // Phone can see any future shell (idx + 1 ... end) relative to current state
                                    // Note: triggerItemUse calls handlePhone which waits. By the time we get here, state is same.
                                    for (let i = currentIdx + 1; i < limit; i++) {
                                        if (!aiMemory.current.has(i)) available.push(i);
                                    }
                                    if (available.length > 0) {
                                        const r = available[Math.floor(Math.random() * available.length)];
                                        aiMemory.current.set(r, chamber[r]);
                                    }
                                }

                                await wait(500);
                                setAiTick(t => t + 1);
                                isAITurnInProgress.current = false;
                                return;
                            }
                        }
                    }

                    // --- SHOOTING DECISION ---
                    await wait(500);
                    setTargetAim('IDLE');
                    await wait(600);

                    // Re-evaluate known after item usage
                    currentKnown = aiMemory.current.get(currentIdx);
                    // Or if inverted

                    const finalLiveProb = currentKnown ? (currentKnown === 'LIVE' ? 1.0 : 0.0) : unknownLiveProb;

                    let target: TurnOwner = 'PLAYER';

                    // DECISION LOGIC
                    if (finalLiveProb === 1.0) target = 'PLAYER';
                    else if (finalLiveProb === 0.0) target = 'DEALER';
                    else {
                        if (dealer.isSawedActive) {
                            // If sawed, almost always shoot player unless we are sure it's blank
                            target = finalLiveProb > 0.1 ? 'PLAYER' : 'DEALER'; // Risk it
                        } else {
                            if (gameState.isHardMode) {
                                // Smart Logic:
                                // 1. If HP is 1, NEVER risk shooting self unless we are 100% sure it's blank (Prob=0).
                                // 2. Otherwise use 50% threshold for optimal turn retention.
                                if (dealer.hp === 1 && finalLiveProb > 0) {
                                    target = 'PLAYER';
                                } else {
                                    target = finalLiveProb >= 0.5 ? 'PLAYER' : 'DEALER';
                                }
                            } else {
                                // Normal Mode: Aggressive/Loose
                                target = finalLiveProb >= 0.4 ? 'PLAYER' : 'DEALER';
                            }
                        }

                        // Normal Mode Personality override: Sometimes dumb
                        if (!gameState.isHardMode && Math.random() < 0.1) {
                            target = target === 'PLAYER' ? 'DEALER' : 'PLAYER'; // 10% chance to be an idiot
                        }
                    }

                    setTargetAim(target === 'PLAYER' ? 'OPPONENT' : 'SELF');
                    await wait(1000);
                    aiMemory.current.delete(currentIdx); // Clear memory of this shell once used
                    await fireShot('DEALER', target);

                } catch (e) {
                    console.error("Dealer AI Error:", e);
                } finally {
                    isAITurnInProgress.current = false;
                }
            };
            runAITurn();
        }
    }, [gameState.phase, aiTick, gameState.turnOwner, isProcessing, dealer]);
};