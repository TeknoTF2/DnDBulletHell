import React, { useEffect, useRef } from 'react';
import { CELL_SIZE, TOKEN_SHAPES } from './types';

const Cell = ({ 
  x, 
  y, 
  playerPositions,
  selectedPlayer,
  setSelectedPlayer,
  localPlayerId,
  attacks = [],
  currentAttack,
  setCurrentAttack,
  onHit // New prop for handling hits
}) => {
  const player = playerPositions?.find(p => p.x === x && p.y === y);
  
  // Keep track of hits to prevent duplicates
  const hitTrackerRef = useRef(new Set());
  
  // Calculate attack state for this cell
  const getAttackState = () => {
    if (!Array.isArray(attacks)) return null;
    
    for (const attack of attacks) {
      if (!attack?.cells || !Array.isArray(attack.cells)) continue;
      
      const matchingCells = attack.cells.filter(cell => 
        cell?.x === x && cell?.y === y
      );

      for (const cell of matchingCells) {
        const timeSinceStart = Date.now() - attack.startTime;
        const phaseStartTime = (cell.phase || 0) * 800;
        const timeInPhase = timeSinceStart - phaseStartTime;

        // If we haven't reached this phase yet
        if (timeSinceStart < phaseStartTime) continue;

        // Warning phase (first 500ms)
        if (timeInPhase <= 500) {
          return 'warning';
        }
        // Active phase (next 1000ms)
        else if (timeInPhase <= 1500) {
          // Hit detection - if there's a player on this cell during active phase
          if (player && onHit) {
            const hitKey = `${player.id}-${attack.id}-${cell.phase}`;
            
            // Only register hit once per player-attack-phase
            if (!hitTrackerRef.current.has(hitKey)) {
              hitTrackerRef.current.add(hitKey);
              onHit(player.id, attack.id);
              
              // Clean up old hits after some time
              setTimeout(() => {
                hitTrackerRef.current.delete(hitKey);
              }, 5000);
            }
          }
          return 'active';
        }
      }
    }
    return null;
  };

  const attackState = getAttackState();
  const isPatternCell = currentAttack?.phases?.[currentAttack.currentPhase]?.some?.(p => p?.x === x && p?.y === y) || false;
  
  return (
    <div
      className={`border border-gray-300 transition-colors duration-200 ${
        attackState === 'warning' ? 'bg-orange-500/50' :
        attackState === 'active' ? 'bg-red-500/50' :
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

        if (!currentAttack?.phases?.[currentAttack.currentPhase]) return;

        const isAlreadySelected = currentAttack.phases[currentAttack.currentPhase].some(p => p?.x === x && p?.y === y);
        
        setCurrentAttack(prev => ({
          ...prev,
          phases: prev.phases.map((phase, idx) => 
            idx === prev.currentPhase 
              ? isAlreadySelected
                ? phase.filter(p => !(p?.x === x && p?.y === y)) // Remove if already selected
                : [...phase, { x, y }] // Add if not selected
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
