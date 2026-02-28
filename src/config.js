// src/config.js
// Central configuration. Edit portal positions and world availability here.

export const PROXIMITY = {
  PRELOAD: 8,   // start background load
  REVEAL:  5,   // portal starts glowing
  ENTER:   0.8, // trigger world entry (world must be loaded)
};

export const REVEAL_DURATION_MS = 1500;
export const EXIT_SPHERE_RADIUS  = 3;

export const WORLDS = {
  hub: {
    id: 'hub',
    name: 'Grand Museum',
    splatUrl: '/assets/splats/museum-hub.spz',
    available: true,
  },
  'bedroom-in-arles': {
    id: 'bedroom-in-arles',
    name: 'Bedroom in Arles',
    splatUrl: '/assets/splats/bedroom-in-arles.spz',
    available: true,
  },
  'dancing-class': {
    id: 'dancing-class',
    name: 'The Dancing Class',
    splatUrl: '/assets/splats/dancing-class.spz',
    available: true,
  },
  'harmony-in-red': {
    id: 'harmony-in-red',
    name: 'Harmony in Red',
    splatUrl: '/assets/splats/harmony-in-red.spz',
    available: true,
  },
  rhinoceros: {
    id: 'rhinoceros',
    name: 'Rhinoceros',
    splatUrl: '/assets/splats/rhinoceros.spz',
    available: false, // no .spz file
  },
  'starry-night': {
    id: 'starry-night',
    name: 'The Starry Night',
    splatUrl: '/assets/splats/starry-night.spz',
    available: true,
  },
  'cafe-terrace': {
    id: 'cafe-terrace',
    name: 'Cafe Terrace at Night',
    splatUrl: '/assets/splats/cafe-terrace.spz',
    available: true,
  },
};

// Portals displayed in the museum hub — 3x2 grid.
// color: hex tint for glow frame; rotation: [x, y, z] in degrees.
export const PORTALS = [
  {
    worldId: 'bedroom-in-arles',
    title: 'Bedroom in Arles',
    artist: 'Vincent van Gogh, 1888',
    color: 0xf5c842,
    position: [-0.97, 0.86, 0.84],
    scale: [1.8, 1.2],
    rotation: [0, 0, 0],
    spawn: [0, 1.6, 0],
    spawnYaw: -5,
  },
  {
    worldId: 'dancing-class',
    title: 'The Dancing Class',
    artist: 'Edgar Degas, 1874',
    color: 0x42c5f5,
    position: [-2.07, 0.87, -0.89],
    scale: [1.8, 1.2],
    rotation: [0, 0, 0],
    spawn: [0, 1.6, 0],
  },
  {
    worldId: 'harmony-in-red',
    title: 'Harmony in Red',
    artist: 'Henri Matisse, 1908',
    color: 0xf54242,
    position: [-1.21, 0.79, -2.86],
    scale: [1.8, 1.2],
    rotation: [0, 0, 0],
    spawn: [0, 1.6, 0],
  },
  {
    worldId: 'rhinoceros',
    title: 'Rhinoceros',
    artist: 'Salvador Dali, 1956',
    color: 0xc4a882,
    position: [-3, -1, 0],
    scale: [1.8, 1.2],
    rotation: [0, 0, 0],
    spawn: [0, 1.6, 0],
  },
  {
    worldId: 'starry-night',
    title: 'The Starry Night',
    artist: 'Vincent van Gogh, 1889',
    color: 0x4268f5,
    position: [1.96, 0.9, -0.94],
    scale: [1.8, 1.2],
    rotation: [0, 0, 0],
    spawn: [0, 1.6, 0],
    spawnYaw: 54,
  },
  {
    worldId: 'cafe-terrace',
    title: 'Cafe Terrace at Night',
    artist: 'Vincent van Gogh, 1888',
    color: 0xf5a442,
    position: [1.08, 0.79, 0.77],
    scale: [1.8, 1.2],
    rotation: [0, 0, 0],
    spawn: [0, 1.6, 0],
  },
];

// Exit spheres inside each painting world (positions in that world's local space).
// Walk into one of these to return to the museum.
export const EXIT_SPHERES = {
  'dancing-class': [
    { position: [0, 0, 8] },   // back of the scene
    { position: [-6, 0, 2] },  // left periphery
    { position: [6, 0, 2] },   // right periphery
  ],
};

// Camera spawn point in the hub
export const HUB_SPAWN = { position: [0.02, 0.54, -0.98], lookAt: [0, 0, 0] };
