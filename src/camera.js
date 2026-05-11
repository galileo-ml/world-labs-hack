// src/camera.js
import * as THREE from 'three';
import { HUB_SPAWN } from './config.js';

const MOVE_SPEED = 2; // m/s — constant, no shift/caps multipliers

export function createCamera(domElement) {
  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(...HUB_SPAWN.position);

  // Euler kept in sync for mouse look (YXZ = yaw then pitch, no roll)
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  // WASD / arrow key state — own keyboard handler so we can normalize
  // diagonals and apply movement on the yaw-only horizontal plane.
  const keys = new Set();
  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup',   (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

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

  // Reusable scratch vector for movement.
  const moveVec = new THREE.Vector3();

  let lastTime = performance.now();
  function update() {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
    lastTime = now;

    // Build raw input vector in camera-local axes (x=right, z=backward).
    let inX = 0, inZ = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp'))    inZ -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown'))  inZ += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft'))  inX -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) inX += 1;
    if (camera._joystickInput) {
      inX += camera._joystickInput.x;
      inZ += camera._joystickInput.y;
    }

    const len = Math.hypot(inX, inZ);
    if (len > 0) {
      // Clamp magnitude to 1 so diagonals don't go √2× and partial joystick
      // input still scales correctly.
      const scale = len > 1 ? 1 / len : 1;
      moveVec.set(inX * scale, 0, inZ * scale);
      // Apply full camera orientation — looking up + W flies up, etc. Speed
      // magnitude is preserved because the input is unit-length.
      moveVec.applyQuaternion(camera.quaternion);
      camera.position.addScaledVector(moveVec, MOVE_SPEED * dt);
    }
  }

  return { camera, update };
}
