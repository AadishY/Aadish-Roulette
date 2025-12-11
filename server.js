import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.json({
        status: "online",
        message: "Buckshot Roulette Multiplayer Server v3.0",
        version: "3.0.0"
    });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const DEFAULT_ROOM = "BUCKSHOT_LOBBY";
const MAX_PLAYERS = 4;

let players = {};
let lobbySettings = { rounds: 1, items: 3, health: 4 };
let gameActive = false;

let gameState = {
    chamber: [],
    currentShellIndex: 0,
    liveCount: 0,
    blankCount: 0,
    currentTurnPlayerId: null,
    playerOrder: [],
    roundNumber: 1,
    isRoundActive: false,
    winner: null
};

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomItem = () => {
    // Balanced Probabilities - ADRENALINE at 10%
    // BEER: 18%, CIGS: 16%, GLASS: 14%, CUFFS: 14%, PHONE: 10%, SAW: 10%, INVERTER: 8%, ADRENALINE: 10%
    const r = Math.random() * 100;
    if (r < 18) return 'BEER';
    if (r < 34) return 'CIGS';
    if (r < 48) return 'GLASS';
    if (r < 62) return 'CUFFS';
    if (r < 72) return 'PHONE';
    if (r < 82) return 'SAW';
    if (r < 90) return 'INVERTER';
    return 'ADRENALINE';
};

const initializeGame = () => {
    const playerIds = Object.keys(players);
    gameState.playerOrder = playerIds;
    gameState.winner = null;

    const randomStartIdx = Math.floor(Math.random() * playerIds.length);
    gameState.currentTurnPlayerId = playerIds[randomStartIdx];

    playerIds.forEach((id, index) => {
        players[id].hp = lobbySettings.health;
        players[id].maxHp = lobbySettings.health;
        players[id].items = [];
        players[id].isHandcuffed = false;
        players[id].isSawedActive = false;
        players[id].position = index;
        players[id].isAlive = true;
    });

    gameState.roundNumber = 1;
    gameState.isRoundActive = true;

    console.log("[GAME] Players:", gameState.playerOrder.map(id => players[id].name));

    // Emit game init with player positions
    io.to(DEFAULT_ROOM).emit('game_init', {
        players: Object.values(players).map(p => ({
            id: p.id,
            name: p.name,
            position: p.position,
            hp: p.hp,
            maxHp: p.maxHp
        })),
        firstPlayerId: gameState.currentTurnPlayerId,
        firstPlayerName: players[gameState.currentTurnPlayerId].name
    });

    // Start first round after delay
    setTimeout(() => startNewRound(), 2000);
};

const startNewRound = () => {
    const total = randomInt(2, 8);
    const lives = Math.max(1, Math.floor(total / 2));
    const blanks = total - lives;
    let chamber = [...Array(lives).fill('LIVE'), ...Array(blanks).fill('BLANK')];

    for (let i = chamber.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chamber[i], chamber[j]] = [chamber[j], chamber[i]];
    }

    gameState.chamber = chamber;
    gameState.currentShellIndex = 0;
    gameState.liveCount = lives;
    gameState.blankCount = blanks;

    console.log(`[ROUND ${gameState.roundNumber}] ${lives} LIVE, ${blanks} BLANK`);

    Object.keys(players).forEach(id => {
        if (players[id].isAlive) {
            players[id].isHandcuffed = false;
            players[id].isSawedActive = false;
        }
    });

    // Emit round announcement
    io.to(DEFAULT_ROOM).emit('round_announcement', {
        roundNumber: gameState.roundNumber,
        liveCount: lives,
        blankCount: blanks
    });

    // Distribute items after delay
    setTimeout(() => {
        const lootData = distributeItems();

        Object.keys(players).forEach(id => {
            if (players[id].isAlive) {
                io.to(id).emit('loot_received', {
                    items: lootData[id] || [],
                    message: `YOU RECEIVED: ${(lootData[id] || []).join(', ')}`
                });
            }
        });

        // Announce loot to all
        io.to(DEFAULT_ROOM).emit('loot_announcement', {
            message: 'ITEMS DISTRIBUTED'
        });

        // Start turn after loot display
        setTimeout(() => {
            broadcastGameState('round_start');
            announceTurn();
        }, 3500);
    }, 2000);
};

