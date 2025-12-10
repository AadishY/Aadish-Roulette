import React from 'react';
import { ThreeScene } from './components/ThreeScene';
import { GameUI } from './components/GameUI';
import { useGameLogic } from './hooks/useGameLogic';
import { useDealerAI } from './hooks/useDealerAI';

export default function App() {
  const game = useGameLogic();

  useDealerAI({
    gameState: game.gameState,
    dealer: game.dealer,
    player: game.player,
    knownShell: game.knownShell,
    fireShot: game.fireShot,
    processItemEffect: game.processItemEffect,
    setDealer: game.setDealer,
    setTargetAim: game.setAimTarget,
    setCameraView: game.setCameraView
  });

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none crt text-stone-200 cursor-crosshair">
      {/* Mobile Scaling Wrapper */}
      <div className="absolute inset-0 w-full h-full origin-top-left md:scale-100 scale-[0.85] w-[117%] h-[117%] md:w-full md:h-full">
          <ThreeScene 
            isSawed={game.player.isSawedActive}
            onGunClick={() => {}}
            aimTarget={game.aimTarget}
            cameraView={game.cameraView}
            animState={game.animState}
            turnOwner={game.gameState.turnOwner} 
          />

          <GameUI 
            gameState={game.gameState}
            player={game.player}
            dealer={game.dealer}
            logs={game.logs}
            overlayText={game.overlayText}
            overlayColor={game.overlayColor}
            showBlood={game.showBlood}
            showFlash={game.showFlash}
            showLootOverlay={game.showLootOverlay}
            receivedItems={game.receivedItems}
            triggerHeal={game.animState.triggerHeal}
            triggerDrink={game.animState.triggerDrink}
            knownShell={game.knownShell}
            playerName={game.playerName}
            cameraView={game.cameraView}
            onStartGame={game.startGame}
            onResetGame={game.resetGame}
            onFireShot={(target) => game.fireShot('PLAYER', target)}
            onUseItem={game.usePlayerItem}
            onHoverTarget={game.setAimTarget}
            onPickupGun={game.pickupGun}
          />
      </div>
    </div>
  );
}