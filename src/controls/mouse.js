import * as THREE from 'three';
import { canvas, orbitCamera, orbit, updateOrbitCamera } from '../scene/renderer.js';
import { meshesById } from '../scene/objects.js';
import { getSceneCameraMesh, updateCameraHelper, updateUserCamera, getGizmos, getCameraGizmoMode, getGizmoStartData, setGizmoStartData, updateGizmoPosition } from '../scene/camera.js';
import { state } from '../state.js';
import { snapVal } from '../utils.js';
import { emit } from '../events.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const planeIntersect = new THREE.Vector3();

let isDragging = false, isPanning = false, lastX = 0, lastY = 0;
let draggingId = null, dragYOffset = 0;
let draggingCamera = false, camDragMode = null;
let draggingGizmo = false, gizmoAxis = null, gizmoType = null;
export let camMouseDown = false;
let camMouseButton = -1;

function setMouseNDC(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

canvas.addEventListener('mousedown', (e) => {
  if (state.viewingThroughCamera) { camMouseDown = true; camMouseButton = e.button; return; }
  lastX = e.clientX; lastY = e.clientY;
  setMouseNDC(e.clientX, e.clientY);
  raycaster.setFromCamera(mouse, orbitCamera);
  const { moveGizmo, rotateGizmo } = getGizmos();
  const activeGizmo = getCameraGizmoMode() === 'move' ? moveGizmo : getCameraGizmoMode() === 'rotate' ? rotateGizmo : null;
  if (activeGizmo && activeGizmo.visible) {
    const gHits = raycaster.intersectObject(activeGizmo, true);
    if (gHits.length) { const hit = gHits[0].object; gizmoAxis = hit.userData.gizmoAxis; gizmoType = hit.userData.gizmoType; draggingGizmo = true; setGizmoStartData([...state.sceneCamera.position], [...state.sceneCamera.rotation], { x: e.clientX, y: e.clientY }); return; }
  }
  const camMesh = getSceneCameraMesh();
  if (camMesh && camMesh.visible) {
    const camHits = raycaster.intersectObject(camMesh, true);
    if (camHits.length) { camDragMode = e.button === 2 ? 'rotate' : e.shiftKey ? 'moveY' : 'moveXZ'; draggingCamera = true; return; }
  }
  const hits = raycaster.intersectObjects(Array.from(meshesById.values()));
  if (hits.length) {
    const id = hits[0].object.userData.id;
    const it = state.items.find((x) => x.id === id);
    if (it) { emit('select', id); if (!it.locked && it.visible !== false) { draggingId = id; dragPlane.set(new THREE.Vector3(0, 1, 0), 0); if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) { dragYOffset = it.position[1]; } return; } }
    return;
  }
  if (e.button === 2 || e.button === 1) { isPanning = true; return; }
  isDragging = true;
});

window.addEventListener('mouseup', () => { isDragging = false; isPanning = false; draggingId = null; draggingCamera = false; draggingGizmo = false; gizmoAxis = null; gizmoType = null; camMouseDown = false; camMouseButton = -1; });