const distributeItems = () => {
    const itemsPerPlayer = lobbySettings.items;
    const lootData = {};

    Object.keys(players).forEach(id => {
        if (players[id].isAlive) {
            const newItems = Array(itemsPerPlayer).fill(null).map(() => getRandomItem());
            lootData[id] = newItems;
            players[id].items = [...players[id].items, ...newItems].slice(0, 8);
            console.log(`[ITEMS] ${players[id].name}:`, newItems);
        }
    });

    return lootData;
};

const announceTurn = () => {
    const currentPlayer = players[gameState.currentTurnPlayerId];
    if (!currentPlayer) return;

    io.to(DEFAULT_ROOM).emit('turn_announcement', {
        playerId: gameState.currentTurnPlayerId,
        playerName: currentPlayer.name,
        message: `${currentPlayer.name}'S TURN`
    });
};

const getNextPlayer = (currentId, skipCuffed = true) => {
    const aliveOrder = gameState.playerOrder.filter(id => players[id]?.isAlive);
    if (aliveOrder.length <= 1) return aliveOrder[0] || null;

    const currentIndex = aliveOrder.indexOf(currentId);
    let nextIndex = (currentIndex + 1) % aliveOrder.length;
    const nextId = aliveOrder[nextIndex];

    if (skipCuffed && players[nextId]?.isHandcuffed) {
        console.log(`[TURN] ${players[nextId].name} CUFFED, skipping`);
        players[nextId].isHandcuffed = false;

        io.to(DEFAULT_ROOM).emit('player_cuffed_skip', {
            playerId: nextId,
            playerName: players[nextId].name
        });

        return getNextPlayer(nextId, false);
    }

    return nextId;
};

const checkWinCondition = () => {
    const alivePlayers = gameState.playerOrder.filter(id => players[id]?.isAlive);

    if (alivePlayers.length === 1) {
        const winnerId = alivePlayers[0];
        gameState.winner = winnerId;

        console.log(`[WIN] ${players[winnerId].name} WINS!`);

        io.to(DEFAULT_ROOM).emit('game_over', {
            winnerId,
            winnerName: players[winnerId].name,
            message: `${players[winnerId].name} WINS!`
        });

        gameActive = false;
        return true;
    }
    return false;
};

const broadcastGameState = (eventType = 'state_update') => {
    const stateData = {
        currentShellIndex: gameState.currentShellIndex,
        liveCount: gameState.liveCount,
        blankCount: gameState.blankCount,
        currentTurnPlayerId: gameState.currentTurnPlayerId,
        playerOrder: gameState.playerOrder,
        roundNumber: gameState.roundNumber,
        players: {}
    };

    Object.keys(players).forEach(id => {
        stateData.players[id] = {
            id,
            name: players[id].name,
            hp: players[id].hp,
            maxHp: players[id].maxHp,
            items: players[id].items,
            isHandcuffed: players[id].isHandcuffed,
            isSawedActive: players[id].isSawedActive,
            position: players[id].position,
            isAlive: players[id].isAlive
        };
    });

    io.to(DEFAULT_ROOM).emit(eventType, stateData);
};

