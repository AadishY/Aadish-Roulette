import React, { useState, useEffect, useCallback } from 'react';
import { ThreeScene } from './components/ThreeScene';
import { GameUI } from './components/GameUI';
import { useGameLogic } from './hooks/useGameLogic';
import { useDealerAI } from './hooks/useDealerAI';
import { useSocket } from './hooks/useSocket';
import { SettingsMenu } from './components/SettingsMenu';
import { GameSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

import { MainMenu } from './components/MainMenu';
import { LoadingScreen } from './components/LoadingScreen';
import { MultiplayerLobby } from './components/MultiplayerLobby';

type AppState = 'MENU' | 'LOADING_SP' | 'LOADING_MP' | 'LOBBY' | 'LOADING_GAME' | 'GAME';

export default function App() {
  const game = useGameLogic();
  const [appState, setAppState] = useState<AppState>('MENU');

  // Socket Hook Hoisted
  const handleConnect = useCallback(() => { }, []);
  const [socketError, setSocketError] = useState<string | null>(null);
  const handleError = useCallback((err: string) => setSocketError(err), []);

  const socket = useSocket(game.playerName || "PLAYER", handleConnect, handleError);

  // Settings State & Logic
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  /* State Machine Simplified:
     - MENU/GAME: Handled by GameUI's internal 'phase' (Intro vs Game).
     - LOADING_MP: Shows loading screen, then Lobby.
     - LOBBY: Shows lobby.
     - LOADING_GAME: Shows loading screen, then starts match.
  */
  const handleStartSP = () => setAppState('LOADING_SP');
  const handleStartMP = () => {
    setSocketError(null);
    socket.connect();
    setAppState('LOADING_MP');
  };

  const handleLobbyStart = () => {
    socket.startGame();
    // Wait for server "game_started" event to actually switch? 
    // For now, assume optimistic or wait for socket event in useEffect?
    // The user requested: "after clicking start game there will be a loading untill alll player connected"
    // We will switch to LOADING_GAME state, but wait for server signal.
    // Actually, let's just trigger the server start. The server will emit 'game_started'.
    // We need to listen to that in App or useSocket.
    // For this step, I'll just keep the local state transition for immediate feedback if host.
    setAppState('LOADING_GAME');
  };

  const onLoadingComplete = () => {
    if (appState === 'LOADING_MP') {
      if (socket.isConnected) setAppState('LOBBY');
      // If not connected, LoadingScreen might handle it via passed error or we stay showing error
    }

    if (appState === 'LOADING_SP') {
      setAppState('GAME');
      game.resetGame();
      setTimeout(() => game.startGame(game.playerName), 100);
    }

    if (appState === 'LOADING_GAME') {
      setAppState('GAME');
      game.resetGame();
      game.startGame(game.playerName);
    }
  };

  const handleBackToMenu = () => {
    if (appState === 'LOBBY' || appState === 'LOADING_MP') {
      socket.disconnect();
    }
    setAppState('GAME');
    game.resetGame(true);
  };

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden select-none crt text-stone-200 cursor-crosshair`}>

      {/* Always Render Scene & UI (UI handles Intro/Menu internally) */}
      <ThreeScene
        isSawed={game.player.isSawedActive}
        onGunClick={() => { }}
        aimTarget={game.aimTarget}
        cameraView={game.cameraView}
        animState={game.animState}
        turnOwner={game.gameState.turnOwner}
        settings={settings}
        players={socket.players}
        playerId={game.playerName}
        messages={socket.messages}
      />
      {/* Pass necessary MP props if needed later (e.g. other players) */}
      {/* For now ThreeScene expects just SP props, we will update it soon */}

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
        onStartGame={handleStartSP}
        onStartMultiplayer={handleStartMP}
        onResetGame={game.resetGame}
        onFireShot={(target) => game.fireShot('PLAYER', target)}
        onUseItem={game.usePlayerItem}
        onHoverTarget={game.setAimTarget}
        onPickupGun={game.pickupGun}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUpdateName={game.setPlayerName}
        messages={socket.messages}
        onSendMessage={socket.sendMessage}
        isMultiplayer={socket.isConnected}
      />

      {/* Overlays for MP Flow */}
      {(appState === 'LOADING_SP' || appState === 'LOADING_MP' || appState === 'LOADING_GAME') && (
        <div className="absolute inset-0 z-[100]">
          <LoadingScreen
            onComplete={onLoadingComplete}
            text={appState === 'LOADING_GAME' ? "INITIALIZING TABLE..." : (appState === 'LOADING_SP' ? "PREPARING SINGLEPLAYER..." : "ESTABLISHING SECURE CONNECTION...")}
            duration={appState === 'LOADING_GAME' ? 4000 : 2500}
            serverCheck={appState === 'LOADING_MP'}
            onBack={handleBackToMenu}
          />
        </div>
      )}

      {appState === 'LOBBY' && (
        <div className="absolute inset-0 z-[100]">
          <MultiplayerLobby
            onStartGame={handleLobbyStart}
            onBack={handleBackToMenu}
            playerName={game.playerName || "PLAYER"}
            // Pass Socket Props
            socketData={socket}
            errorMsg={socketError}
          />
        </div>
      )}

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