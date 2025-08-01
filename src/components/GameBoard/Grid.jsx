import React, { useEffect, useState } from 'react';
import Cell from './Cell';
import { CELL_SIZE } from './types';

const Grid = ({
  gridConfig,
  backgroundImage,
  backgroundConfig,
  playerPositions,
  selectedPlayer,
  setSelectedPlayer,
  localPlayerId,
  attacks,
  currentAttack,
  setCurrentAttack,
  onHit // New prop for hit detection
}) => {
  // Force periodic re-renders so attack animations progress
  const [, setRefresh] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRefresh(r => r + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

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
            localPlayerId={localPlayerId}
            attacks={attacks}
            currentAttack={currentAttack}
            setCurrentAttack={setCurrentAttack}
            onHit={onHit} // Pass the hit handler
          />
        ))}
      </div>
      <div className="text-sm text-gray-600">
        {selectedPlayer ? 
          selectedPlayer === localPlayerId ?
            `You are selected (Use arrow keys to move)` :
            `Watching ${selectedPlayer}'s token` : 
          'Click your token to move it'}
      </div>
    </div>
  );
};

export default Grid;