// Socket Handlers
io.on('connection', (socket) => {
    console.log('[CONNECT]', socket.id);

    socket.on('join_game', ({ name }) => {
        if (gameActive) {
            socket.emit('error_message', { message: "GAME IN PROGRESS" });
            return;
        }

        const currentPlayers = Object.values(players);
        if (currentPlayers.length >= MAX_PLAYERS) {
            socket.emit('error_message', { message: `LOBBY FULL (${MAX_PLAYERS}/${MAX_PLAYERS})` });
            return;
        }

        // Use actual player name, not default
        const playerName = (name || 'PLAYER').toUpperCase().trim();

        if (currentPlayers.some(p => p.name === playerName)) {
            socket.emit('error_message', { message: "NAME TAKEN" });
            return;
        }

        const isHost = currentPlayers.length === 0;
        players[socket.id] = {
            id: socket.id,
            name: playerName,
            ready: false,
            isHost,
            hp: 0,
            maxHp: 0,
            items: [],
            isHandcuffed: false,
            isSawedActive: false,
            position: 0,
            isAlive: true
        };

        socket.join(DEFAULT_ROOM);

        socket.emit('joined_successfully', {
            playerId: socket.id,
            isHost,
            playerName: playerName,
            players: Object.values(players)
        });

        io.to(DEFAULT_ROOM).emit('player_update', Object.values(players));
        console.log(`[JOIN] ${playerName} (${Object.keys(players).length}/${MAX_PLAYERS})`);
    });

    socket.on('toggle_ready', () => {
        if (!players[socket.id]) return;
        players[socket.id].ready = !players[socket.id].ready;
        io.to(DEFAULT_ROOM).emit('player_update', Object.values(players));
    });

    socket.on('update_settings', (settings) => {
        if (!players[socket.id]?.isHost) return;
        lobbySettings = settings;
        socket.to(DEFAULT_ROOM).emit('settings_update', settings);
    });

    socket.on('send_message', (message) => {
        if (!players[socket.id]) return;
        io.to(DEFAULT_ROOM).emit('receive_message', {
            sender: players[socket.id].name,
            senderId: socket.id,
            text: message,
            timestamp: Date.now()
        });
    });

    socket.on('start_game', () => {
        if (!players[socket.id]?.isHost) return;
        gameActive = true;
        console.log("[GAME] Starting...");
        initializeGame();
        io.to(DEFAULT_ROOM).emit('game_started', {
            startingPlayerId: gameState.currentTurnPlayerId,
            startingPlayerName: players[gameState.currentTurnPlayerId]?.name
        });
    });

    // Player grabs gun - notify others
    socket.on('player_grab_gun', () => {
        if (!players[socket.id]) return;
        socket.to(DEFAULT_ROOM).emit('player_grabbing', {
            playerId: socket.id,
            playerName: players[socket.id].name
        });
    });

    socket.on('player_shoot', ({ targetId }) => {
        if (!gameActive || gameState.currentTurnPlayerId !== socket.id) return;

        const shooter = players[socket.id];
        const target = players[targetId];
        if (!target) return;

        if (gameState.currentShellIndex >= gameState.chamber.length) {
            startNewRound();
            return;
        }

        const shell = gameState.chamber[gameState.currentShellIndex];
        const isLive = shell === 'LIVE';

        let damage = isLive ? 1 : 0;
        if (isLive && shooter.isSawedActive) {
            damage = 2;
            shooter.isSawedActive = false;
        }

        if (damage > 0) {
            target.hp = Math.max(0, target.hp - damage);
            if (target.hp <= 0) {
                target.isAlive = false;
            }
        }

        gameState.currentShellIndex++;
        if (isLive) gameState.liveCount--;
        else gameState.blankCount--;

        console.log(`[SHOOT] ${shooter.name} -> ${target.name}: ${shell} (${damage}dmg)`);

        io.to(DEFAULT_ROOM).emit('player_action', {
            action: 'shoot',
            shooterId: socket.id,
            shooterName: shooter.name,
            targetId,
            targetName: target.name,
            shell,
            damage,
            targetHp: target.hp,
            isSelfShot: socket.id === targetId,
            message: isLive
                ? `${shooter.name} SHOT ${target.name} - ${damage} DAMAGE!`
                : `${shooter.name} SHOT ${target.name} - CLICK!`
        });

        if (target.hp <= 0) {
            io.to(DEFAULT_ROOM).emit('player_eliminated', {
                playerId: targetId,
                playerName: target.name,
                message: `${target.name} ELIMINATED!`
            });

            gameState.playerOrder = gameState.playerOrder.filter(id => id !== targetId);

            if (checkWinCondition()) return;
        }

        // Determine next turn
        let nextPlayerId;
        if (!isLive && targetId === socket.id) {
            nextPlayerId = socket.id; // Shot self with blank
            io.to(DEFAULT_ROOM).emit('action_message', {
                message: `${shooter.name} GOES AGAIN!`
            });
        } else {
            nextPlayerId = getNextPlayer(socket.id);
        }

        if (gameState.currentShellIndex >= gameState.chamber.length) {
            gameState.roundNumber++;
            setTimeout(() => startNewRound(), 2000);
            return;
        }

        gameState.currentTurnPlayerId = nextPlayerId;
        broadcastGameState('turn_update');

        setTimeout(() => announceTurn(), 1500);
    });

    socket.on('use_item', ({ itemIndex }) => {
        if (!gameActive || gameState.currentTurnPlayerId !== socket.id) return;

        const player = players[socket.id];
        const item = player.items[itemIndex];
        if (!item) return;

        player.items.splice(itemIndex, 1);
        console.log(`[ITEM] ${player.name} used ${item}`);

        let effectData = { playerId: socket.id, playerName: player.name, item };

        switch (item) {
            case 'BEER':
                if (gameState.currentShellIndex < gameState.chamber.length) {
                    const ejected = gameState.chamber[gameState.currentShellIndex];
                    if (ejected === 'LIVE') gameState.liveCount--;
                    else gameState.blankCount--;
                    gameState.currentShellIndex++;
                    effectData.ejectedShell = ejected;
                    effectData.message = `${player.name} EJECTED ${ejected}`;

                    if (gameState.currentShellIndex >= gameState.chamber.length) {
                        gameState.roundNumber++;
                        io.to(DEFAULT_ROOM).emit('item_effect', effectData);
                        setTimeout(() => startNewRound(), 2000);
                        return;
                    }
                }
                break;

            case 'CIGS':
                player.hp = Math.min(player.maxHp, player.hp + 1);
                effectData.message = `${player.name} HEALED 1HP`;
                effectData.newHp = player.hp;
                break;

            case 'GLASS':
                if (gameState.currentShellIndex < gameState.chamber.length) {
                    const nextShell = gameState.chamber[gameState.currentShellIndex];
                    socket.emit('shell_revealed', { shell: nextShell });
                    effectData.message = `${player.name} USED MAGNIFYING GLASS`;
                }
                break;

            case 'SAW':
                player.isSawedActive = true;
                effectData.message = `${player.name} SAWED OFF THE BARREL!`;
                break;

            case 'CUFFS':
                const nextId = getNextPlayer(socket.id, false);
                if (players[nextId]) {
                    players[nextId].isHandcuffed = true;
                    effectData.targetId = nextId;
                    effectData.targetName = players[nextId].name;
                    effectData.message = `${player.name} CUFFED ${players[nextId].name}!`;
                }
                break;
        }

        io.to(DEFAULT_ROOM).emit('item_effect', effectData);
        broadcastGameState('state_update');
    });

    socket.on('request_restart', () => {
        if (!players[socket.id]?.isHost) return;

        // Reset game state
        gameActive = false;
        gameState = {
            chamber: [],
            currentShellIndex: 0,
            liveCount: 0,
            blankCount: 0,
            currentTurnPlayerId: null,
            playerOrder: [],
            roundNumber: 1,
            isRoundActive: false,
            winner: null
        };

        // Reset players
        Object.keys(players).forEach(id => {
            players[id].ready = false;
            players[id].hp = 0;
            players[id].items = [];
            players[id].isAlive = true;
        });

        io.to(DEFAULT_ROOM).emit('game_restart');
        io.to(DEFAULT_ROOM).emit('player_update', Object.values(players));
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            console.log(`[DISCONNECT] ${players[socket.id].name}`);

            if (gameActive) {
                players[socket.id].isAlive = false;
                gameState.playerOrder = gameState.playerOrder.filter(id => id !== socket.id);

                io.to(DEFAULT_ROOM).emit('player_disconnected', {
                    playerId: socket.id,
                    playerName: players[socket.id].name
                });

                if (gameState.currentTurnPlayerId === socket.id) {
                    const next = getNextPlayer(socket.id);
                    if (next) {
                        gameState.currentTurnPlayerId = next;
                        broadcastGameState('turn_update');
                        announceTurn();
                    }
                }

                checkWinCondition();
            }

            delete players[socket.id];

            const remaining = Object.values(players);
            if (remaining.length > 0 && !remaining.some(p => p.isHost)) {
                const newHostId = Object.keys(players)[0];
                if (newHostId) players[newHostId].isHost = true;
            } else if (remaining.length === 0) {
                gameActive = false;
            }

            io.to(DEFAULT_ROOM).emit('player_update', remaining);
        }
    });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`╔═══════════════════════════════════════════════╗`);
    console.log(`║   BUCKSHOT ROULETTE SERVER v3.0              ║`);
    console.log(`║   Port: ${PORT} | Max Players: ${MAX_PLAYERS}                ║`);
    console.log(`╚═══════════════════════════════════════════════╝`);
});
