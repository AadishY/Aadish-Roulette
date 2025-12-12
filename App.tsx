import React, { useState, useEffect, useCallback } from 'react';
import { ThreeScene } from './components/ThreeScene';
import { GameUI } from './components/GameUI';
import { useGameLogic } from './hooks/useGameLogic';
import { useDealerAI } from './hooks/useDealerAI';
import { useSocket } from './hooks/useSocket';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { SettingsMenu } from './components/SettingsMenu';
import { MultiplayerGameOver } from './components/MultiplayerGameOver';
import { GameSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

import { LoadingScreen } from './components/LoadingScreen';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { TutorialGuide } from './components/TutorialGuide';
import { audioManager } from './utils/audioManager';

type AppState = 'MENU' | 'LOADING_SP' | 'LOADING_MP' | 'LOBBY' | 'LOADING_GAME' | 'GAME';

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
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);

  const handleConnect = useCallback(() => { }, []);
  const [socketError, setSocketError] = useState<string | null>(null);
  const handleError = useCallback((err: string) => setSocketError(err), []);

  const handleGameStart = useCallback(() => {
    setAppState('LOADING_GAME');
  }, []);

  const socket = useSocket(spGame.playerName || "PLAYER", handleConnect, handleError, handleGameStart);

  // Multiplayer game logic
  const mpGame = useMultiplayerGame({
    mpGameState: socket.gameStateData,
    myPlayerId: socket.myPlayerId,
    lastAction: socket.lastAction,
    knownShell: socket.knownShell,
    onShoot: socket.shootPlayer,
    onUseItem: socket.useItem,
    onGrabGun: socket.grabGun,
    socketReceivedLoot: socket.receivedLoot,
    socketShowLootOverlay: socket.showLootOverlay,
    socketAnnouncement: socket.announcement,
    gameOverData: socket.gameOverData
  });

  // Switch between SP and MP - use mpGame once in multiplayer mode
  const game = isMultiplayerMode ? mpGame : spGame;

  // For loot overlay in MP, use socket directly since game state may not be ready yet
  const effectiveShowLootOverlay = isMultiplayerMode ? socket.showLootOverlay : game.showLootOverlay;
  const effectiveReceivedItems = (isMultiplayerMode ? socket.receivedLoot : game.receivedItems) as import('./types').ItemType[];

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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
    if (appState === 'MENU' || appState === 'LOBBY') {
      audioManager.playMusic('menu');
    } else if (appState === 'GAME') {
      const phase = game.gameState.phase;
      if (phase === 'GAME_OVER') {
        audioManager.playMusic('endscreen');
      } else if (phase === 'INTRO' || phase === 'BOOT') {
        audioManager.playMusic('menu');
      } else {
        audioManager.playMusic('gameplay');
      }
    }
  }, [appState, game.gameState.phase]);

  // Dealer AI only for singleplayer
  useDealerAI({
    gameState: spGame.gameState,
    dealer: spGame.dealer,
    player: spGame.player,
    knownShell: spGame.knownShell,
    fireShot: spGame.fireShot,
    processItemEffect: spGame.processItemEffect,
    setDealer: spGame.setDealer,
    setPlayer: spGame.setPlayer,
    setTargetAim: spGame.setAimTarget,
    setCameraView: spGame.setCameraView,
    setOverlayText: spGame.setOverlayText,
    isMultiplayer: isMultiplayerMode
  });

  const handleResetSettings = () => setSettings(DEFAULT_SETTINGS);

  // Called when user clicks 'Continue' on the boot/title screen
  const handleBootComplete = useCallback(() => {
    spGame.setGamePhase('INTRO');
    audioManager.playMusic('menu');
  }, [spGame]);

  const handleStartSP = () => {
    setIsMultiplayerMode(false);
    audioManager.stopMusic(); // Stop menu music immediately
    setAppState('LOADING_SP');
  };

  const handleStartMP = () => {
    setSocketError(null);
    setIsMultiplayerMode(true);
    socket.connect();
    audioManager.stopMusic();
    setAppState('LOADING_MP');
  };

  const handleLobbyStart = () => {
    socket.startGame();
  };

  const onLoadingComplete = () => {
    if (appState === 'LOADING_MP') {
      if (socket.isConnected) setAppState('LOBBY');
    }
    if (appState === 'LOADING_SP') {
      setAppState('GAME');
      spGame.resetGame(true);
      setTimeout(() => spGame.startGame(spGame.playerName), 100);
    }
    if (appState === 'LOADING_GAME') {
      setAppState('GAME');
    }
  };

  const handleBackToMenu = () => {
    if (appState === 'LOBBY' || appState === 'LOADING_MP') {
      socket.disconnect();
    }
    setIsMultiplayerMode(false);
    setAppState('GAME');
    spGame.resetGame(true);
  };

  // Handlers for shooting and items
  const handleFireShot = (target: 'PLAYER' | 'DEALER') => {
    if (isMultiplayerMode && socket.gameStateData && socket.myPlayerId) {
      mpGame.fireShot('PLAYER', target);
    } else {
      spGame.fireShot('PLAYER', target);
    }
  };

  const handleUseItem = (index: number) => {
    if (isMultiplayerMode && socket.gameStateData) {
      mpGame.usePlayerItem(index);
    } else {
      spGame.usePlayerItem(index);
    }
  };

  const handlePickupGun = () => {
    if (isMultiplayerMode && socket.gameStateData) {
      mpGame.pickupGun();
    } else {
      spGame.pickupGun();
    }
  };

  // MP game over handlers
  const handlePlayAgain = () => {
    socket.requestRestart();
    setAppState('LOBBY');
  };

  const handleMainMenu = () => {
    socket.disconnect();
    setIsMultiplayerMode(false);
    // Add loading?
    setAppState('GAME');
    spGame.resetGame(true);
  };

  const handleRestartSP = () => {
    setAppState('LOADING_SP');
    spGame.resetGame(false);
  };

  // Check if MP game over
  const showMpGameOver = isMultiplayerMode && socket.gameOverData;

  return (
    <div
      className={`relative w-full h-screen bg-black overflow-hidden select-none crt text-stone-200 cursor-crosshair`}
      onClick={() => audioManager.initialize()}
      onKeyDown={() => audioManager.initialize()}
    >

      {/* 3D Scene */}
      <ThreeScene
        isSawed={game.player.isSawedActive || game.dealer.isSawedActive}
        isPlayerCuffed={game.player.isHandcuffed}
        knownShell={game.knownShell}
        onGunClick={() => { }}
        aimTarget={game.aimTarget}
        cameraView={game.cameraView}
        animState={game.animState}
        turnOwner={game.gameState.turnOwner}
        settings={settings}
        players={isMultiplayerMode && socket.gameStateData
          ? Object.values(socket.gameStateData.players)
          : socket.players}
        playerId={isMultiplayerMode ? socket.myPlayerId : spGame.playerName}
        messages={socket.messages}
      />

      {/* Game UI - Uses same components for SP and MP */}
      <GameUI
        gameState={game.gameState}
        player={game.player}
        dealer={game.dealer}
        logs={game.logs}
        overlayText={game.overlayText}
        overlayColor={game.overlayColor}
        showBlood={game.showBlood}
        showFlash={game.showFlash}
        showLootOverlay={effectiveShowLootOverlay}
        receivedItems={effectiveReceivedItems}
        triggerHeal={game.animState.triggerHeal}
        triggerDrink={game.animState.triggerDrink}
        knownShell={game.knownShell}
        playerName={spGame.playerName}
        cameraView={game.cameraView}
        aimTarget={game.aimTarget}
        isProcessing={game.isProcessing}
        settings={settings}
        onStartGame={handleStartSP}
        onStartMultiplayer={handleStartMP}
        onResetGame={(toMenu) => {
          if (toMenu) {
            setAppState('LOADING_GAME');
            setTimeout(() => {
              handleMainMenu();
            }, 100);
          } else {
            setAppState('LOADING_SP'); // Re-trigger loading
            spGame.resetGame(false);
          }
        }}
        onFireShot={handleFireShot}
        onUseItem={handleUseItem}
        onHoverTarget={game.setAimTarget}
        onPickupGun={handlePickupGun}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onUpdateName={spGame.setPlayerName}
        messages={socket.messages}
        onSendMessage={socket.sendMessage}
        isMultiplayer={isMultiplayerMode && !!socket.gameStateData}
        mpGameState={socket.gameStateData}
        mpMyPlayerId={socket.myPlayerId}
        onMpShoot={socket.shootPlayer}
        onStealItem={spGame.stealItem}
        onBootComplete={handleBootComplete}
      />

      {/* MP Game Over Screen */}
      {showMpGameOver && socket.gameOverData && (
        <MultiplayerGameOver
          winnerName={socket.gameOverData.winnerName}
          isWinner={socket.gameOverData.winnerId === socket.myPlayerId}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Loading Screens */}
      {(appState === 'LOADING_SP' || appState === 'LOADING_MP' || appState === 'LOADING_GAME') && (
        <div className="absolute inset-0 z-[100]">
          <LoadingScreen
            onComplete={onLoadingComplete}
            text={appState === 'LOADING_GAME' ? "INITIALIZING TABLE..." : (appState === 'LOADING_SP' ? "LOADING..." : "CONNECTING...")}
            duration={appState === 'LOADING_GAME' ? 4000 : 2500}
            serverCheck={appState === 'LOADING_MP'}
            onBack={handleBackToMenu}
          />
        </div>
      )}

      {/* Lobby */}
      {appState === 'LOBBY' && (
        <div className="absolute inset-0 z-[100]">
          <MultiplayerLobby
            onStartGame={handleLobbyStart}
            onBack={handleBackToMenu}
            playerName={spGame.playerName || "PLAYER"}
            socketData={socket}
            errorMsg={socketError}
          />
        </div>
      )}

      {/* Settings */}
      {isSettingsOpen && (
        <SettingsMenu
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setIsSettingsOpen(false)}
          onResetDefaults={handleResetSettings}
        />
      )}

      {/* Tutorial Guide */}
      {isGuideOpen && (
        <TutorialGuide
          onClose={() => setIsGuideOpen(false)}
        />
      )}
    </div>
  );
}