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
  setCameraView
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
            
            // Sync AI memory with global known shell (e.g. if player used glass and game exposes it publicly - 
            // though in this game player glass is private, but logically if dealer uses glass, aiKnownShell is set)
            let currentKnowledge = aiKnownShell.current;
            if (knownShell) currentKnowledge = knownShell; // If game makes it public

            let itemToUse: ItemType | null = null;
            let itemIndex = -1;

            // --- STRATEGY PHASE ---

            // 1. KNOWS NEXT IS LIVE
            if (currentKnowledge === 'LIVE') {
                // If damage needed to win is high, use saw
                if (!itemToUse && dealer.items.includes('SAW') && !dealer.isSawedActive && player.hp > 1) {
                    itemIndex = dealer.items.indexOf('SAW');
                    itemToUse = 'SAW';
                }
                // If shooting opponent will pass turn, try to cuff to keep turn?
                // Actually, shooting live passes turn. So cuffing prevents them from retaliating.
                if (!itemToUse && dealer.items.includes('CUFFS') && !player.isHandcuffed) {
                    itemIndex = dealer.items.indexOf('CUFFS');
                    itemToUse = 'CUFFS';
                }
            }

            // 2. KNOWS NEXT IS BLANK
            if (currentKnowledge === 'BLANK') {
                 // Free turn by shooting self, but maybe use beer to cycle if we want to get to a live one faster?
                 // Generally shooting self is better as it saves items.
                 // But if we have beer, we might use it if we just want to clear chamber? 
                 // Actually, shooting self with blank is always free.
            }

            // 3. LOW HP / GENERAL UTILITY
            if (!itemToUse && dealer.hp < 3 && dealer.items.includes('CIGS')) {
                itemIndex = dealer.items.indexOf('CIGS');
                itemToUse = 'CIGS';
            }

            // 4. UNKNOWN SHELL - GATHER INFO OR MANIPULATE
            if (!currentKnowledge) {
                // Use GLASS if available
                if (dealer.items.includes('GLASS') && total > 1) {
                    itemIndex = dealer.items.indexOf('GLASS');
                    itemToUse = 'GLASS';
                }
                // Use BEER if likely blank to cycle? Or if 50/50?
                else if (dealer.items.includes('BEER') && liveProb < 0.5) {
                     itemIndex = dealer.items.indexOf('BEER');
                     itemToUse = 'BEER';
                }
                // Use CUFFS if we are going to take a risky shot at opponent
                else if (dealer.items.includes('CUFFS') && !player.isHandcuffed && liveProb >= 0.5) {
                    itemIndex = dealer.items.indexOf('CUFFS');
                    itemToUse = 'CUFFS';
                }
            }

            // 5. SAW USAGE (Fallback)
            if (!itemToUse && dealer.items.includes('SAW') && !dealer.isSawedActive && liveProb > 0.6) {
                itemIndex = dealer.items.indexOf('SAW');
                itemToUse = 'SAW';
            }


            // --- EXECUTE ITEM ---
            if (itemToUse) {
                setDealer(d => ({...d, items: d.items.filter((_, i) => i !== itemIndex)}));
                
                // If using GLASS, cheat peek
                if (itemToUse === 'GLASS') {
                    const actual = gameState.chamber[gameState.currentShellIndex];
                    aiKnownShell.current = actual;
                }
                
                // If using BEER, we lose the current shell memory because it gets ejected
                if (itemToUse === 'BEER') {
                    aiKnownShell.current = null;
                }

                const roundEnded = await processItemEffect('DEALER', itemToUse);
                await wait(1500); 

                if (!roundEnded) {
                    isAITurnInProgress.current = false;
                    setAiTick(t => t + 1); 
                } else {
                    aiKnownShell.current = null; // New round
                }
                return;
            }

            // --- SHOOT ---
            await wait(500); 
            let target: TurnOwner = 'PLAYER';

            // Decision Matrix for Shooting
            // 1. Certainty
            if (currentKnowledge === 'LIVE') target = 'PLAYER';
            else if (currentKnowledge === 'BLANK') target = 'DEALER'; // Shoot self for free turn
            // 2. Probability
            else if (liveProb === 1) target = 'PLAYER';
            else if (liveProb === 0) target = 'DEALER';
            else if (liveProb > 0.5) target = 'PLAYER';
            else target = 'DEALER'; 

            setTargetAim(target === 'PLAYER' ? 'OPPONENT' : 'SELF');
            await wait(1000); 

            // Clear memory before shooting as the shell will be spent
            aiKnownShell.current = null;

            await fireShot('DEALER', target);
        } catch(e) {
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