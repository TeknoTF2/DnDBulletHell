import React from 'react';
import Cell from './Cell';
import { CELL_SIZE } from './types';

const Grid = ({ 
  gridConfig,
  backgroundImage,
  backgroundConfig,
  playerPositions,
  selectedPlayer,
  setSelectedPlayer,
  attacks,
  currentAttack,
  setCurrentAttack
}) => {
  return (
    <div>
      <div 
        className="grid gap-0 mb-4 relative" 
        style={{ 
          width: CELL_SIZE * gridConfig.width,
          gridTemplateColumns: `repeat(${gridConfig.width}, ${CELL_SIZE}px)`,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundSize: backgroundConfig.size,
          backgroundPosition: backgroundConfig.position,
          opacity: backgroundConfig.opacity
        }}
      >
        {Array.from({ length: gridConfig.width * gridConfig.height }).map((_, i) => (
          <Cell
            key={i}
            x={i % gridConfig.width}
            y={Math.floor(i / gridConfig.width)}
            playerPositions={playerPositions}
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
            attacks={attacks}
            currentAttack={currentAttack}
            setCurrentAttack={setCurrentAttack}
          />
        ))}
      </div>
      <div className="text-sm text-gray-600">
        {selectedPlayer ? 
          `Selected: ${selectedPlayer} (Use arrow keys to move)` : 
          'Click a player token to select it'}
      </div>
    </div>
  );
};

export default Grid;
