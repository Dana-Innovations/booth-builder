import * as THREE from 'three';
import { state } from '../state.js';
import { toNum } from '../utils.js';
import { makeWall, makeKiosk } from '../scene/objects.js';
import { applyFloorTex, rebuildGround } from '../scene/floor.js';
import { renderer, scene, cameras, ambientLight, resetView } from '../scene/renderer.js';
import { createSceneCamera, updateCameraHelper } from '../scene/camera.js';

let callbacks = { onSelect: () => {}, onRebuild: () => {}, onCameraPanelRefresh: () => {} };

export function initToolbar(cb) { callbacks = { ...callbacks, ...cb }; _bindButtons(); }

const loader = new THREE.TextureLoader();

function _bindButtons() {
  document.getElementById('addWall').onclick = () => { const n = state.items.filter((i) => i.kind === 'wall').length + 1; const w = makeWall(`Wall ${n}`); state.items.push(w); callbacks.onSelect(w.id); };
  document.getElementById('addKiosk').onclick = () => { const n = state.items.filter((i) => i.kind === 'kiosk').length + 1; const k = makeKiosk(`Kiosk ${n}`); state.items.push(k); callbacks.onSelect(k.id); };
  document.getElementById('exportBtn').onclick = () => { const bundle = { floor: { width: state.floor[0], depth: state.floor[1] }, items: state.items, camera: state.sceneCamera }; const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `booth-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  document.getElementById('exportPNGBtn').onclick = () => { const sceneCanvas = document.getElementById('scene'); const oldBG = scene.background; scene.background = null; renderer.render(scene, cameras.active); const url = sceneCanvas.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = `booth-${new Date().toISOString().slice(0, 10)}.png`; a.click(); scene.background = oldBG; };
  document.getElementById('resetViewBtn').onclick = () => resetView();
  document.getElementById('importFile').onchange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(String(reader.result));
        state.floor = [toNum(d?.floor?.width, 12), toNum(d?.floor?.depth, 8)];
        state.items = (d?.items || []).map((x, i) => x?.kind === 'wall' ? makeWall(x.name || `Wall ${i + 1}`, x) : makeKiosk(x.name || `Kiosk ${i + 1}`, x));
        if (d.camera) { state.sceneCamera = d.camera; createSceneCamera(); updateCameraHelper(); const cc = document.getElementById('camControls'); if (cc) cc.style.display = 'block'; const viewBtn = document.getElementById('viewCamera'); if (viewBtn) viewBtn.disabled = false; callbacks.onCameraPanelRefresh(); }
        document.getElementById('floorW').value = String(state.floor[0]);
        document.getElementById('floorD').value = String(state.floor[1]);
        applyFloorTex(); rebuildGround(); state.selectedId = null; callbacks.onRebuild();
      } catch (err) { console.warn('Invalid JSON', err); }
    };
    reader.readAsText(f); e.target.value = '';
  };
  document.getElementById('floorW').oninput = (e) => { state.floor[0] = toNum(e.target.value, state.floor[0]); applyFloorTex(); rebuildGround(); };
  document.getElementById('floorD').oninput = (e) => { state.floor[1] = toNum(e.target.value, state.floor[1]); applyFloorTex(); rebuildGround(); };
  document.getElementById('snapOn').onchange = (e) => { state.snap.on = e.target.checked; };
  document.getElementById('snapStep').oninput = (e) => { state.snap.step = Math.max(0.01, toNum(e.target.value, 0.25)); };
  document.getElementById('ambInt').oninput = (e) => { ambientLight.intensity = toNum(e.target.value, 0.9); };
  const exposureEl = document.getElementById('exposure'); if (exposureEl) exposureEl.oninput = (e) => { renderer.toneMappingExposure = toNum(e.target.value, 1.1); };
  document.getElementById('floorTexFile').onchange = (e) => { const f = e.target.files?.[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => { loader.load(String(fr.result), (tex) => { const tileEl = document.getElementById('floorTile'); state.floorTexRec = { tex, name: f.name, tile: tileEl.checked }; document.getElementById('floorTexName').textContent = f.name; applyFloorTex(); rebuildGround(); }); }; fr.readAsDataURL(f); };
  document.getElementById('floorClear').onclick = () => { state.floorTexRec = null; document.getElementById('floorTexName').textContent = '(none)'; applyFloorTex(); rebuildGround(); };
  document.getElementById('floorTile').onchange = () => { if (state.floorTexRec) { const tileEl = document.getElementById('floorTile'); state.floorTexRec.tile = tileEl.checked; applyFloorTex(); rebuildGround(); } };
}
