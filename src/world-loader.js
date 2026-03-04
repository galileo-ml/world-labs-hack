// src/world-loader.js
import { SplatMesh } from '@sparkjsdev/spark';
import { WORLDS, REVEAL_DURATION_MS } from './config.js';

export function createWorldLoader(scene) {
  let hubSplat = null;
  let paintingSplat = null;

  // Load hub once on startup; returned so main.js can await it.
  async function loadHub() {
    hubSplat = new SplatMesh({ url: WORLDS.hub.splatUrl });
    scene.add(hubSplat);
    if (hubSplat.initialized) await hubSplat.initialized;
    return hubSplat;
  }

  // Silent background preload — invisible, doesn't replace hub.
  async function preloadWorld(worldId) {
    const world = WORLDS[worldId];
    if (!world?.available) return null;
    const splat = new SplatMesh({ url: world.splatUrl });
    splat.opacity = 0;
    splat.visible = false;
    scene.add(splat);
    if (splat.initialized) await splat.initialized;
    return splat;
  }

  // Animate opacity crossfade via rAF.
  function crossfade(fromSplat, toSplat, durationMs) {
    return new Promise((resolve) => {
      toSplat.visible = true;
      const start = performance.now();
      function tick() {
        const t = Math.min((performance.now() - start) / durationMs, 1);
        fromSplat.opacity = 1 - t;
        toSplat.opacity = t;
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          fromSplat.visible = false;
          resolve();
        }
      }
      requestAnimationFrame(tick);
    });
  }

  async function enterPainting(splat) {
    paintingSplat = splat;
    await crossfade(hubSplat, paintingSplat, REVEAL_DURATION_MS);
  }

  async function exitToHub(instant = false) {
    if (instant) {
      hubSplat.opacity = 1;
      hubSplat.visible = true;
      paintingSplat.opacity = 0;
      paintingSplat.visible = false;
    } else {
      await crossfade(paintingSplat, hubSplat, REVEAL_DURATION_MS);
    }
    scene.remove(paintingSplat);
    if (typeof paintingSplat.dispose === 'function') paintingSplat.dispose();
    paintingSplat = null;
  }

  return { loadHub, preloadWorld, enterPainting, exitToHub };
}