window.addEventListener('mousemove', (e) => {
  if (state.viewingThroughCamera && camMouseDown && state.sceneCamera) {
    if (camMouseButton === 0) { state.sceneCamera.rotation[1] -= e.movementX * 0.2; state.sceneCamera.rotation[0] -= e.movementY * 0.2; state.sceneCamera.rotation[0] = Math.max(-89, Math.min(89, state.sceneCamera.rotation[0])); }
    else if (camMouseButton === 1) { const yaw = (state.sceneCamera.rotation[1] * Math.PI) / 180; const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)); const speed = 0.02; state.sceneCamera.position[0] -= right.x * e.movementX * speed; state.sceneCamera.position[2] -= right.z * e.movementX * speed; state.sceneCamera.position[1] += e.movementY * speed; }
    else if (camMouseButton === 2) { const yaw = (state.sceneCamera.rotation[1] * Math.PI) / 180; const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); const speed = 0.02; state.sceneCamera.position[0] += forward.x * e.movementX * speed; state.sceneCamera.position[2] += forward.z * e.movementX * speed; }
    updateUserCamera(); updateCameraHelper(); emit('camui'); return;
  }
  if (state.viewingThroughCamera) return;
  setMouseNDC(e.clientX, e.clientY);
  if (draggingGizmo && state.sceneCamera) {
    const startData = getGizmoStartData();
    if (!startData.startPos) return;
    const dx = e.clientX - startData.startMouse.x;
    if (gizmoType === 'move') { const delta = dx * 0.02; const pos = [...startData.startPos]; if (gizmoAxis === 'x') pos[0] += delta; else if (gizmoAxis === 'y') pos[1] += delta; else if (gizmoAxis === 'z') pos[2] += delta; state.sceneCamera.position = pos; }
    else if (gizmoType === 'rotate') { const deltaDeg = dx * 0.5; const rot = [...startData.startRot]; if (gizmoAxis === 'x') rot[0] += deltaDeg; else if (gizmoAxis === 'y') rot[1] += deltaDeg; else if (gizmoAxis === 'z') rot[2] += deltaDeg; state.sceneCamera.rotation = rot; }
    updateCameraHelper(); updateUserCamera(); updateGizmoPosition(); emit('camui'); return;
  }
  if (draggingCamera && state.sceneCamera) {
    if (camDragMode === 'rotate') { state.sceneCamera.rotation[1] -= e.movementX * 0.5; state.sceneCamera.rotation[0] -= e.movementY * 0.5; state.sceneCamera.rotation[0] = Math.max(-89, Math.min(89, state.sceneCamera.rotation[0])); }
    else if (camDragMode === 'moveY') { state.sceneCamera.position[1] -= e.movementY * 0.02; }
    else { raycaster.setFromCamera(mouse, orbitCamera); const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -state.sceneCamera.position[1]); const pt = new THREE.Vector3(); if (raycaster.ray.intersectPlane(plane, pt)) { state.sceneCamera.position[0] = pt.x; state.sceneCamera.position[2] = pt.z; } }
    updateCameraHelper(); updateUserCamera(); emit('camui'); return;
  }
  if (draggingId) {
    raycaster.setFromCamera(mouse, orbitCamera);
    if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
      const it = state.items.find((x) => x.id === draggingId);
      if (it) { let nx = planeIntersect.x; let nz = planeIntersect.z; if (state.snap.on && !e.altKey) { nx = snapVal(nx, state.snap.step); nz = snapVal(nz, state.snap.step); } it.position[0] = nx; it.position[2] = nz; it.position[1] = dragYOffset; emit('rebuild'); emit('inspectorRefresh'); }
    }
    return;
  }
  const dx = e.clientX - lastX; const dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  if (isPanning) {
    const panSpeed = orbit.radius * 0.0015;
    const forward = new THREE.Vector3(); orbitCamera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, orbitCamera.up).normalize();
    const upScreen = new THREE.Vector3().crossVectors(right, forward).normalize();
    orbit.target.addScaledVector(right, -dx * panSpeed);
    orbit.target.addScaledVector(upScreen, dy * panSpeed);
    updateOrbitCamera(); return;
  }
  if (isDragging) { orbit.theta -= dx * 0.005; orbit.phi -= dy * 0.005; updateOrbitCamera(); }
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (state.viewingThroughCamera && state.sceneCamera) {
    const yaw = (state.sceneCamera.rotation[1] * Math.PI) / 180;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const speed = 0.3 * Math.sign(e.deltaY);
    state.sceneCamera.position[0] -= forward.x * speed;
    state.sceneCamera.position[2] -= forward.z * speed;
    updateUserCamera(); updateCameraHelper(); emit('camui'); return;
  }
  orbit.radius *= 1 + Math.sign(e.deltaY) * 0.1;
  updateOrbitCamera();
}, { passive: false });

canvas.addEventListener('click', (e) => {
  if (state.viewingThroughCamera || draggingCamera || draggingGizmo) return;
  setMouseNDC(e.clientX, e.clientY);
  raycaster.setFromCamera(mouse, orbitCamera);
  const hits = raycaster.intersectObjects(Array.from(meshesById.values()));
  if (hits.length) emit('select', hits[0].object.userData.id);
  else emit('select', null);
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
