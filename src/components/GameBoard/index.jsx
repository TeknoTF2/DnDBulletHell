import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Grid from './Grid';
import BackgroundSettings from './BackgroundSettings';
import PlayerControls from './PlayerControls';
import AttackPatterns from './AttackPatterns';
import { CELL_SIZE, INITIAL_BACKGROUND_CONFIG, PHASE_DELAY } from './types';

const GameBoard = () => {
  // Grid configuration
  const [gridConfig, setGridConfig] = useState({
    width: 15,
    height: 15
  });
  const CELL_SIZE = 40;
  
  // Image states
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundConfig, setBackgroundConfig] = useState({
    size: 'cover',
    position: 'center',
    opacity: 1
  });
  
  // Player state
  const [playerPositions, setPlayerPositions] = useState([
    { 
      id: 'player1', 
      x: Math.floor(gridConfig.width / 2), 
      y: Math.floor(gridConfig.height / 2), 
      color: 'blue',
      image: null,
      tokenConfig: {
        shape: 'circle',
        size: 'fill',
        opacity: 1
      }
    },
    { 
      id: 'player2', 
      x: Math.floor(gridConfig.width / 2) + 1, 
      y: Math.floor(gridConfig.height / 2), 
      color: 'green',
      image: null,
      tokenConfig: {
        shape: 'circle',
        size: 'fill',
        opacity: 1
      }
    }
  ]);

  // Attack states
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [attacks, setAttacks] = useState([]);
  const [savedAttacks, setSavedAttacks] = useState([]);
  const [currentAttack, setCurrentAttack] = useState({
    pattern: [],
    phases: [[]],
    currentPhase: 0,
    name: '',
    color: 'red'
  });

  // Reset player positions when grid size changes
  useEffect(() => {
    setPlayerPositions(prev => prev.map((player, index) => ({
      ...player,
      x: Math.floor(gridConfig.width / 2) + index,
      y: Math.floor(gridConfig.height / 2)
    })));
    setAttacks([]);
    setCurrentAttack(prev => ({
      ...prev,
      pattern: [],
      phases: [[]]
    }));
  }, [gridConfig]);

  // Handle player movement with arrow keys
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedPlayer) return;
      
      const player = playerPositions.find(p => p.id === selectedPlayer);
      if (!player) return;
      
      const newPositions = [...playerPositions];
      const playerIndex = newPositions.findIndex(p => p.id === selectedPlayer);
      
      switch(e.key) {
        case 'ArrowUp':
          if (player.y > 0) newPositions[playerIndex].y--;
          break;
        case 'ArrowDown':
          if (player.y < gridConfig.height - 1) newPositions[playerIndex].y++;
          break;
        case 'ArrowLeft':
          if (player.x > 0) newPositions[playerIndex].x--;
          break;
        case 'ArrowRight':
          if (player.x < gridConfig.width - 1) newPositions[playerIndex].x++;
          break;
      }
      
      setPlayerPositions(newPositions);
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPlayer, playerPositions, gridConfig]);

  // Image handling functions
  const handleImageUpload = (e, type, playerId = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      
      if (type === 'background') {
        setBackgroundImage(imageData);
      } else if (type === 'token' && playerId) {
        setPlayerPositions(prev => prev.map(player => 
          player.id === playerId 
            ? { ...player, image: imageData }
            : player
        ));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type, playerId = null) => {
    if (type === 'background') {
      setBackgroundImage(null);
    } else if (type === 'token' && playerId) {
      setPlayerPositions(prev => prev.map(player => 
        player.id === playerId 
          ? { ...player, image: null }
          : player
      ));
    }
  };

  const updateTokenConfig = (playerId, key, value) => {
    setPlayerPositions(prev => prev.map(player => 
      player.id === playerId 
        ? { 
            ...player, 
            tokenConfig: { 
              ...player.tokenConfig, 
              [key]: value 
            }
          }
        : player
    ));
  };

  // Grid size handler
  const handleGridSizeChange = (dimension, value) => {
    const newSize = Math.max(5, Math.min(30, parseInt(value) || 5));
    setGridConfig(prev => ({
      ...prev,
      [dimension]: newSize
    }));
  };

  // Attack handlers
  const saveAttack = () => {
    if (currentAttack.phases.every(phase => phase.length === 0)) return;
    
    const newAttack = {
      ...currentAttack,
      id: Date.now(),
      cells: currentAttack.phases.flat().map(cell => ({
        ...cell,
        phase: cell.phase || 0
      }))
    };
    
    setSavedAttacks(prev => [...prev, newAttack]);
    setCurrentAttack({
      pattern: [],
      phases: [[]],
      currentPhase: 0,
      name: '',
      color: 'red'
    });
  };

  const launchAttack = (attack) => {
    const maxPhase = Math.max(...attack.cells.map(cell => cell.phase));
    
    setAttacks(prev => [...prev, { ...attack, currentPhase: 0 }]);

    for (let phase = 1; phase <= maxPhase; phase++) {
      setTimeout(() => {
        setAttacks(prev => 
          prev.map(a => 
            a.id === attack.id 
              ? { ...a, currentPhase: phase }
              : a
          )
        );
      }, phase * PHASE_DELAY);
    }

    setTimeout(() => {
      setAttacks(prev => prev.filter(a => a.id !== attack.id));
    }, (maxPhase + 1) * PHASE_DELAY);
  };

  return (
    <Card className="p-6 bg-gray-50">
      <div className="mb-4 space-y-4">
        {/* Grid size controls */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Width:</label>
            <input
              type="number"
              min="5"
              max="30"
              value={gridConfig.width}
              onChange={(e) => handleGridSizeChange('width', e.target.value)}
              className="border rounded p-2 w-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height:</label>
            <input
              type="number"
              min="5"
              max="30"
              value={gridConfig.height}
              onChange={(e) => handleGridSizeChange('height', e.target.value)}
              className="border rounded p-2 w-24"
            />
          </div>
        </div>
        
        <BackgroundSettings
          backgroundImage={backgroundImage}
          backgroundConfig={backgroundConfig}
          setBackgroundConfig={setBackgroundConfig}
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
          attacks={attacks}
          currentAttack={currentAttack}
          setCurrentAttack={setCurrentAttack}
        />
        
        <div className="flex flex-col gap-4">
          <PlayerControls
            playerPositions={playerPositions}
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
