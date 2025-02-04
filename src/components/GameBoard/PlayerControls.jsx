import React from 'react';
import { ImageIcon, X } from 'lucide-react';
import { TOKEN_SHAPES } from './types';

const PlayerControls = ({
  playerPositions,
  handleImageUpload,
  removeImage,
  updateTokenConfig
}) => {
  return (
    <div className="border rounded p-4">
      <h3 className="font-bold mb-2">Players</h3>
      {playerPositions.map(player => (
        <div key={player.id} className="border-b last:border-0 py-2">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className={`w-8 h-8 overflow-hidden ${TOKEN_SHAPES[player.tokenConfig.shape].class}`}
              style={{ 
                backgroundColor: player.color,
                opacity: player.tokenConfig.opacity 
              }}
            >
              {player.image && (
                <img 
                  src={player.image} 
                  alt={player.id}
                  className={`w-full h-full ${
                    player.tokenConfig.size === 'fill' ? 'object-cover' : 'object-contain'
                  }`}
                />
              )}
            </div>
            <span>{player.id}</span>
            
            <div className="flex gap-2 ml-auto">
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
          </div>

          <div className="grid grid-cols-2 gap-2 ml-10">
            <select
              value={player.tokenConfig.shape}
              onChange={(e) => updateTokenConfig(player.id, 'shape', e.target.value)}
              className="border rounded p-1 text-sm"
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="hexagon">Hexagon</option>
            </select>

            <select
              value={player.tokenConfig.size}
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
                value={player.tokenConfig.opacity * 100}
                onChange={(e) => updateTokenConfig(
                  player.id, 
                  'opacity', 
                  parseInt(e.target.value) / 100
                )}
                className="flex-grow"
              />
              <span className="text-sm text-gray-600 w-12">
                {Math.round(player.tokenConfig.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerControls;
