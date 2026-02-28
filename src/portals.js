// src/portals.js
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Hub portals — glow frames, no texture, proximity-driven opacity
// ---------------------------------------------------------------------------
export function createHubPortals(scene, PORTALS) {
  const portalGroups = PORTALS.map((pc, i) => {
    const group = new THREE.Group();
    group.position.set(...pc.position);
    if (pc.rotation) {
      group.rotation.set(
        THREE.MathUtils.degToRad(pc.rotation[0]),
        THREE.MathUtils.degToRad(pc.rotation[1]),
        THREE.MathUtils.degToRad(pc.rotation[2])
      );
    }

    const geo = new THREE.PlaneGeometry(pc.scale[0], pc.scale[1]);

    // Semi-transparent fill
    const fillMat = new THREE.MeshBasicMaterial({
      color: pc.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const fill = new THREE.Mesh(geo, fillMat);
    group.add(fill);

    // Glowing border frame
    const edgesGeo = new THREE.EdgesGeometry(geo);
    const frameMat = new THREE.LineBasicMaterial({
      color: pc.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const frame = new THREE.LineSegments(edgesGeo, frameMat);
    group.add(frame);

    scene.add(group);
    return { group, fillMat, frameMat, config: pc, phase: i * 0.8 };
  });

  // t = 0..1 from proximity; call per frame per portal
  function setGlowIntensity(index, t, time) {
    const p = portalGroups[index];
    const pulse = 0.85 + 0.15 * Math.sin(time * 1.5 + p.phase);
    p.frameMat.opacity = t * pulse;
    p.fillMat.opacity  = t * 0.22 * pulse;
  }

  function hideAll() { portalGroups.forEach((p) => { p.group.visible = false; }); }
  function showAll() { portalGroups.forEach((p) => { p.group.visible = true;  }); }
  function getPosition(index) { return portalGroups[index].group.position; }
  function getConfig(index) { return portalGroups[index].config; }

  return { setGlowIntensity, hideAll, showAll, getPosition, getConfig, count: PORTALS.length };
}

// ---------------------------------------------------------------------------
// Exit spheres — placed inside painting worlds; walk in to return to museum
// ---------------------------------------------------------------------------
export function createExitSpheres(scene, sphereDefs, radius) {
  const spheres = sphereDefs.map((def) => {
    const center = new THREE.Vector3(...def.position);

    // Faint shell visible from inside
    const geo = new THREE.SphereGeometry(radius, 24, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(center);
    scene.add(mesh);

    // Equatorial glow ring
    const ringGeo = new THREE.TorusGeometry(radius, 0.04, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(center);
    scene.add(ring);

    return { center, radius, mesh, ring, ringMat };
  });

  function update(time) {
    spheres.forEach((s, i) => {
      s.ringMat.opacity = 0.25 + 0.15 * Math.sin(time * 1.2 + i);
    });
  }

  function checkEntry(cameraPos) {
    return spheres.some((s) => s.center.distanceTo(cameraPos) < s.radius);
  }

  function removeAll() {
    spheres.forEach((s) => {
      scene.remove(s.mesh);
      scene.remove(s.ring);
      s.mesh.geometry.dispose();
      s.ring.geometry.dispose();
    });
  }

  return { update, checkEntry, removeAll };
}
