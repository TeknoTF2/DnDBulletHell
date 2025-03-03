const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 10000;
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
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e8 // 100 MB max buffer size
  });

  // Game state
  const gameState = {
    players: new Map(),
    activeAttacks: [],
    backgroundChunks: new Map(),
    savedAttacks: [], // Added this to store saved attacks
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

  // Add periodic check for cooldown expiry
  setInterval(() => {
    for (const [socketId, player] of gameState.players.entries()) {
      if (player.movementCooldown) {
        const now = Date.now();
        const timeSinceCooldown = now - player.movementCooldown;
        if (timeSinceCooldown >= 6000) {
          player.movementPoints = player.speed;
          player.movementCooldown = null;
          io.emit('playersUpdate', Array.from(gameState.players.values()));
        }
      }
    }
  }, 100); // Check every 100ms

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
        id: socket.id,
        speed: playerData.speed || 3, // Default movement speed
        movementCooldown: null,
        movementPoints: playerData.speed || 3, // Initialize movement points
        hitCount: 0 // Initialize hit counter
      });
      io.emit('playersUpdate', Array.from(gameState.players.values()));
      socket.emit('boardConfigUpdate', gameState.boardConfig);
    });

    socket.on('playerMove', (position) => {
      const player = gameState.players.get(socket.id);
      if (!player) return;
      
      console.log('Move requested by', socket.id, {
        current: { x: player.x, y: player.y },
        requested: position,
        points: player.movementPoints,
        cooldown: player.movementCooldown
      });

      // Check cooldown period
      const now = Date.now();
      const timeSinceCooldown = player.movementCooldown ? now - player.movementCooldown : 6000;
      
      // If 6 seconds have passed since last movement, reset points
      if (timeSinceCooldown >= 6000) {
        console.log('Resetting movement points for player', socket.id);
        player.movementPoints = player.speed;
        player.movementCooldown = null;
        // Ensure we send the update after resetting
        io.emit('playersUpdate', Array.from(gameState.players.values()).map(p => ({
          ...p,
          movementCooldown: p.movementCooldown,
          movementPoints: p.movementPoints
        })));
      }

      // Calculate distance for this move
      const dx = Math.abs(position.x - player.x);
      const dy = Math.abs(position.y - player.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if player has enough movement points
      if (distance <= player.movementPoints) {
        // Update position
        player.x = position.x;
        player.y = position.y;
        
        // Deduct movement points
        player.movementPoints -= distance;
        
        // Start/update cooldown timer
        player.movementCooldown = now;
        
        console.log('Movement processed:', {
          playerId: socket.id,
          remainingPoints: player.movementPoints,
          cooldown: player.movementCooldown
        });
        
        // Make sure we're sending ALL the player data including cooldown and points
        io.emit('playersUpdate', Array.from(gameState.players.values()).map(p => ({
          ...p,
          movementCooldown: p.movementCooldown,
          movementPoints: p.movementPoints
        })));
      } else {
        console.log('Movement prevented:', {
          playerId: socket.id,
          reason: distance > player.movementPoints ? 'insufficient points' : 'on cooldown',
          distance,
          points: player.movementPoints,
          timeSinceCooldown
        });
      }
    });

    socket.on('updatePlayerToken', (tokenData) => {
      const player = gameState.players.get(socket.id);
      if (!player) return;

      // Handle speed updates
      if (tokenData.speed !== undefined) {
        const newSpeed = Math.max(1, Math.min(10, parseInt(tokenData.speed) || 3));
        player.speed = newSpeed;
        // Reset movement points if speed changes
        if (!player.movementCooldown) {
          player.movementPoints = newSpeed;
        }
      }

      // Update other token properties
      Object.assign(player, {
        ...tokenData,
        speed: player.speed // Preserve the validated speed value
      });

      io.emit('playersUpdate', Array.from(gameState.players.values()));
    });

    socket.on('updateGridConfig', (config) => {
      gameState.boardConfig.grid = config;
      io.emit('boardConfigUpdate', gameState.boardConfig);
    });

    socket.on('updateBackgroundConfig', (config) => {
      gameState.boardConfig.background = config;
      io.emit('boardConfigUpdate', gameState.boardConfig);
    });

    socket.on('backgroundChunk', (data) => {
      const { chunk, index, total } = data;
      
      if (!gameState.backgroundChunks.has(socket.id)) {
        gameState.backgroundChunks.set(socket.id, new Array(total).fill(null));
      }
      
      const chunks = gameState.backgroundChunks.get(socket.id);
      chunks[index] = chunk;
      
      if (!chunks.includes(null)) {
        const completeImage = chunks.join('');
        gameState.boardConfig.background.image = completeImage;
        io.emit('boardConfigUpdate', gameState.boardConfig);
        gameState.backgroundChunks.delete(socket.id);
      }
    });

    // NEW: Add these handlers for attack management

    // Handler for saving attacks
    socket.on('saveAttack', (attack) => {
      console.log('Saving attack pattern:', attack);
      
      // Simple validation
      if (!attack || !attack.cells || !Array.isArray(attack.cells) || attack.cells.length === 0) {
        console.error('Invalid attack data received');
        return;
      }
      
      // Make sure cells have required properties
      const validatedCells = attack.cells.map(cell => ({
        x: parseInt(cell.x) || 0,
        y: parseInt(cell.y) || 0,
        phase: parseInt(cell.phase) || 0
      }));
      
      const attackWithId = {
        ...attack,
        id: attack.id || Date.now(),
        createdBy: socket.id,
        cells: validatedCells
      };

      // Store in gameState
      gameState.savedAttacks.push(attackWithId);
      
      // Broadcast saved attacks to all clients
      io.emit('savedAttacksUpdate', gameState.savedAttacks);
    });

    // Handler for getting saved attacks
    socket.on('getSavedAttacks', () => {
      socket.emit('savedAttacksUpdate', gameState.savedAttacks);
    });

    // Updated launchAttack handler
 socket.on('launchAttack', (attack) => {
  console.log('Launching attack:', attack);
  
  // Validate attack data
  if (!attack?.cells || !Array.isArray(attack.cells) || attack.cells.length === 0) {
    console.error('Invalid attack data received for launch');
    return;
  }

  // Ensure all cells have required properties and are numbers
  const validatedCells = attack.cells.filter(cell => 
    cell && typeof cell.x !== 'undefined' && typeof cell.y !== 'undefined'
  ).map(cell => ({
    x: Number(cell.x),
    y: Number(cell.y),
    phase: Number(cell.phase || 0)
  }));

  if (validatedCells.length === 0) {
    console.error('No valid cells in attack data for launch');
    return;
  }

  // Create the attack object with current timestamp
  const now = Date.now();
  const attackWithId = {
    ...attack,
    id: now,
    startTime: now,
    createdBy: socket.id,
    cells: validatedCells
  };

  // Detailed debug
  console.log(`Launching attack ${attackWithId.id} with ${validatedCells.length} cells`);
  console.log(`First 3 cells:`, validatedCells.slice(0, 3));
  console.log(`Max phase:`, Math.max(...validatedCells.map(c => c.phase || 0)));

  // Add to active attacks
  gameState.activeAttacks.push(attackWithId);
  
  // Log active attacks
  console.log(`Active attacks: ${gameState.activeAttacks.length}`);
  
  // Send to all clients
  io.emit('newAttack', attackWithId);

  // Calculate total duration including all phases
  const maxPhase = Math.max(...validatedCells.map(cell => cell.phase || 0));
  const totalDuration = (maxPhase + 1) * 800 + 1500; // 800ms per phase + 1500ms for warning+active

  console.log(`Attack ${attackWithId.id} will last for ${totalDuration}ms (max phase: ${maxPhase})`);

  // Remove attack after completion
  setTimeout(() => {
    gameState.activeAttacks = gameState.activeAttacks.filter(a => a.id !== attackWithId.id);
    console.log(`Attack ${attackWithId.id} completed and removed. Remaining active attacks: ${gameState.activeAttacks.length}`);
    io.emit('attackComplete', attackWithId.id);
  }, totalDuration);
});

    // Add handler for player hits
    socket.on('playerHit', (data) => {
      if (!data.playerId) return;
      
      const player = gameState.players.get(data.playerId);
      if (!player) return;
      
      // Initialize hitCount if it doesn't exist
      if (!player.hitCount) player.hitCount = 0;
      
      // Increment hit count
      player.hitCount++;
      
      console.log(`Player ${data.playerId} hit! Count: ${player.hitCount}`);
      
      // Broadcast to all clients
      io.emit('playerHit', { 
        playerId: data.playerId, 
        hitCount: player.hitCount 
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      gameState.backgroundChunks.delete(socket.id);
      gameState.players.delete(socket.id);
      io.emit('playersUpdate', Array.from(gameState.players.values()));
    });
  });

  // Next.js page handling
  expressApp.all('*', (req, res) => {
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
