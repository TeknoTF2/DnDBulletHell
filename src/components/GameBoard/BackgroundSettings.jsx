import React from 'react';
import { Upload, X } from 'lucide-react';

const BackgroundSettings = ({
  backgroundImage,
  backgroundConfig,
  setBackgroundConfig,
  handleImageUpload,
  removeImage
}) => {
  return (
    <div className="border rounded p-4">
      <h3 className="font-bold mb-2">Background Settings</h3>
      <div className="flex gap-4 flex-wrap">
        <label className="cursor-pointer border rounded p-2 flex items-center gap-2 bg-white">
          <Upload size={16} />
          <span>Upload Background</span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'background')}
          />
        </label>
        
        {backgroundImage && (
          <button
            className="border rounded p-2 flex items-center gap-2 text-red-500"
            onClick={() => removeImage('background')}
          >
            <X size={16} />
            <span>Remove</span>
          </button>
        )}

        <select
          value={backgroundConfig.size}
          onChange={(e) => setBackgroundConfig(prev => ({ ...prev, size: e.target.value }))}
          className="border rounded p-2"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
        </select>

        <select
          value={backgroundConfig.position}
          onChange={(e) => setBackgroundConfig(prev => ({ ...prev, position: e.target.value }))}
          className="border rounded p-2"
        >
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={backgroundConfig.opacity * 100}
            onChange={(e) => setBackgroundConfig(prev => ({ 
              ...prev, 
              opacity: parseInt(e.target.value) / 100 
            }))}
            className="w-32"
          />
          <span className="text-sm text-gray-600 min-w-[4rem]">
            {Math.round(backgroundConfig.opacity * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSettings;
