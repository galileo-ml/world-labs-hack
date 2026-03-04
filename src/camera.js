// src/camera.js
import * as THREE from 'three';
import { FpsMovement } from '@sparkjsdev/spark';
import { HUB_SPAWN } from './config.js';

export function createCamera(domElement) {
  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(...HUB_SPAWN.position);

  // WASD movement via SparkJS
  const fpsMovement = new FpsMovement({ moveSpeed: 2 });

  // Euler kept in sync for mouse look (YXZ = yaw then pitch, no roll)
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  // --- Pointer lock ---
  document.addEventListener('click', () => {
    domElement.requestPointerLock().catch(() => {});
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === domElement;
    document.getElementById('start-overlay').style.display = locked ? 'none' : 'block';
  });

  // --- Mouse look (only while locked) ---
  const SENSITIVITY = 0.002;
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== domElement) return;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= e.movementX * SENSITIVITY;
    euler.x -= e.movementY * SENSITIVITY;
    euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x)); // clamp pitch
    camera.quaternion.setFromEuler(euler);
  });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  let lastTime = performance.now();
  function update() {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
    lastTime = now;
    fpsMovement.update(dt, camera);
  }

  return { camera, update };
}
