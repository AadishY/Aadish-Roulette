import React, { useState, useEffect } from 'react';
import { ThreeScene } from './components/ThreeScene';
import { GameUI } from './components/GameUI';
import { useGameLogic } from './hooks/useGameLogic';
import { useDealerAI } from './hooks/useDealerAI';
import { SettingsMenu } from './components/SettingsMenu';
import { GameSettings } from './types';

export default function App() {
  const game = useGameLogic();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Default Settings Constant
  const DEFAULT_SETTINGS: GameSettings = {
      pixelScale: 3.0,
      brightness: 1.0,
      uiScale: 1.0,
      fishEye: false,
      vhsFilter: false
  };

  // Initialize from local storage or defaults
  const [settings, setSettings] = useState<GameSettings>(() => {
      const saved = localStorage.getItem('aadish_roulette_settings');
      if (saved) {
          try {
              return JSON.parse(saved);
          } catch (e) {
              console.error("Failed to parse settings", e);
          }
      }
      return DEFAULT_SETTINGS;
  });

  // Persist settings
  useEffect(() => {
      localStorage.setItem('aadish_roulette_settings', JSON.stringify(settings));
  }, [settings]);

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

  const handleResetSettings = () => {
      setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className={`relative w-full h-[100dvh] bg-black overflow-hidden select-none crt text-stone-200 cursor-crosshair ${settings.vhsFilter ? 'vhs-filter' : ''}`}>
      <ThreeScene 
        isSawed={game.player.isSawedActive}
        onGunClick={() => {}}
        aimTarget={game.aimTarget}
        cameraView={game.cameraView}
        animState={game.animState}
        turnOwner={game.gameState.turnOwner} 
        settings={settings}
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
        isProcessing={game.isProcessing}
        settings={settings}
        onStartGame={game.startGame}
        onResetGame={game.resetGame}
        onFireShot={(target) => game.fireShot('PLAYER', target)}
        onUseItem={game.usePlayerItem}
        onHoverTarget={game.setAimTarget}
        onPickupGun={game.pickupGun}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {isSettingsOpen && (
          <SettingsMenu 
              settings={settings} 
              onUpdateSettings={setSettings} 
              onClose={() => setIsSettingsOpen(false)} 
              onResetDefaults={handleResetSettings}
          />
      )}
    </div>
  );
}