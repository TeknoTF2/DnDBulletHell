import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';

const AttackPatterns = ({
  currentAttack,
  setCurrentAttack,
  savedAttacks = [],
  saveAttack,
  launchAttack,
  socket // New prop for socket access
}) => {
  // Fetch saved attacks on component mount
  useEffect(() => {
    if (socket) {
      // Request saved attacks from the server
      socket.emit('getSavedAttacks');
    }
  }, [socket]);

  const addPhase = () => {
    setCurrentAttack(prev => ({
      ...prev,
      phases: [...(prev.phases || []), []],
      currentPhase: (prev.phases || []).length
    }));
  };

  const selectPhase = (phaseIndex) => {
    setCurrentAttack(prev => ({
      ...prev,
      currentPhase: phaseIndex
    }));
  };

  const handleSaveAttack = () => {
    // Validate current attack structure
    if (!currentAttack?.phases || !Array.isArray(currentAttack.phases)) {
      console.error('Invalid attack structure');
      return;
    }

    // Skip if no phases or if all phases are empty
    if (currentAttack.phases.every(phase => !phase || phase.length === 0)) {
      return;
    }

    // Convert phases into the cell format the server expects
    const cells = currentAttack.phases.flatMap((phase, phaseIndex) => 
      (phase || []).map(cell => ({
        x: cell.x,
        y: cell.y,
        phase: phaseIndex
      }))
    );

    // Create attack object
    const attackToSave = {
      id: Date.now(),
      name: currentAttack.name || `Attack ${Date.now()}`,
      cells: cells
    };

    console.group('Saving Attack Pattern');
    console.log('Current attack structure:', currentAttack);
    console.log('Converted cells:', cells);
    console.log('Final attack to save:', attackToSave);
    console.groupEnd();

    // Save the attack locally
    saveAttack(attackToSave);
    
    // Also send to server for persistent storage
    if (socket) {
      socket.emit('saveAttack', attackToSave);
    }

    // Reset current attack
    setCurrentAttack({
      name: '',
      phases: [[]],
      currentPhase: 0
    });
  };

  const handleLaunchAttack = (attack) => {
    // Validate attack before launching
    if (!attack?.cells || !Array.isArray(attack.cells)) {
      console.error('Invalid attack structure for launch');
      return;
    }

    console.group('Launching Attack');
    console.log('Original attack:', attack);
    console.groupEnd();

    // Make sure all cells have the required properties
    const validatedAttack = {
      ...attack,
      cells: attack.cells.map(cell => ({
        x: cell?.x || 0,
        y: cell?.y || 0,
        phase: cell?.phase || 0
      }))
    };

    // Launch the attack
    launchAttack(validatedAttack);
  };

  const getCellsInCurrentPhase = () => {
    if (!currentAttack?.phases?.[currentAttack.currentPhase]) {
      return 0;
    }
    return currentAttack.phases[currentAttack.currentPhase].length;
  };

  return (
    <>
      <div className="border rounded p-4">
        <h3 className="font-bold mb-2">Create Attack Pattern</h3>
        <input
          type="text"
          placeholder="Attack name"
          className="border p-2 mb-2 w-full"
          value={currentAttack?.name || ''}
          onChange={e => setCurrentAttack(prev => ({ ...prev, name: e.target.value }))}
        />
        
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium">Phases:</h4>
            <button
              onClick={addPhase}
              className="p-1 rounded hover:bg-gray-100"
              title="Add new phase"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {currentAttack?.phases?.map((phase, index) => (
              <button
                key={index}
                onClick={() => selectPhase(index)}
                className={`px-3 py-1 rounded ${
                  currentAttack.currentPhase === index 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100'
                }`}
              >
                {index + 1} ({(phase || []).length})
              </button>
            ))}
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            Current phase: {currentAttack.currentPhase + 1} 
            ({getCellsInCurrentPhase()} cells selected)
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            Total cells: {currentAttack.phases.reduce((sum, phase) => sum + (phase?.length || 0), 0)}
          </div>
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600"
          onClick={handleSaveAttack}
        >
          Save Pattern
        </button>
      </div>
      
      <div className="border rounded p-4 mt-4">
        <h3 className="font-bold mb-2">Saved Attacks</h3>
        {!savedAttacks?.length ? (
          <p className="text-gray-500 text-sm">No saved attack patterns yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {savedAttacks.map(attack => (
              <div key={attack.id} className="flex justify-between items-center p-2 hover:bg-gray-50">
                <span>
                  {attack.name || 'Unnamed Attack'}
                  <span className="text-sm text-gray-500 ml-2">
                    ({attack.cells?.length || 0} cells)
                  </span>
                </span>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => handleLaunchAttack(attack)}
                >
                  Launch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AttackPatterns;
