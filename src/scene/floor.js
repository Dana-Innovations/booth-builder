import * as THREE from 'three';
import { scene } from './renderer.js';
import { state } from '../state.js';

export const groundGroup = new THREE.Group();
scene.add(groundGroup);

export let floorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, side: THREE.DoubleSide });

export function applyFloorTex() {
  const rec = state.floorTexRec;
  if (rec && rec.tex) {
    const tex = rec.tex;
    if (rec.tile) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(state.floor[0], state.floor[1]); }
    else { tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.repeat.set(1, 1); }
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    floorMat.map = tex;
  } else {
    floorMat.map = null;
  }
  floorMat.needsUpdate = true;
}

export function rebuildGround() {
  groundGroup.clear();
  const [w, d] = state.floor;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  plane.rotation.x = -Math.PI / 2;
  groundGroup.add(plane);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
  const mkLine = (len) => new THREE.Mesh(new THREE.PlaneGeometry(len, 0.02), lineMat);
  [[-d / 2], [d / 2]].forEach(([pz]) => { const l = mkLine(w); l.rotation.x = -Math.PI / 2; l.position.z = pz; groundGroup.add(l); });
  [[-w / 2], [w / 2]].forEach(([px]) => { const l = mkLine(d); l.rotation.x = -Math.PI / 2; l.rotation.z = Math.PI / 2; l.position.x = px; groundGroup.add(l); });
}
