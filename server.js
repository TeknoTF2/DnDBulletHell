const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 10000; // Changed to Render's default port
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  
  // Add error handling middleware
  expressApp.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).send('Something broke!');
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Game state with added board configuration
  const gameState = {
    players: new Map(),
    activeAttacks: [],
    boardConfig: {
      grid: {
        width: 15,
        height: 15
      },
      background: {
        image: null,
        config: {
          size: 'cover',
          position: 'center',
          opacity: 1
        }
      }
    }
  };

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Add error handler for socket
    socket.on('error', (error) => {
      console.error('Socket error for client:', socket.id, error);
    });

    socket.on('joinGame', (playerData) => {
      console.log('Player joined:', socket.id, playerData);
      gameState.players.set(socket.id, {
        ...playerData,
        id: socket.id
      });
      io.emit('playersUpdate', Array.from(gameState.players.values()));
      // Send current board configuration to new player
      socket.emit('boardConfigUpdate', gameState.boardConfig);
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

    // New board configuration handlers
    socket.on('updateGridConfig', (config) => {
      gameState.boardConfig.grid = config;
      io.emit('boardConfigUpdate', gameState.boardConfig);
    });

    socket.on('updateBackgroundConfig', (config) => {
      gameState.boardConfig.background = config;
      io.emit('boardConfigUpdate', gameState.boardConfig);
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

  // Next.js page handling with debug logging
  expressApp.all('*', (req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
      return;
    }
    console.log(`> Ready on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Error during app preparation:', err);
  process.exit(1);
});
