export const TOKEN_SHAPES = {
  circle: { class: 'rounded-full' },
  square: { class: 'rounded-none' },
  hexagon: { class: 'rounded-lg' }
};

export const CELL_SIZE = 40;

export const PHASE_DELAY = 800; // milliseconds between phases

export const INITIAL_PLAYER = {
  tokenConfig: {
    shape: 'circle',
    size: 'fill',
    opacity: 1
  }
};

export const INITIAL_BACKGROUND_CONFIG = {
  size: 'cover',
  position: 'center',
  opacity: 1
};

export const GRID_LIMITS = {
  min: 5,
  max: 30
};

// New constants for attack system
export const ATTACK_HIT_TIMEOUT = 5000; // Time in ms that a hit counter remains visible (5 seconds)
