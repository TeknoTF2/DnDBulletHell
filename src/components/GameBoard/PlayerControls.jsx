import React from 'react';
import { ImageIcon, X } from 'lucide-react';
import { TOKEN_SHAPES } from './types';

const PlayerControls = ({
  playerPositions,
  localPlayerId,
  handleImageUpload,
  removeImage,
  updateTokenConfig,
  movementCooldown,
}) => {
  return (
    <div className="border rounded p-4">
      <h3 className="font-bold mb-2">Players</h3>
      {playerPositions.map(player => {
        const isLocalPlayer = player.id === localPlayerId;
        
        return (
          <div key={player.id} className="border-b last:border-0 py-2">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className={`w-8 h-8 overflow-hidden ${TOKEN_SHAPES[player.tokenConfig?.shape || 'circle'].class}`}
                style={{ 
                  backgroundColor: player.color,
                  opacity: player.tokenConfig?.opacity || 1
                }}
              >
                {player.image && (
                  <img 
                    src={player.image} 
                    alt={`Player ${player.id}`}
                    className={`w-full h-full ${
                      player.tokenConfig?.size === 'fill' ? 'object-cover' : 'object-contain'
                    }`}
                  />
                )}
              </div>
              <span className="flex-grow">
                {isLocalPlayer ? 'You' : `Player ${player.id.slice(0, 4)}`}
              </span>
              
              {isLocalPlayer && (
                <div className="flex gap-2">
                  <label className="cursor-pointer border rounded px-2 py-1 bg-white">
                    <ImageIcon size={16} className="inline mr-1" />
                    <span>Token</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'token', player.id)}
                    />
                  </label>
                  
                  {player.image && (
                    <button
                      className="border rounded px-2 py-1 text-red-500"
                      onClick={() => removeImage('token', player.id)}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {isLocalPlayer && (
              <div className="grid grid-cols-2 gap-2 ml-10">
                <select
                  value={player.tokenConfig?.shape || 'circle'}
                  onChange={(e) => updateTokenConfig(player.id, 'shape', e.target.value)}
                  className="border rounded p-1 text-sm"
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="hexagon">Hexagon</option>
                </select>

                <select
                  value={player.tokenConfig?.size || 'fill'}
                  onChange={(e) => updateTokenConfig(player.id, 'size', e.target.value)}
                  className="border rounded p-1 text-sm"
                >
                  <option value="fill">Fill</option>
                  <option value="contain">Contain</option>
                </select>

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(player.tokenConfig?.opacity || 1) * 100}
                    onChange={(e) => updateTokenConfig(
                      player.id, 
                      'opacity', 
                      parseInt(e.target.value) / 100
                    )}
                    className="flex-grow"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round((player.tokenConfig?.opacity || 1) * 100)}%
                  </span>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-sm">Movement Speed:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={player.tokenConfig?.speed || 3}
                      onChange={(e) => updateTokenConfig(
                        player.id,
                        'speed',
                        Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                      )}
                      className="border rounded p-1 w-16 text-sm"
                    />
                    <span className="text-sm text-gray-600">squares/6s</span>
                  </div>
                  
                  {player.movementCooldown && Date.now() - player.movementCooldown < 6000 && (
                    <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{
                          width: `${Math.max(0, Math.min(100, ((6000 - (Date.now() - player.movementCooldown)) / 6000) * 100))}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerControls;
