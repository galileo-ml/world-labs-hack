// src/main.js
import * as THREE from 'three';
import { SparkRenderer } from '@sparkjsdev/spark';

import {
  WORLDS, PORTALS, PROXIMITY, EXIT_SPHERES, EXIT_SPHERE_RADIUS, HUB_SPAWN,
} from './config.js';
import { createCamera } from './camera.js';
import { createWorldLoader } from './world-loader.js';
import { createHubPortals, createExitSpheres } from './portals.js';

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
const container       = document.getElementById('canvas-container');
const hudEl           = document.getElementById('hud');
const backHint        = document.getElementById('back-hint');
const backBtn         = document.getElementById('back-btn');
const tooltip         = document.getElementById('tooltip');
const coordsEl        = document.getElementById('coords');

function hideTooltip() { tooltip.classList.remove('visible'); }

// ---------------------------------------------------------------------------
// Three.js + Spark
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const scene = new THREE.Scene();
const spark = new SparkRenderer({ renderer });
scene.add(spark);

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
const { camera, update: updateCamera } = createCamera(renderer.domElement);

// ---------------------------------------------------------------------------
// World loader
// ---------------------------------------------------------------------------
const worldLoader = createWorldLoader(scene);

// ---------------------------------------------------------------------------
// Hub portals
// ---------------------------------------------------------------------------
const hubPortals = createHubPortals(scene, PORTALS);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentWorldId    = null;
let isTransitioning   = false;
const preloadMap      = new Map(); // worldId → { splat, loaded }
let activeExitSpheres = null;

// ---------------------------------------------------------------------------
// Enter / exit
// ---------------------------------------------------------------------------
async function enterPaintingWorld(worldId, splat, cfg) {
  isTransitioning = true;
  hideTooltip();
  hudEl.textContent = WORLDS[worldId].name;
  hubPortals.hideAll();
  await worldLoader.enterPainting(splat);
  camera.position.set(...(cfg.spawn ?? [0, 1.6, 0]));
  if (cfg.spawnYaw != null) {
    const euler = new THREE.Euler(0, THREE.MathUtils.degToRad(cfg.spawnYaw), 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
  }
  const sphereDefs = EXIT_SPHERES[worldId] ?? [{ position: [0, 0, 8] }];
  activeExitSpheres = createExitSpheres(scene, sphereDefs, EXIT_SPHERE_RADIUS);
  backBtn.style.display = 'block';
  backHint.style.display = 'block';
  currentWorldId = worldId;
  isTransitioning = false;
}

async function exitToHub(instant = false) {
  if (isTransitioning) return;
  isTransitioning = true;
  activeExitSpheres?.removeAll();
  activeExitSpheres = null;
  await worldLoader.exitToHub(instant);
  camera.position.set(...HUB_SPAWN.position);
  preloadMap.delete(currentWorldId);
  hubPortals.showAll();
  backBtn.style.display = 'none';
  backHint.style.display = 'none';
  hudEl.textContent = WORLDS.hub.name;
  currentWorldId = 'hub';
  isTransitioning = false;
}

// ---------------------------------------------------------------------------
// Back button + B key
// ---------------------------------------------------------------------------
backBtn.addEventListener('click', () => exitToHub());
document.addEventListener('keydown', (e) => {
  if ((e.key === 'b' || e.key === 'B') && currentWorldId !== 'hub') exitToHub(true);
});

// ---------------------------------------------------------------------------
// Proximity loop (hub only)
// ---------------------------------------------------------------------------
function checkProximity(time) {
  const camPos = camera.position;

  for (let i = 0; i < hubPortals.count; i++) {
    const portalPos = hubPortals.getPosition(i);
    const dist = camPos.distanceTo(portalPos);
    const cfg = hubPortals.getConfig(i);
    const world = WORLDS[cfg.worldId];

    // 1. Preload
    if (dist < PROXIMITY.PRELOAD && world.available && !preloadMap.has(cfg.worldId)) {
      const entry = { splat: null, loaded: false };
      preloadMap.set(cfg.worldId, entry);
      worldLoader.preloadWorld(cfg.worldId).then((splat) => {
        entry.splat = splat;
        entry.loaded = true;
      });
    }

    // 2. Glow
    const t = THREE.MathUtils.clamp(1 - dist / PROXIMITY.REVEAL, 0, 1);
    hubPortals.setGlowIntensity(i, t, time);

    // 3. Enter
    const preloaded = preloadMap.get(cfg.worldId);
    if (dist < PROXIMITY.ENTER && preloaded?.loaded && !isTransitioning) {
      enterPaintingWorld(cfg.worldId, preloaded.splat, cfg);
    }
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function boot() {
  await worldLoader.loadHub();
  currentWorldId = 'hub';
  hudEl.textContent = WORLDS.hub.name;
}

boot();

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------
renderer.setAnimationLoop((time) => {
  const t = time / 1000;
  updateCamera();
  if (!isTransitioning) {
    if (currentWorldId === 'hub') {
      checkProximity(t);
    } else if (currentWorldId !== null) {
      activeExitSpheres?.update(t);
      if (activeExitSpheres?.checkEntry(camera.position)) {
        exitToHub();
      }
    }
  }
  const p = camera.position;
  const yawDeg = THREE.MathUtils.radToDeg(Math.atan2(
    -2 * (camera.quaternion.x * camera.quaternion.z - camera.quaternion.w * camera.quaternion.y),
    1 - 2 * (camera.quaternion.y * camera.quaternion.y + camera.quaternion.z * camera.quaternion.z)
  ));
  coordsEl.textContent = `x: ${p.x.toFixed(2)}  y: ${p.y.toFixed(2)}  z: ${p.z.toFixed(2)}  yaw: ${yawDeg.toFixed(0)}°`;
  renderer.render(scene, camera);
});
