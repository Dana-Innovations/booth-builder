import * as THREE from 'three';
import { scene, userCamera, orbitCamera, cameras } from './renderer.js';
import { state } from '../state.js';

let sceneCameraObj = null;
let sceneCameraHelper = null;
let sceneCameraMesh = null;
let moveGizmo = null;
let rotateGizmo = null;
let gizmoStartData = { startPos: null, startRot: null, startMouse: null };

const hintText = document.getElementById('hintText');
const cameraViewOverlay = document.getElementById('cameraViewOverlay');
const viewCameraBtn = document.getElementById('viewCamera');

export function disposeObject3D(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  });
}

function buildMoveGizmo() {
  const g = new THREE.Group();
  g.userData.isGizmo = true;
  g.userData.gizmoType = 'move';
  const axes = [{ color: 0xff0000, axis: 'x' }, { color: 0x00ff00, axis: 'y' }, { color: 0x0000ff, axis: 'z' }];
  axes.forEach(({ color, axis }) => {
    const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8), mat);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), mat);
    if (axis === 'x') { shaft.rotation.z = -Math.PI / 2; shaft.position.set(0.4, 0, 0); tip.rotation.z = -Math.PI / 2; tip.position.set(0.86, 0, 0); }
    else if (axis === 'y') { shaft.position.set(0, 0.4, 0); tip.position.set(0, 0.86, 0); }
    else { shaft.rotation.x = Math.PI / 2; shaft.position.set(0, 0, 0.4); tip.rotation.x = Math.PI / 2; tip.position.set(0, 0, 0.86); }
    shaft.userData.gizmoAxis = axis; shaft.userData.gizmoType = 'move';
    tip.userData.gizmoAxis = axis; tip.userData.gizmoType = 'move';
    g.add(shaft); g.add(tip);
  });
  g.visible = false; g.renderOrder = 999;
  scene.add(g);
  return g;
}

function buildRotateGizmo() {
  const g = new THREE.Group();
  g.userData.isGizmo = true;
  g.userData.gizmoType = 'rotate';
  const rings = [
    { color: 0xff0000, axis: 'x', rx: 0, ry: Math.PI / 2, rz: 0 },
    { color: 0x00ff00, axis: 'y', rx: Math.PI / 2, ry: 0, rz: 0 },
    { color: 0x0000ff, axis: 'z', rx: 0, ry: 0, rz: 0 },
  ];
  rings.forEach(({ color, axis, rx, ry, rz }) => {
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, depthTest: false });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.02, 8, 48), mat);
    torus.rotation.set(rx, ry, rz);
    torus.userData.gizmoAxis = axis; torus.userData.gizmoType = 'rotate';
    g.add(torus);
  });
  g.visible = false; g.renderOrder = 999;
  scene.add(g);
  return g;
}

export function getGizmos() { return { moveGizmo, rotateGizmo }; }
export function getCameraGizmoMode() { return state.cameraGizmoMode; }
export function getGizmoStartData() { return gizmoStartData; }
export function setGizmoStartData(pos, rot, mouse) { gizmoStartData = { startPos: pos, startRot: rot, startMouse: mouse }; }

export function updateGizmoPosition() {
  if (!state.sceneCamera) return;
  const [px, py, pz] = state.sceneCamera.position;
  if (moveGizmo) moveGizmo.position.set(px, py, pz);
  if (rotateGizmo) rotateGizmo.position.set(px, py, pz);
}

export function setGizmoMode(mode) {
  state.cameraGizmoMode = mode;
  const showInScene = document.getElementById('showCamHelper');
  const visible = !!state.sceneCamera && !state.viewingThroughCamera && (showInScene ? showInScene.checked : true);
  if (moveGizmo) moveGizmo.visible = visible && mode === 'move';
  if (rotateGizmo) rotateGizmo.visible = visible && mode === 'rotate';
}

export function cleanupGizmos() {
  if (moveGizmo) { scene.remove(moveGizmo); disposeObject3D(moveGizmo); moveGizmo = null; }
  if (rotateGizmo) { scene.remove(rotateGizmo); disposeObject3D(rotateGizmo); rotateGizmo = null; }
  state.cameraGizmoMode = null;
  gizmoStartData = { startPos: null, startRot: null, startMouse: null };
}

function buildCameraMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x64748b }));
  g.add(body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0x475569 }));
  lens.rotation.x = Math.PI / 2; lens.position.z = -0.25;
  g.add(lens);
  g.userData.isCamera = true;
  return g;
}

