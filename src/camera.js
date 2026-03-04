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

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || ('ontouchstart' in window);

  if (isMobile) {
    // Show joystick, hide desktop hint
    document.getElementById('joystick-zone').style.display = 'block';
    document.getElementById('start-overlay').style.display = 'none';

    // Joystick state
    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const JOYSTICK_RADIUS = 50; // half of 100px zone
    let joystickOrigin = null;
    let joystickTouchId = null;
    const joystickInput = { x: 0, y: 0 };

    // Look state
    const TOUCH_SENSITIVITY = 0.004;
    let lookTouchId = null;
    let lastLookX = 0;
    let lastLookY = 0;

    document.addEventListener('touchstart', (e) => {
      for (const touch of e.changedTouches) {
        const joystickRect = joystickZone.getBoundingClientRect();
        const inJoystick = touch.clientX >= joystickRect.left && touch.clientX <= joystickRect.right &&
                           touch.clientY >= joystickRect.top  && touch.clientY <= joystickRect.bottom;

        if (inJoystick && joystickTouchId === null) {
          joystickTouchId = touch.identifier;
          joystickOrigin = { x: touch.clientX, y: touch.clientY };
        } else if (!inJoystick && lookTouchId === null) {
          lookTouchId = touch.identifier;
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
        }
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId && joystickOrigin) {
          const dx = touch.clientX - joystickOrigin.x;
          const dy = touch.clientY - joystickOrigin.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const clamped = Math.min(dist, JOYSTICK_RADIUS);
          const angle = Math.atan2(dy, dx);
          joystickInput.x = (clamped / JOYSTICK_RADIUS) * Math.cos(angle);
          joystickInput.y = (clamped / JOYSTICK_RADIUS) * Math.sin(angle);
          // Move knob visually
          joystickKnob.style.transform = `translate(calc(-50% + ${joystickInput.x * JOYSTICK_RADIUS}px), calc(-50% + ${joystickInput.y * JOYSTICK_RADIUS}px))`;
        } else if (touch.identifier === lookTouchId) {
          euler.setFromQuaternion(camera.quaternion);
          euler.y -= (touch.clientX - lastLookX) * TOUCH_SENSITIVITY;
          euler.x -= (touch.clientY - lastLookY) * TOUCH_SENSITIVITY;
          euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
          camera.quaternion.setFromEuler(euler);
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId) {
          joystickTouchId = null;
          joystickOrigin = null;
          joystickInput.x = 0;
          joystickInput.y = 0;
          joystickKnob.style.transform = 'translate(-50%, -50%)';
        } else if (touch.identifier === lookTouchId) {
          lookTouchId = null;
        }
      }
    }, { passive: true });

    // Store for update loop
    camera._joystickInput = joystickInput;
  } else {
    // --- Pointer lock (desktop only) ---
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
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
      camera.quaternion.setFromEuler(euler);
    });
  }

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

    // Apply joystick movement on mobile
    if (camera._joystickInput) {
      const { x, y } = camera._joystickInput;
      if (x || y) {
        camera.translateX(x * 2 * dt);
        camera.translateZ(y * 2 * dt);
      }
    }
  }

  return { camera, update };
}
