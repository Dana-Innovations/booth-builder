import * as THREE from 'three';
import { scene } from './renderer.js';
import { state } from '../state.js';
import { clamp, vec3, uid } from '../utils.js';

export function makeWall(name = 'Wall', opts = {}) {
  const h = clamp(opts.height, 2.5);
  return { id: opts.id || uid(), kind: 'wall', name: name || 'Wall', position: vec3(opts.position, [0, h / 2, 0]), rotation: vec3(opts.rotation, [0, 0, 0]), length: clamp(opts.length, 3), height: h, thickness: clamp(opts.thickness, 0.12), locked: !!opts.locked, visible: opts.visible !== false };
}

export function makeKiosk(name = 'Kiosk', opts = {}) {
  const h = clamp(opts.height, 1.1);
  return { id: opts.id || uid(), kind: 'kiosk', name: name || 'Kiosk', position: vec3(opts.position, [0, h / 2, 0]), rotation: vec3(opts.rotation, [0, 0, 0]), width: clamp(opts.width, 1.2), depth: clamp(opts.depth, 0.8), height: h, locked: !!opts.locked, visible: opts.visible !== false };
}

export const meshesById = new Map();
export const texturesById = new Map();

function getWallMaterials(it) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const c = state.selectedId === it.id ? 0x38bdf8 : isDark ? 0x3a3a3a : 0xcbd5e1;
  const neutral = new THREE.MeshStandardMaterial({ color: c });
  const mats = [neutral.clone(), neutral.clone(), neutral.clone(), neutral.clone(), neutral.clone(), neutral.clone()];
  const rec = texturesById.get(it.id);
  if (rec && rec.textures) {
    Object.entries(rec.textures).forEach(([face, texData]) => {
      if (texData && texData.tex) {
        texData.tex.colorSpace = THREE.SRGBColorSpace;
        texData.tex.needsUpdate = true;
        mats[parseInt(face)] = new THREE.MeshStandardMaterial({ map: texData.tex, side: THREE.DoubleSide });
      }
    });
  }
  return mats;
}

export function disposeTexture(id, face) {
  const rec = texturesById.get(id);
  if (!rec) return;
  if (face !== undefined) {
    const key = String(face);
    const texData = rec.textures[key];
    if (texData && texData.tex) { texData.tex.dispose(); delete rec.textures[key]; }
  } else {
    if (rec.textures) Object.values(rec.textures).forEach((texData) => { if (texData && texData.tex) texData.tex.dispose(); });
    texturesById.delete(id);
  }
}

export function rebuildSceneObjects() {
  meshesById.forEach((m) => { scene.remove(m); if (m.geometry) m.geometry.dispose(); });
  meshesById.clear();
  state.items.forEach((it) => {
    let geo, mesh;
    if (it.kind === 'wall') {
      geo = new THREE.BoxGeometry(it.length, it.height, it.thickness);
      mesh = new THREE.Mesh(geo, getWallMaterials(it));
    } else {
      geo = new THREE.BoxGeometry(it.width, it.height, it.depth);
      mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: state.selectedId === it.id ? 0x22c55e : 0x94a3b8 }));
    }
    mesh.position.set(...it.position);
    mesh.rotation.set(it.rotation[0], it.rotation[1], it.rotation[2]);
    mesh.userData.id = it.id;
    mesh.visible = it.visible !== false;
    scene.add(mesh);
    meshesById.set(it.id, mesh);
  });
}