export function createSceneCamera() {
  cleanupCamera(false);
  sceneCameraObj = new THREE.PerspectiveCamera(state.sceneCamera?.fov ?? 60, 1, 0.1, 50);
  sceneCameraHelper = new THREE.CameraHelper(sceneCameraObj);
  scene.add(sceneCameraHelper);
  sceneCameraMesh = buildCameraMesh();
  scene.add(sceneCameraMesh);
  moveGizmo = buildMoveGizmo();
  rotateGizmo = buildRotateGizmo();
  updateSceneCameraTransform();
}

export const createCameraHelper = createSceneCamera;

export function updateSceneCameraTransform() {
  if (!state.sceneCamera || !sceneCameraObj) return;
  const [px, py, pz] = state.sceneCamera.position;
  const toRad = (d) => (d * Math.PI) / 180;
  sceneCameraObj.fov = state.sceneCamera.fov;
  sceneCameraObj.updateProjectionMatrix();
  sceneCameraObj.position.set(px, py, pz);
  sceneCameraObj.rotation.order = 'YXZ';
  sceneCameraObj.rotation.set(toRad(state.sceneCamera.rotation[0]), toRad(state.sceneCamera.rotation[1]), toRad(state.sceneCamera.rotation[2]));
  sceneCameraHelper.update();
  if (sceneCameraMesh) {
    sceneCameraMesh.position.set(px, py, pz);
    sceneCameraMesh.rotation.order = 'YXZ';
    sceneCameraMesh.rotation.set(toRad(state.sceneCamera.rotation[0]), toRad(state.sceneCamera.rotation[1]), toRad(state.sceneCamera.rotation[2]));
  }
  updateGizmoPosition();
}

export function updateCameraHelper() { updateSceneCameraTransform(); }

export function updateUserCamera() {
  if (!state.sceneCamera) return;
  userCamera.position.set(...state.sceneCamera.position);
  userCamera.rotation.order = 'YXZ';
  userCamera.rotation.set(
    (state.sceneCamera.rotation[0] * Math.PI) / 180,
    (state.sceneCamera.rotation[1] * Math.PI) / 180,
    (state.sceneCamera.rotation[2] * Math.PI) / 180
  );
  userCamera.fov = state.sceneCamera.fov;
  userCamera.updateProjectionMatrix();
}

export function cleanupCamera(resetUI) {
  cleanupGizmos();
  if (sceneCameraHelper) { scene.remove(sceneCameraHelper); sceneCameraHelper.dispose?.(); sceneCameraHelper = null; }
  if (sceneCameraMesh) { scene.remove(sceneCameraMesh); disposeObject3D(sceneCameraMesh); sceneCameraMesh = null; }
  sceneCameraObj = null;
  if (resetUI) {
    state.viewingThroughCamera = false;
    cameras.active = orbitCamera;
    if (cameraViewOverlay) cameraViewOverlay.classList.remove('active');
    if (hintText) hintText.textContent = 'Left-drag=orbit • Right-drag=pan • Wheel=zoom • Click=select';
    if (viewCameraBtn) { viewCameraBtn.textContent = 'View Through'; viewCameraBtn.disabled = true; }
  }
}

export function removeCameraHelper() { cleanupCamera(false); }

export function syncCameraVisibility() {
  const showInScene = document.getElementById('showCamHelper');
  const show = !!state.sceneCamera && !state.viewingThroughCamera && (showInScene ? showInScene.checked : true);
  if (sceneCameraHelper) sceneCameraHelper.visible = show;
  if (sceneCameraMesh) sceneCameraMesh.visible = show;
  if (moveGizmo) moveGizmo.visible = show && state.cameraGizmoMode === 'move';
  if (rotateGizmo) rotateGizmo.visible = show && state.cameraGizmoMode === 'rotate';
}

export function enterCameraView() {
  if (!state.sceneCamera) return;
  state.viewingThroughCamera = true;
  cameras.active = userCamera;
  updateUserCamera();
  if (cameraViewOverlay) cameraViewOverlay.classList.add('active');
  if (hintText) hintText.textContent = 'Left-drag = look/rotate | Middle-drag = pan | Right-drag = dolly | Scroll = dolly | WASD = move | QE = up/down | ESC = exit';
  syncCameraVisibility();
  if (viewCameraBtn) viewCameraBtn.textContent = 'Exit View';
  if (moveGizmo) moveGizmo.visible = false;
  if (rotateGizmo) rotateGizmo.visible = false;
}

export function exitCameraView() {
  state.viewingThroughCamera = false;
  cameras.active = orbitCamera;
  if (cameraViewOverlay) cameraViewOverlay.classList.remove('active');
  if (hintText) hintText.textContent = 'Left-drag=orbit • Right-drag=pan • Wheel=zoom • Click=select';
  syncCameraVisibility();
  if (viewCameraBtn) viewCameraBtn.textContent = 'View Through';
}

export function getSceneCameraMesh() { return sceneCameraMesh; }
