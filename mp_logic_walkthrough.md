# Multiplayer Implementation Walkthrough

## Overview
This document outlines the implementation of the multiplayer opponent logic, ensuring two human players fight each other instead of their local AI dealers.

## Changes

### 1. Server-Side Synchronization
- Modified `server/index.js` to accept `gameData` in the `startGame` event.
- The `gameStarted` event now broadcasts both the `room` and `gameData` to all clients, ensuring they start with the exact same:
  - Shell Configuration (Chamber)
  - Item Distribution
  - Turn Order

### 2. Game Logic Updates (`useGameLogic.ts`)
- **State Overrides**: Updated `startGame` and `startRound` to accept overrides for:
  - `chamber` (Shells)
  - `pItems` (Player Items)
  - `dItems` (Dealer/Opponent Items)
  - `turnOwner` (Who goes first)
- **Opponent Naming**: Added `getOpponentName()` helper and updated logic to display the Opponent's name in logs instead of "DEALER".
- **Shooting Context**: Updated `fireShot` to pass the `opponentName` to the `performShot` function, allowing for dynamic log messages (e.g., "PLAYER2 ELIMINATED" instead of "DEALER ELIMINATED").

### 3. Multiplayer Hook (`useMultiplayer.ts`)
- Updated `startGame` to accept the generated `gameData` payload and transmit it to the server.

### 4. Application Logic (`App.tsx`)
- **Host Authority**: implemented `handleStartMPGame` where the Host generates the initial random state (chamber, items, turn order) and sends it to the server.
- **Client Synchronization**: In the `gameStarted` listener, clients now apply the received `gameData`. Logic handles mapping "Host Items" and "Client Items" correctly based on whether the local player is Host or Client.
- **AI Disable**: Explicitly disabled `useDealerAI` when `isMultiplayer` is active.

### 5. Utility Refactoring (`inventory.ts`, `shooting.ts`)
- **Inventory**: Refactored `inventory.ts` to export `generateLootBatch`, allowing the Host to generate valid item sets without applying them to local state immediately.
- **Shooting**: Updated `performShot` to use `opponentName` from the context for all logs and status updates.

## Verification
To verify the fix:
1.  **Start a Multiplayer Game**: Connect two clients.
2.  **Check Sync**: Verify both players see the exact same shell count (Live/Blank) and item distribution in logs/overlay.
3.  **Check Turns**: Verify one player gets "YOUR MOVE" and the other gets "OPPONENT'S MOVE".
4.  **Combat**:
    - Player A shoots Player B.
    - Player A sees: Shooting Opponent.
    - Player B sees: Opponent Shooting Me.
    - Health bars update correctly on both screens.
5.  **Logs**: logs should reference the Opponent's name, not "DEALER".
