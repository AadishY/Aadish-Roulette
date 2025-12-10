import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

// Default Route for Browser Check
app.get('/', (req, res) => {
    res.json({
        status: "online",
        message: "Buckshot Roulette Multiplayer Server is Running",
        version: "1.0.0"
    });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all connections for local dev
        methods: ["GET", "POST"]
    }
});

const DEFAULT_ROOM = "BUCKSHOT_LOBBY";
const MAX_PLAYERS = 4;

// Store players: { [socketId]: { name: string, ready: boolean, isHost: boolean } }
let players = {};
let gameActive = false;

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // JOIN REQUEST
    socket.on('join_game', ({ name }) => {
        // Validation Checks
        if (gameActive) {
            socket.emit('error_message', { message: "GAME ALREADY IN PROGRESS" });
            socket.disconnect();
            return;
        }

        const currentPlayers = Object.values(players);
        if (currentPlayers.length >= MAX_PLAYERS) {
            socket.emit('error_message', { message: `LOBBY FULL (${MAX_PLAYERS}/${MAX_PLAYERS})` });
            socket.disconnect();
            return;
        }

        if (currentPlayers.some(p => p.name.toUpperCase() === name.toUpperCase())) {
            socket.emit('error_message', { message: "NAME ALREADY TAKEN" });
            socket.disconnect();
            return;
        }

        // Success - Add Player
        const isHost = currentPlayers.length === 0;
        players[socket.id] = {
            id: socket.id,
            name: name.toUpperCase(),
            ready: false,
            isHost
        };

        socket.join(DEFAULT_ROOM);

        // Notify client success
        socket.emit('joined_successfully', {
            playerId: socket.id,
            isHost,
            players: Object.values(players)
        });

        // Broadcast to specific room AND current socket to be sure
        const allPlayers = Object.values(players);
        io.to(DEFAULT_ROOM).emit('player_update', allPlayers);

        console.log(`${name} joined. Total: ${Object.keys(players).length}`);
    });

    // READY TOGGLE
    socket.on('toggle_ready', () => {
        if (!players[socket.id]) return;
        players[socket.id].ready = !players[socket.id].ready;
        io.to(DEFAULT_ROOM).emit('player_update', Object.values(players));
    });

    // UPDATE SETTINGS (Host Only)
    socket.on('update_settings', (settings) => {
        if (!players[socket.id]?.isHost) return;
        socket.to(DEFAULT_ROOM).emit('settings_update', settings);
    });

    // CHAT MESSAGE
    socket.on('send_message', (message) => {
        if (!players[socket.id]) return;
        const chatMsg = {
            sender: players[socket.id].name,
            text: message,
            timestamp: Date.now()
        };
        io.to(DEFAULT_ROOM).emit('receive_message', chatMsg);
    });

    // START GAME (Host Only)
    socket.on('start_game', () => {
        if (!players[socket.id]?.isHost) return;
        gameActive = true;

        // Random Start
        const playerIds = Object.keys(players);
        const randomStartIdx = Math.floor(Math.random() * playerIds.length);
        const startingPlayerId = playerIds[randomStartIdx];

        io.to(DEFAULT_ROOM).emit('game_started', { startingPlayerId });
        console.log(`Game Started. First Turn: ${players[startingPlayerId].name}`);
    });

    // DISCONNECT
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            console.log(`${players[socket.id].name} disconnected`);
            delete players[socket.id];

            // Assign new host if host left
            const remaining = Object.values(players);
            if (remaining.length > 0 && !remaining.some(p => p.isHost)) {
                // Assign first player as new host
                const newHostId = Object.keys(players)[0];
                players[newHostId].isHost = true;
            } else if (remaining.length === 0) {
                gameActive = false; // Reset game if everyone leaves
            }

            io.to(DEFAULT_ROOM).emit('player_update', remaining);
        }
    });
});

const PORT = 3001;
// Listen on all interfaces
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
