const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, '../client/dist')));

const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store game rooms
const gameRooms = new Map();

// Planning poker card values
const CARD_VALUES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?', '∞'];

// Game room class
class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = new Map();
    this.votes = new Map();
    this.votesRevealed = false;
    this.createdAt = new Date();
  }

  addPlayer(socketId, playerName) {
    this.players.set(socketId, {
      id: socketId,
      name: playerName,
      hasVoted: false,
      vote: null
    });
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.votes.delete(socketId);
  }

  castVote(socketId, vote) {
    if (this.players.has(socketId)) {
      this.votes.set(socketId, vote);
      this.players.get(socketId).hasVoted = true;
      this.players.get(socketId).vote = vote;
    }
  }

  revealVotes() {
    this.votesRevealed = true;
  }

  resetVotes() {
    this.votes.clear();
    this.votesRevealed = false;
    // Reset player vote status
    for (let player of this.players.values()) {
      player.hasVoted = false;
      player.vote = null;
    }
  }

  getGameState() {
    return {
      id: this.id,
      players: Array.from(this.players.values()),
      votes: this.votesRevealed ? Object.fromEntries(this.votes) : {},
      votesRevealed: this.votesRevealed,
      allVoted: this.players.size > 0 && Array.from(this.players.values()).every(p => p.hasVoted)
    };
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join game room
  socket.on('join-room', ({ roomId, playerName }) => {
    if (!roomId || !playerName) {
      socket.emit('error', { message: 'Room ID and player name are required' });
      return;
    }

    // Create room if it doesn't exist
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, new GameRoom(roomId));
    }

    const room = gameRooms.get(roomId);
    room.addPlayer(socket.id, playerName);
    socket.join(roomId);

    // Notify all players in the room
    io.to(roomId).emit('game-state', room.getGameState());
    console.log(`Player ${playerName} joined room ${roomId}`);
  });

  // Cast vote
  socket.on('cast-vote', ({ roomId, vote }) => {
    const room = gameRooms.get(roomId);
    if (room && room.players.has(socket.id)) {
      room.castVote(socket.id, vote);
      io.to(roomId).emit('game-state', room.getGameState());
    }
  });

  // Reveal votes
  socket.on('reveal-votes', ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (room) {
      room.revealVotes();
      io.to(roomId).emit('game-state', room.getGameState());
    }
  });

  // Reset votes
  socket.on('reset-votes', ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (room) {
      room.resetVotes();
      io.to(roomId).emit('game-state', room.getGameState());
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from all rooms
    for (let [roomId, room] of gameRooms.entries()) {
      if (room.players.has(socket.id)) {
        room.removePlayer(socket.id);
        io.to(roomId).emit('game-state', room.getGameState());
        
        // Clean up empty rooms
        if (room.players.size === 0) {
          gameRooms.delete(roomId);
        }
        break;
      }
    }
  });
});

// Clean up old rooms (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (let [roomId, room] of gameRooms.entries()) {
    if (room.createdAt < oneHourAgo && room.players.size === 0) {
      gameRooms.delete(roomId);
      console.log(`Cleaned up old room: ${roomId}`);
    }
  }
}, 30 * 60 * 1000); // Check every 30 minutes

// Catch-all handler: send back React's index.html file for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
