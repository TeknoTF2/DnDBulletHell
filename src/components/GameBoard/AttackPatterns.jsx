import React from 'react';
import { Plus } from 'lucide-react';

const AttackPatterns = ({
  currentAttack,
  setCurrentAttack,
  savedAttacks,
  saveAttack,
  launchAttack
}) => {
  const addPhase = () => {
    setCurrentAttack(prev => ({
      ...prev,
      phases: [...prev.phases, []],
      currentPhase: prev.phases.length
    }));
  };

  const selectPhase = (phaseIndex) => {
    setCurrentAttack(prev => ({
      ...prev,
      currentPhase: phaseIndex
    }));
  };

  return (
    <>
      <div className="border rounded p-4">
        <h3 className="font-bold mb-2">Create Attack Pattern</h3>
        <input
          type="text"
          placeholder="Attack name"
          className="border p-2 mb-2 w-full"
          value={currentAttack.name}
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
            {currentAttack.phases.map((phase, index) => (
              <button
                key={index}
                onClick={() => selectPhase(index)}
                className={`px-3 py-1 rounded ${
                  currentAttack.currentPhase === index 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100'
                }`}
              >
                {index + 1} ({phase.length})
              </button>
            ))}
          </div>
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          onClick={saveAttack}
        >
          Save Pattern
        </button>
      </div>
      
      <div className="border rounded p-4">
        <h3 className="font-bold mb-2">Saved Attacks</h3>
        {savedAttacks.length === 0 ? (
          <p className="text-gray-500 text-sm">No saved attack patterns yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {savedAttacks.map(attack => (
              <div key={attack.id} className="flex justify-between items-center">
                <span>
                  {attack.name || 'Unnamed Attack'}
                  <span className="text-sm text-gray-500 ml-2">
                    ({Math.max(...attack.cells.map(c => c.phase)) + 1} phases)
                  </span>
                </span>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded"
                  onClick={() => launchAttack(attack)}
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
