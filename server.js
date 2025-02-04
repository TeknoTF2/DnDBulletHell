const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = http.createServer(expressApp);
  const io = new Server(server);

  // Game state
  const gameState = {
    players: new Map(),
    activeAttacks: []
  };

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle player joining
    socket.on('joinGame', (playerData) => {
      gameState.players.set(socket.id, {
        ...playerData,
        id: socket.id
      });
      io.emit('playersUpdate', Array.from(gameState.players.values()));
    });

    // Handle player movement
    socket.on('playerMove', (position) => {
      const player = gameState.players.get(socket.id);
      if (player) {
        player.x = position.x;
        player.y = position.y;
        io.emit('playersUpdate', Array.from(gameState.players.values()));
      }
    });

    // Handle new attack patterns
    socket.on('launchAttack', (attack) => {
      const attackWithId = {
        ...attack,
        id: Date.now(),
        createdBy: socket.id
      };
      gameState.activeAttacks.push(attackWithId);
      io.emit('newAttack', attackWithId);

      // Remove attack after all phases complete
      const maxPhase = Math.max(...attack.cells.map(cell => cell.phase));
      setTimeout(() => {
        gameState.activeAttacks = gameState.activeAttacks.filter(a => a.id !== attackWithId.id);
        io.emit('attackComplete', attackWithId.id);
      }, (maxPhase + 1) * 800); // 800ms per phase
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      gameState.players.delete(socket.id);
      io.emit('playersUpdate', Array.from(gameState.players.values()));
      console.log('Client disconnected:', socket.id);
    });
  });

  // Handle Next.js requests
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Server listening on port ${PORT}`);
  });
});
