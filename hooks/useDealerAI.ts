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
    setTargetAim: (aim: AimTarget) => void;
    setCameraView: (view: CameraView) => void;
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
    setTargetAim,
    setCameraView,
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
                    await wait(1000);

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

                    // 5. SAW FALLBACK (High confidence)
                    if (!itemToUse && dealer.items.includes('SAW') && !dealer.isSawedActive && liveProb > 0.6) {
                        itemIndex = dealer.items.indexOf('SAW');
                        itemToUse = 'SAW';
                    }

                    // 6. CIGS if has plenty
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

                        const roundEnded = await processItemEffect('DEALER', itemToUse);
                        await wait(1500);

                        if (!roundEnded) {
                            isAITurnInProgress.current = false;
                            setAiTick(t => t + 1); // Rerun logic
                        } else {
                            aiKnownShell.current = null;
                        }
                        return;
                    }

                    // --- SHOOT ---
                    await wait(500);
                    let target: TurnOwner = 'PLAYER';

                    // Decision
                    if (currentKnowledge === 'LIVE') target = 'PLAYER';
                    else if (currentKnowledge === 'BLANK') target = 'DEALER';
                    else {
                        // Probabilistic approach
                        if (liveProb >= 0.5) target = 'PLAYER'; // Aggressive
                        else target = 'DEALER'; // Play safe
                    }

                    setTargetAim(target === 'PLAYER' ? 'OPPONENT' : 'SELF');
                    await wait(1000);

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