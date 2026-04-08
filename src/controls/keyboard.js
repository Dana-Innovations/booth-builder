import * as THREE from 'three';
import { state } from '../state.js';
import { emit } from '../events.js';
import { exitCameraView, updateCameraHelper, updateUserCamera, setGizmoMode, getCameraGizmoMode } from '../scene/camera.js';
import { disposeTexture } from '../scene/objects.js';

const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Escape' && state.viewingThroughCamera) { exitCameraView(); return; }
  if (!state.viewingThroughCamera) {
    if (document.activeElement?.tagName === 'INPUT') return;
    if (e.key.toLowerCase() === 'w' && !e.ctrlKey && !e.metaKey && state.sceneCamera) { const current = getCameraGizmoMode(); setGizmoMode(current === 'move' ? null : 'move'); return; }
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && state.sceneCamera) { const current = getCameraGizmoMode(); setGizmoMode(current === 'rotate' ? null : 'rotate'); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && e.shiftKey) {
      const it = state.items.find((x) => x.id === state.selectedId);
      if (it && !it.locked) { disposeTexture(it.id); state.items = state.items.filter((x) => x.id !== it.id); state.selectedId = null; emit('rebuild'); emit('refresh-list'); emit('inspector:refresh'); }
      return;
    }
    const it = state.items.find((x) => x.id === state.selectedId);
    if (!it || it.locked || it.visible === false) return;
    const step = e.shiftKey ? 1.0 : 0.25;
    if (e.key === 'ArrowUp')    { it.position[2] -= step; emit('rebuild'); }
    if (e.key === 'ArrowDown')  { it.position[2] += step; emit('rebuild'); }
    if (e.key === 'ArrowLeft')  { it.position[0] -= step; emit('rebuild'); }
    if (e.key === 'ArrowRight') { it.position[0] += step; emit('rebuild'); }
    if (e.key === '[') { it.rotation[1] -= (15 * Math.PI) / 180; emit('rebuild'); emit('inspectorRefresh'); }
    if (e.key === ']') { it.rotation[1] += (15 * Math.PI) / 180; emit('rebuild'); emit('inspectorRefresh'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { if (it.kind === 'wall') { e.preventDefault(); emit('duplicateWall', it); } }
  }
});

window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

setInterval(() => {
  if (!state.viewingThroughCamera || !state.sceneCamera) return;
  const speed = 0.08;
  const yaw = (state.sceneCamera.rotation[1] * Math.PI) / 180;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  if (keys['arrowup'])    { state.sceneCamera.position[0] += forward.x * speed; state.sceneCamera.position[2] += forward.z * speed; }
  if (keys['arrowdown'])  { state.sceneCamera.position[0] -= forward.x * speed; state.sceneCamera.position[2] -= forward.z * speed; }
  if (keys['arrowleft'])  { state.sceneCamera.position[0] -= right.x * speed; state.sceneCamera.position[2] -= right.z * speed; }
  if (keys['arrowright']) { state.sceneCamera.position[0] += right.x * speed; state.sceneCamera.position[2] += right.z * speed; }
  if (keys['w']) { state.sceneCamera.position[0] += forward.x * speed; state.sceneCamera.position[2] += forward.z * speed; }
  if (keys['s']) { state.sceneCamera.position[0] -= forward.x * speed; state.sceneCamera.position[2] -= forward.z * speed; }
  if (keys['a']) { state.sceneCamera.position[0] -= right.x * speed; state.sceneCamera.position[2] -= right.z * speed; }
  if (keys['d']) { state.sceneCamera.position[0] += right.x * speed; state.sceneCamera.position[2] += right.z * speed; }
  if (keys['q']) state.sceneCamera.position[1] -= speed;
  if (keys['e']) state.sceneCamera.position[1] += speed;
  const anyMovement = keys['w'] || keys['s'] || keys['a'] || keys['d'] || keys['q'] || keys['e'] || keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
  if (anyMovement) { updateUserCamera(); updateCameraHelper(); emit('camui'); }
}, 16);
