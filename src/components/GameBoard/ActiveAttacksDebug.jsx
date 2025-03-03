import React, { useState, useEffect } from 'react';

const ActiveAttacksDebug = ({ attacks = [] }) => {
  const [, setRefresh] = useState(0);
  
  // Force a refresh every 100ms to update timers
  useEffect(() => {
    const interval = setInterval(() => {
      setRefresh(prev => prev + 1);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  if (attacks.length === 0) {
    return (
      <div className="mt-4 border rounded p-2 bg-gray-50">
        <p className="text-sm text-gray-500">No active attacks</p>
      </div>
    );
  }
  
  return (
    <div className="mt-4 border rounded p-2 bg-gray-50">
      <h3 className="font-bold text-sm">Active Attacks ({attacks.length})</h3>
      
      <div className="mt-2 space-y-2">
        {attacks.map(attack => {
          const now = Date.now();
          const elapsed = now - attack.startTime;
          const maxPhase = Math.max(...attack.cells.map(c => c.phase || 0));
          const totalDuration = (maxPhase + 1) * 800 + 1500;
          const progress = Math.min(100, (elapsed / totalDuration) * 100);
          
          return (
            <div key={attack.id} className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">{attack.name || `Attack ${attack.id}`}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="text-gray-500">
                <span>{attack.cells.length} cells</span>
                <span className="mx-1">•</span>
                <span>Phases: 0-{maxPhase}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveAttacksDebug;
