const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Game state
  const gameState = {
    players: new Map(),
    activeAttacks: []
  };

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinGame', (playerData) => {
      console.log('Player joined:', socket.id, playerData);
      gameState.players.set(socket.id, {
        ...playerData,
        id: socket.id
      });
      io.emit('playersUpdate', Array.from(gameState.players.values()));
    });

    socket.on('playerMove', (position) => {
      const player = gameState.players.get(socket.id);
      if (player) {
        player.x = position.x;
        player.y = position.y;
        io.emit('playersUpdate', Array.from(gameState.players.values()));
      }
    });

    socket.on('updatePlayerToken', (tokenData) => {
      const player = gameState.players.get(socket.id);
      if (player) {
        Object.assign(player, tokenData);
        io.emit('playersUpdate', Array.from(gameState.players.values()));
      }
    });

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
      }, (maxPhase + 1) * 800);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      gameState.players.delete(socket.id);
      io.emit('playersUpdate', Array.from(gameState.players.values()));
    });
  });

  // Next.js page handling
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
