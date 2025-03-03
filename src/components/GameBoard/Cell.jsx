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
  
  // For debugging - log attacks that should affect this cell
  useEffect(() => {
    if (!Array.isArray(attacks) || attacks.length === 0) return;
    
    // Find attacks that include this cell
    const attacksForThisCell = attacks.filter(attack => 
      attack?.cells?.some(cell => cell?.x === x && cell?.y === y)
    );
    
    if (attacksForThisCell.length > 0) {
      console.log(`Cell (${x},${y}) is targeted by ${attacksForThisCell.length} attacks:`, 
        attacksForThisCell.map(a => a.id));
    }
  }, [x, y, attacks]);
  
  // Calculate attack state for this cell
  const getAttackState = () => {
    if (!Array.isArray(attacks) || attacks.length === 0) return null;
    
    const now = Date.now();
    
    for (const attack of attacks) {
      if (!attack?.cells || !Array.isArray(attack.cells) || !attack.startTime) {
        continue;
      }
      
      // Find all cells in this attack that match our coordinates
      const matchingCells = attack.cells.filter(cell => 
        cell?.x === x && cell?.y === y
      );
      
      if (matchingCells.length === 0) continue;
      
      for (const cell of matchingCells) {
        const timeSinceStart = now - attack.startTime;
        const phaseStartTime = (cell.phase || 0) * 800;
        const timeInPhase = timeSinceStart - phaseStartTime;
        
        // If we haven't reached this phase yet
        if (timeSinceStart < phaseStartTime) continue;
        
        // Warning phase (first 500ms)
        if (timeInPhase <= 500) {
          // Debug statement for warning phase
          if (Math.random() < 0.01) { // Only log occasionally to avoid spam
            console.log(`Cell (${x},${y}) in WARNING state for attack ${attack.id}, phase ${cell.phase}`);
          }
          return 'warning';
        }
        // Active phase (next 1000ms)
        else if (timeInPhase <= 1500) {
          // Debug statement for active phase
          if (Math.random() < 0.01) { // Only log occasionally
            console.log(`Cell (${x},${y}) in ACTIVE state for attack ${attack.id}, phase ${cell.phase}`);
          }
          
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
  
  // Debug when cell changes state
  useEffect(() => {
    if (attackState) {
      console.log(`Cell (${x},${y}) state: ${attackState}`);
    }
  }, [attackState, x, y]);
  
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
        backgroundColor: attackState === 'warning' ? 'rgba(255, 165, 0, 0.5)' : // Explicit orange for warning
                         attackState === 'active' ? 'rgba(255, 0, 0, 0.5)' :     // Explicit red for active
                         isPatternCell ? 'rgba(255, 255, 0, 0.3)' :              // Yellow for pattern
                         'transparent'
      }}
      onClick={(e) => {
        // If clicking a player token, don't handle the grid click
        if (e.target !== e.currentTarget) return;

        // Make sure we have a valid currentAttack structure
        if (!currentAttack?.phases || 
            !Array.isArray(currentAttack.phases) || 
            currentAttack.currentPhase === undefined || 
            !Array.isArray(currentAttack.phases[currentAttack.currentPhase])) {
          console.log("Invalid currentAttack structure:", currentAttack);
          return;
        }

        // Check if this cell is already in the current phase
        const isAlreadySelected = currentAttack.phases[currentAttack.currentPhase].some(
          p => p && p.x === x && p.y === y
        );
        
        console.log(`Cell (${x}, ${y}) clicked, already selected: ${isAlreadySelected}`);
        
        setCurrentAttack(prev => {
          // Make a deep copy to ensure we're not modifying the previous state directly
          const newPhases = [...prev.phases.map(phase => Array.isArray(phase) ? [...phase] : [])];
          
          // Make sure the current phase exists
          if (!Array.isArray(newPhases[prev.currentPhase])) {
            newPhases[prev.currentPhase] = [];
          }
          
          // Add or remove the cell
          if (isAlreadySelected) {
            newPhases[prev.currentPhase] = newPhases[prev.currentPhase].filter(
              p => !(p && p.x === x && p.y === y)
            );
          } else {
            newPhases[prev.currentPhase].push({ x, y });
          }
          
          return {
            ...prev,
            phases: newPhases
          };
        });
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
