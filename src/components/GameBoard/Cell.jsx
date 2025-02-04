import React from 'react';
import { CELL_SIZE, TOKEN_SHAPES } from './types';

const Cell = ({ 
  x, 
  y, 
  playerPositions,
  selectedPlayer,
  setSelectedPlayer,
  localPlayerId,
  attacks,
  currentAttack,
  setCurrentAttack
}) => {
  const player = playerPositions.find(p => p.x === x && p.y === y);
  const isAttack = attacks.some(attack => 
    attack.cells.some(cell => cell.x === x && cell.y === y && cell.phase === attack.currentPhase)
  );
  const isPatternCell = currentAttack.phases[currentAttack.currentPhase].some(p => p.x === x && p.y === y);
  
  return (
    <div
      className={`border border-gray-300 ${
        isAttack ? 'bg-red-500/50' :
        isPatternCell ? 'bg-yellow-200/50' :
        'bg-transparent'
      }`}
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        position: 'relative',
      }}
      onClick={(e) => {
        // If clicking a player token, don't handle the grid click
        if (e.target !== e.currentTarget) return;

        const isAlreadySelected = currentAttack.phases[currentAttack.currentPhase].some(p => p.x === x && p.y === y);
        
        setCurrentAttack(prev => ({
          ...prev,
          phases: prev.phases.map((phase, idx) => 
            idx === prev.currentPhase 
              ? isAlreadySelected
                ? phase.filter(p => !(p.x === x && p.y === y)) // Remove if already selected
                : [...phase, { x, y, phase: prev.currentPhase }] // Add if not selected
              : phase
          )
        }));
      }}
    >
      {player && (
        <div
          className={`absolute inset-2 cursor-pointer overflow-hidden ${TOKEN_SHAPES[player.tokenConfig?.shape || 'circle'].class}`}
          style={{ 
            opacity: player.tokenConfig?.opacity || 1,
            backgroundColor: player.color,
            border: player.id === selectedPlayer ? '2px solid white' : 'none',
            boxShadow: player.id === selectedPlayer ? '0 0 0 2px black' : 'none'
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent grid click
            if (player.id === localPlayerId) {
              setSelectedPlayer(prev => prev === player.id ? null : player.id);
            }
          }}
        >
          {player.image ? (
            <img 
              src={player.image} 
              alt={`Player ${player.id}`}
              className={`w-full h-full ${
                player.tokenConfig?.size === 'fill' ? 'object-cover' : 'object-contain'
              }`}
            />
          ) : (
            <div className="w-full h-full" />
          )}
          {player.id === localPlayerId && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center">
              You
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cell;
