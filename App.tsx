import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw } from 'lucide-react';
import { ThreeScene } from './components/ThreeScene';
import { GameUI } from './components/GameUI';
import { useGameLogic } from './hooks/useGameLogic';
import { useDealerAI } from './hooks/useDealerAI';
import { SettingsMenu } from './components/SettingsMenu';
import { GameSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

import { LoadingScreen } from './components/LoadingScreen';
import { TutorialGuide } from './components/TutorialGuide';
import { Scoreboard } from './components/ui/Scoreboard';
import { audioManager } from './utils/audioManager';

type AppState = 'MENU' | 'LOADING_SP' | 'LOADING_GAME' | 'GAME';

export default function App() {
  const spGame = useGameLogic();
  const [appState, setAppState] = useState<AppState>('MENU');

  // Try to initialize audio ASAP (will only succeed if browser allows)
  useEffect(() => {
    audioManager.initialize().then(() => {
      // If successful, ensure menu music starts immediately without waiting for state update cycle
      audioManager.playMusic('menu');
    }).catch(() => { });
  }, []);

  // --- ORIENTATION CHECK ---
  const [showRotateWarning, setShowRotateWarning] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkOrientation = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        let isPortrait = false;
        if (window.matchMedia) {
          isPortrait = window.matchMedia("(orientation: portrait)").matches;
        } else {
          isPortrait = window.innerHeight > window.innerWidth;
        }
        const isMobile = window.innerWidth < 950;
        setShowRotateWarning(isPortrait && isMobile);
      }, 200);
    };

    setTimeout(checkOrientation, 100);

    window.addEventListener('resize', checkOrientation);
    if (window.matchMedia) {
      window.matchMedia("(orientation: portrait)").addEventListener("change", checkOrientation);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      if (window.matchMedia) {
        window.matchMedia("(orientation: portrait)").removeEventListener("change", checkOrientation);
      }
      clearTimeout(timeoutId);
    };
  }, []);

  // For loot overlay
  const effectiveShowLootOverlay = spGame.showLootOverlay;
  const effectiveReceivedItems = spGame.receivedItems as import('./types').ItemType[];

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('aadish_roulette_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('aadish_roulette_settings', JSON.stringify(settings));
    audioManager.updateVolumes(settings);

  }, [settings]);

  // Handle Music Logic
  useEffect(() => {
    if (appState === 'MENU') {
      audioManager.playMusic('menu');
    } else if (appState === 'GAME') {
      const phase = spGame.gameState.phase;
      if (phase === 'GAME_OVER') {
        audioManager.playMusic('endscreen');
      } else if (phase === 'INTRO' || phase === 'BOOT') {
        audioManager.playMusic('menu');
      } else {
        audioManager.playMusic('gameplay');
      }
    }
  }, [appState, spGame.gameState.phase]);

  const [isHardModeSelected, setIsHardModeSelected] = useState(false);

  // Dealer AI only for singleplayer
  useDealerAI({
    gameState: spGame.gameState,
    dealer: spGame.dealer,
    player: spGame.player,
    knownShell: spGame.knownShell,
    animState: spGame.animState,
    fireShot: spGame.fireShot,
    processItemEffect: spGame.processItemEffect,
    setDealer: spGame.setDealer,
    setPlayer: spGame.setPlayer,
    setTargetAim: spGame.setAimTarget,
    setCameraView: spGame.setCameraView,
    setOverlayText: spGame.setOverlayText,
    isMultiplayer: false,
    isProcessing: spGame.isProcessing,
    setIsProcessing: spGame.setIsProcessing
  });

  const handleResetSettings = () => setSettings(DEFAULT_SETTINGS);

  const handleBootComplete = useCallback(() => {
    spGame.setGamePhase('INTRO');
    audioManager.playMusic('menu');
  }, [spGame]);

  const handleStartSP = (name: string, hardMode: boolean = false) => {
    setIsHardModeSelected(hardMode);
    if (name) spGame.setPlayerName(name);

    audioManager.stopMusic();
    setAppState('LOADING_SP');
  };



  const onLoadingComplete = () => {
    if (appState === 'LOADING_SP') {
      spGame.startGame(spGame.playerName, isHardModeSelected);
      setAppState('GAME');
    }
    if (appState === 'LOADING_GAME') {
      setAppState('GAME');
    }
  };

  const handleBackToMenu = () => {
    setAppState('GAME');
    spGame.resetGame(true);
  };

  const handleFireShot = (target: 'PLAYER' | 'DEALER') => {
    spGame.fireShot('PLAYER', target);
  };

  const handleUseItem = (index: number) => {
    spGame.usePlayerItem(index);
  };

  const handlePickupGun = () => {
    spGame.pickupGun();
  };

  const handleMainMenu = () => {
    setAppState('GAME');
    spGame.resetGame(true);
  };

  const handleRestartSP = () => {
    setAppState('LOADING_SP');
    spGame.resetGame(false);
  };

  return (
    <div
      className={`relative w-full h-screen bg-black overflow-hidden select-none crt text-stone-200 cursor-crosshair animate-in fade-in duration-1000 ${spGame.gameState.isHardMode ? 'hardmode-scanline' : ''}`}
      onClick={() => audioManager.initialize()}
      onKeyDown={() => audioManager.initialize()}
    >
      <div className="crt-overlay opacity-[0.15] pointer-events-none" />
      <div className="vhs-static" />

      {spGame.gameState.isHardMode && (
        <div className="absolute inset-0 z-[60] pointer-events-none bg-red-900/[0.02] mix-blend-color-burn animate-pulse" />
      )}

      <div id="rotate-warning" className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-opacity duration-500 ${showRotateWarning ? 'opacity-100 pointer-events-auto flex' : 'opacity-0 pointer-events-none'}`}>
        <div className="warning-card">
          <div className="relative">
            <RotateCw size={48} className="text-red-500 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 blur-xl bg-red-500/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1>ROTATE</h1>
            <p>ORIENTATION ERROR</p>
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
        </div>
      </div>

      <ThreeScene
        isSawed={spGame.player.isSawedActive || spGame.dealer.isSawedActive}
        isChokeActive={spGame.player.isChokeActive || spGame.dealer.isChokeActive}
        isPlayerCuffed={spGame.player.isHandcuffed}
        knownShell={spGame.knownShell}
        onGunClick={() => { }}
        aimTarget={spGame.aimTarget}
        cameraView={spGame.cameraView}
        animState={spGame.animState}
        turnOwner={spGame.gameState.turnOwner}
        settings={settings}
        isHardMode={spGame.gameState.isHardMode}
        player={spGame.player}
        dealer={spGame.dealer}
        gameState={spGame.gameState}
      />

      <GameUI
        gameState={spGame.gameState}
        player={spGame.player}
        dealer={spGame.dealer}
        logs={spGame.logs}
        overlayText={spGame.overlayText}
        overlayColor={spGame.overlayColor}
        showBlood={spGame.showBlood}
        showFlash={spGame.showFlash}
        showLootOverlay={effectiveShowLootOverlay}
        receivedItems={effectiveReceivedItems}
        triggerHeal={spGame.animState.triggerHeal}
        triggerDrink={spGame.animState.triggerDrink}
        knownShell={spGame.knownShell}
        playerName={spGame.playerName}
        cameraView={spGame.cameraView}
        aimTarget={spGame.aimTarget}
        isProcessing={spGame.isProcessing}
        isRecovering={spGame.animState.playerHit || spGame.animState.playerRecovering || spGame.animState.dealerDropping || spGame.animState.dealerRecovering}
        settings={settings}
        onStartGame={handleStartSP}

        onResetGame={(toMenu) => {
          if (toMenu) {
            setAppState('LOADING_GAME');
            setTimeout(() => {
              handleMainMenu();
            }, 100);
          } else {
            setAppState('LOADING_SP');
            spGame.resetGame(false);
          }
        }}
        onFireShot={handleFireShot}
        onUseItem={handleUseItem}
        onHoverTarget={spGame.setAimTarget}
        onPickupGun={handlePickupGun}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenScoreboard={() => setIsScoreboardOpen(true)}
        onUpdateName={spGame.setPlayerName}
        onStealItem={spGame.stealItem}
        onBootComplete={handleBootComplete}
        matchData={spGame.matchStats}
      />

      {(appState === 'LOADING_SP' || appState === 'LOADING_GAME') && (
        <div className="absolute inset-0 z-[100]">
          <LoadingScreen
            onComplete={onLoadingComplete}
            text={appState === 'LOADING_GAME' ? "INITIALIZING TABLE..." : "LOADING..."}
            duration={appState === 'LOADING_GAME' ? 1200 : 800}
            onBack={handleBackToMenu}
          />
        </div>
      )}

      {isScoreboardOpen && (
        <Scoreboard
          onClose={() => setIsScoreboardOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsMenu
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setIsSettingsOpen(false)}
          onResetDefaults={handleResetSettings}
        />
      )}

      {isGuideOpen && (
        <TutorialGuide
          onClose={() => setIsGuideOpen(false)}
        />
      )}
    </div>
  );
}