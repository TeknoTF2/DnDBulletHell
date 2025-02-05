import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Grid from './Grid';
import BackgroundSettings from './BackgroundSettings';
import PlayerControls from './PlayerControls';
import AttackPatterns from './AttackPatterns';
import { useSocket } from '../../context/SocketContext';
import { CELL_SIZE, INITIAL_BACKGROUND_CONFIG, GRID_LIMITS } from './types';

const GameBoard = () => {
  const { socket, isConnected } = useSocket();
  
  // Grid configuration
  const [gridConfig, setGridConfig] = useState({
    width: 15,
    height: 15
  });
  
  // Image states
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundConfig, setBackgroundConfig] = useState(INITIAL_BACKGROUND_CONFIG);
  
  // Game state
  const [playerPositions, setPlayerPositions] = useState([]);
  const [localPlayerId, setLocalPlayerId] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [attacks, setAttacks] = useState([]);
  const [savedAttacks, setSavedAttacks] = useState([]);
  const [currentAttack, setCurrentAttack] = useState({
    name: '',
    phases: [[]],
    currentPhase: 0
  });

  // Initialize connection and local player
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join the game
    const initialPosition = {
      x: Math.floor(gridConfig.width / 2),
      y: Math.floor(gridConfig.height / 2),
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      tokenConfig: {
        shape: 'circle',
        size: 'fill',
        opacity: 1
      }
    };

    socket.emit('joinGame', initialPosition);
    setLocalPlayerId(socket.id);

    // Listen for player updates
    socket.on('playersUpdate', (players) => {
      setPlayerPositions(players);
    });

    // Listen for new attacks
    socket.on('newAttack', (attack) => {
      setAttacks(prev => [...prev, attack]);
    });

    // Listen for attack completion
    socket.on('attackComplete', (attackId) => {
      setAttacks(prev => prev.filter(a => a.id !== attackId));
    });

    // Listen for board configuration updates
    socket.on('boardConfigUpdate', (config) => {
      setGridConfig(config.grid);
      if (config.background.image) {
        setBackgroundImage(config.background.image);
      }
      setBackgroundConfig(config.background.config);
    });

    return () => {
      socket.off('playersUpdate');
      socket.off('newAttack');
      socket.off('attackComplete');
      socket.off('boardConfigUpdate');
    };
  }, [socket, isConnected]);

  // Handle player movement
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedPlayer || !socket || selectedPlayer !== localPlayerId) return;
      
      const player = playerPositions.find(p => p.id === selectedPlayer);
      if (!player) return;

      let newPosition = { x: player.x, y: player.y };
      let moved = false;
      
      switch(e.key) {
        case 'ArrowUp':
          if (player.y > 0) {
            newPosition.y--;
            moved = true;
          }
          break;
        case 'ArrowDown':
          if (player.y < gridConfig.height - 1) {
            newPosition.y++;
            moved = true;
          }
          break;
        case 'ArrowLeft':
          if (player.x > 0) {
            newPosition.x--;
            moved = true;
          }
          break;
        case 'ArrowRight':
          if (player.x < gridConfig.width - 1) {
            newPosition.x++;
            moved = true;
          }
          break;
        default:
          return;
      }
      
      if (moved) {
        socket.emit('playerMove', newPosition);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPlayer, playerPositions, gridConfig, socket, localPlayerId]);

  const updateGridConfig = (newConfig) => {
    setGridConfig(newConfig);
    if (socket) {
      socket.emit('updateGridConfig', newConfig);
    }
  };

  const compressImage = async (imageData, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = imageData;
    });
  };

  // Image handling functions
  const handleImageUpload = async (e, type, playerId = null) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const compressedImage = await compressImage(event.target.result);
        
        if (type === 'background') {
          setBackgroundImage(compressedImage);
          if (socket) {
            // Split the image data into chunks
            const chunkSize = 100 * 1024; // 100KB chunks
            const chunks = [];
            for (let i = 0; i < compressedImage.length; i += chunkSize) {
              chunks.push(compressedImage.slice(i, i + chunkSize));
            }
            
            // Send chunks one by one
            chunks.forEach((chunk, index) => {
              socket.emit('backgroundChunk', {
                chunk,
                index,
                total: chunks.length
              });
            });
          }
        } else if (type === 'token' && playerId === localPlayerId) {
          socket.emit('updatePlayerToken', { image: compressedImage });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const removeImage = (type, playerId = null) => {
    if (type === 'background') {
      setBackgroundImage(null);
      if (socket) {
        socket.emit('updateBackgroundConfig', {
          image: null,
          config: backgroundConfig
        });
      }
    } else if (type === 'token' && playerId === localPlayerId) {
      socket.emit('updatePlayerToken', { image: null });
    }
  };

  const updateBackgroundConfig = (newConfig) => {
    setBackgroundConfig(newConfig);
    if (socket) {
      socket.emit('updateBackgroundConfig', {
        image: backgroundImage,
        config: newConfig
      });
    }
  };

  const updateTokenConfig = (playerId, key, value) => {
    if (playerId !== localPlayerId || !socket) return;
    
    if (key === 'speed') {
      socket.emit('updatePlayerToken', { speed: value });
    } else {
      socket.emit('updatePlayerToken', { 
        tokenConfig: { 
          ...playerPositions.find(p => p.id === playerId)?.tokenConfig,
          [key]: value 
        } 
      });
    }
  };

  // Attack handlers
  const saveAttack = (attack) => {
    if (!attack?.cells || attack.cells.length === 0) return;
    setSavedAttacks(prev => [...prev, attack]);
  };

  const launchAttack = (attack) => {
    if (!socket) return;
    
    const validatedAttack = {
      ...attack,
      cells: attack.cells.map(cell => ({
        x: parseInt(cell.x) || 0,
        y: parseInt(cell.y) || 0,
        phase: parseInt(cell.phase) || 0
      }))
    };
    
    socket.emit('launchAttack', validatedAttack);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Connecting to server...</p>
      </div>
    );
  }

  return (
    <Card className="p-6 bg-gray-50">
      <div className="mb-4 space-y-4">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Width:</label>
            <input
              type="number"
              min={GRID_LIMITS.min}
              max={GRID_LIMITS.max}
              value={gridConfig.width}
              onChange={(e) => updateGridConfig({
                ...gridConfig,
                width: Math.max(GRID_LIMITS.min, Math.min(GRID_LIMITS.max, parseInt(e.target.value) || GRID_LIMITS.min))
              })}
              className="border rounded p-2 w-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height:</label>
            <input
              type="number"
              min={GRID_LIMITS.min}
              max={GRID_LIMITS.max}
              value={gridConfig.height}
              onChange={(e) => updateGridConfig({
                ...gridConfig,
                height: Math.max(GRID_LIMITS.min, Math.min(GRID_LIMITS.max, parseInt(e.target.value) || GRID_LIMITS.min))
              })}
              className="border rounded p-2 w-24"
            />
          </div>
        </div>
        
        <BackgroundSettings
          backgroundImage={backgroundImage}
          backgroundConfig={backgroundConfig}
          setBackgroundConfig={updateBackgroundConfig}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
        />
      </div>

      <div className="flex gap-6">
        <Grid
          gridConfig={gridConfig}
          backgroundImage={backgroundImage}
          backgroundConfig={backgroundConfig}
          playerPositions={playerPositions}
          selectedPlayer={selectedPlayer}
          setSelectedPlayer={setSelectedPlayer}
          localPlayerId={localPlayerId}
          attacks={attacks}
          currentAttack={currentAttack}
          setCurrentAttack={setCurrentAttack}
        />
        
        <div className="flex flex-col gap-4">
          <PlayerControls
            playerPositions={playerPositions}
            localPlayerId={localPlayerId}
            handleImageUpload={handleImageUpload}
            removeImage={removeImage}
            updateTokenConfig={updateTokenConfig}
          />
          
          <AttackPatterns
            currentAttack={currentAttack}
            setCurrentAttack={setCurrentAttack}
            savedAttacks={savedAttacks}
            saveAttack={saveAttack}
            launchAttack={launchAttack}
          />
        </div>
      </div>
    </Card>
  );
};

export default GameBoard;
