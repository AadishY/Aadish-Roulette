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
      // Reset memory if chamber shuffled or phase changed significantly
      if (gameState.phase !== 'DEALER_TURN' && gameState.phase !== 'RESOLVING') {
          // If we are not in dealer turn, maybe reset memory if round changed?
          // We'll rely on index check.
      }
  }, [gameState.phase]);

  useEffect(() => {
    // If index changed (shot fired), the memory of 'current' shell is invalid for the new current
    // But logically, if we just shot, the index moved.
    // We should clear memory when the turn ends or shot resolves.
  }, [gameState.currentShellIndex]);

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
            
            // Check memory validity (basic sync check)
            // In a real complex app we'd track shell IDs, but here we assume if we used Glass, we know THIS shell.
            // If the index moved since we used Glass, we'd need to clear it, but the AI loop re-runs immediately.

            let itemToUse: ItemType | null = null;
            let itemIndex = -1;

            // 1. HEAL
            if (!itemToUse && dealer.hp < 3 && dealer.items.includes('CIGS')) {
                itemIndex = dealer.items.indexOf('CIGS');
                itemToUse = 'CIGS';
            }

            // 2. CUFFS
            if (!itemToUse && dealer.items.includes('CUFFS') && !player.isHandcuffed && total >= 2) {
                 itemIndex = dealer.items.indexOf('CUFFS');
                 itemToUse = 'CUFFS';
            }

            // 3. SAW (Aggressive)
            if (!itemToUse && dealer.items.includes('SAW') && !dealer.isSawedActive) {
                // Use saw if we KNOW it's live, or prob is high
                if (aiKnownShell.current === 'LIVE' || knownShell === 'LIVE' || liveProb === 1 || (liveProb > 0.6 && lives > 1)) {
                    itemIndex = dealer.items.indexOf('SAW');
                    itemToUse = 'SAW';
                }
            }

            // 4. GLASS (Info)
            if (!itemToUse && dealer.items.includes('GLASS') && total > 1 && !aiKnownShell.current && liveProb !== 1 && liveProb !== 0) {
                 itemIndex = dealer.items.indexOf('GLASS');
                 itemToUse = 'GLASS';
            }

            // 5. BEER (Cycle)
            if (!itemToUse && dealer.items.includes('BEER')) {
                 // Use beer if we KNOW it's blank or want to skip
                 if (aiKnownShell.current === 'BLANK' || knownShell === 'BLANK' || liveProb < 0.4) {
                    itemIndex = dealer.items.indexOf('BEER');
                    itemToUse = 'BEER';
                 }
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

            // Decision Matrix
            // 1. Certainty
            if (aiKnownShell.current === 'LIVE' || knownShell === 'LIVE') target = 'PLAYER';
            else if (aiKnownShell.current === 'BLANK' || knownShell === 'BLANK') target = 'DEALER';
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