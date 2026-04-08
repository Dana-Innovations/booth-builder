import { state } from '../state.js';
import { toNum } from '../utils.js';
import { createSceneCamera, updateCameraHelper, updateUserCamera, enterCameraView, exitCameraView, cleanupCamera, syncCameraVisibility, setGizmoMode } from '../scene/camera.js';

const camControls = document.getElementById('camControls');

export function refreshCameraPanel() {
  if (!state.sceneCamera) return;
  document.getElementById('camPx').value = state.sceneCamera.position[0].toFixed(2);
  document.getElementById('camPy').value = state.sceneCamera.position[1].toFixed(2);
  document.getElementById('camPz').value = state.sceneCamera.position[2].toFixed(2);
  document.getElementById('camRx').value = String(Math.round(state.sceneCamera.rotation[0]));
  document.getElementById('camRy').value = String(Math.round(state.sceneCamera.rotation[1]));
  document.getElementById('camRz').value = String(Math.round(state.sceneCamera.rotation[2]));
  document.getElementById('camFov').value = String(state.sceneCamera.fov);
  document.getElementById('fovVal').textContent = String(state.sceneCamera.fov);
}

export function initCameraPanel() {
  document.getElementById('addCamera').onclick = () => { state.sceneCamera = { position: [0, 1.6, 5], rotation: [0, 0, 0], fov: 60 }; createSceneCamera(); updateCameraHelper(); refreshCameraPanel(); camControls.style.display = 'block'; const viewBtn = document.getElementById('viewCamera'); if (viewBtn) viewBtn.disabled = false; };
  document.getElementById('viewCamera').onclick = () => { if (!state.sceneCamera) { alert('Add a camera first'); return; } if (state.viewingThroughCamera) exitCameraView(); else enterCameraView(); };
  document.getElementById('deleteCamera').onclick = () => { state.sceneCamera = null; cleanupCamera(true); camControls.style.display = 'none'; setGizmoMode(null); };
  const showCamHelper = document.getElementById('showCamHelper');
  if (showCamHelper) showCamHelper.onchange = () => syncCameraVisibility();
  ['camPx', 'camPy', 'camPz'].forEach((id, i) => { document.getElementById(id).oninput = (e) => { if (!state.sceneCamera) return; state.sceneCamera.position[i] = toNum(e.target.value, state.sceneCamera.position[i]); updateUserCamera(); updateCameraHelper(); }; });
  ['camRx', 'camRy', 'camRz'].forEach((id, i) => { document.getElementById(id).oninput = (e) => { if (!state.sceneCamera) return; state.sceneCamera.rotation[i] = toNum(e.target.value, state.sceneCamera.rotation[i]); updateUserCamera(); updateCameraHelper(); }; });
  document.getElementById('camFov').oninput = (e) => { if (!state.sceneCamera) return; state.sceneCamera.fov = toNum(e.target.value, 60); document.getElementById('fovVal').textContent = String(state.sceneCamera.fov); updateUserCamera(); };
}
