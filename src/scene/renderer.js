import * as THREE from 'three';

export const canvas = document.getElementById('scene');

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

export const scene = new THREE.Scene();
const root = document.documentElement;
scene.background = new THREE.Color(root.getAttribute('data-theme') === 'dark' ? 0x2a2a2a : 0xf8fafc);

export const orbitCamera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

export const orbit = { target: new THREE.Vector3(0, 0, 0), radius: 12, theta: Math.PI / 4, phi: Math.PI / 4 };

export function updateOrbitCamera() {
  orbit.radius = Math.max(4, Math.min(60, orbit.radius));
  orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi));
  const { target, radius, theta, phi } = orbit;
  const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
  const y = target.y + radius * Math.cos(phi);
  const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
  orbitCamera.position.set(x, y, z);
  orbitCamera.lookAt(target);
}
updateOrbitCamera();

export function resetView() {
  orbit.target.set(0, 0, 0);
  orbit.radius = 12;
  orbit.theta = Math.PI / 4;
  orbit.phi = Math.PI / 4;
  updateOrbitCamera();
}

export const userCamera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
export const cameras = { active: orbitCamera };

export const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);
const hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 0.6);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 8, 5);
scene.add(dir);

function renderFrame() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    orbitCamera.aspect = w / h;
    orbitCamera.updateProjectionMatrix();
    userCamera.aspect = w / h;
    userCamera.updateProjectionMatrix();
  }
  renderer.render(scene, cameras.active);
  requestAnimationFrame(renderFrame);
}

export function startRenderLoop() {
  requestAnimationFrame(renderFrame);
}
