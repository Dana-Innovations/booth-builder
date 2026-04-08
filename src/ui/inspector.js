import * as THREE from 'three';
import { state } from '../state.js';
import { toNum, clamp } from '../utils.js';
import { texturesById, disposeTexture } from '../scene/objects.js';

const inspectorEl = document.getElementById('inspector');
let callbacks = { onRebuild: () => {}, onListRefresh: () => {} };

export function initInspector(cb) { callbacks = { ...callbacks, ...cb }; }

const loader = new THREE.TextureLoader();
const WALL_FACES = [{ label: 'Front (+Z)', index: 4 }, { label: 'Back (−Z)', index: 5 }, { label: 'Right (+X)', index: 0 }, { label: 'Left (−X)', index: 1 }];

function ensureTexRecord(id) { if (!texturesById.has(id)) texturesById.set(id, { textures: {} }); return texturesById.get(id); }

function bindFaceTexture(it, faceIndex, nameSpanId, fileInputId) {
  const fileInput = document.getElementById(fileInputId);
  const nameSpan = document.getElementById(nameSpanId);
  fileInput.onchange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => { loader.load(String(fr.result), (tex) => { const rec = ensureTexRecord(it.id); if (rec.textures[faceIndex] && rec.textures[faceIndex].tex) rec.textures[faceIndex].tex.dispose(); rec.textures[faceIndex] = { tex, name: f.name }; nameSpan.textContent = f.name; callbacks.onRebuild(); }); };
    fr.readAsDataURL(f); fileInput.value = '';
  };
}

function bindFaceClear(it, faceIndex, nameSpanId, clearBtnId) {
  const clearBtn = document.getElementById(clearBtnId);
  const nameSpan = document.getElementById(nameSpanId);
  clearBtn.onclick = () => { disposeTexture(it.id, faceIndex); nameSpan.textContent = '(none)'; callbacks.onRebuild(); };
}

function swapFaces(it, indexA, indexB) { const rec = ensureTexRecord(it.id); const tmp = rec.textures[indexA]; rec.textures[indexA] = rec.textures[indexB]; rec.textures[indexB] = tmp; callbacks.onRebuild(); renderInspector(); }

function buildWallFaceTexturesHTML(it) {
  const rec = texturesById.get(it.id);
  const textures = rec ? rec.textures : {};
  const rows = WALL_FACES.map(({ label, index }) => { const name = textures[index]?.name ?? '(none)'; return `<div class="row" style="margin-bottom:6px"><div class="label">${label}</div><div class="grid2"><label class="btn btn-outline" style="font-size:11px">Upload<input id="faceFile_${index}" type="file" accept="image/*" style="display:none"/></label><button id="faceClear_${index}" style="font-size:11px">Clear</button></div><div class="mini" style="margin-top:3px">File: <span id="faceName_${index}">${name}</span></div></div>`; }).join('');
  return `<div class="row"><div class="label" style="font-weight:600">Wall Face Textures</div>${rows}<div class="grid2" style="margin-top:6px"><button id="swapFB" style="font-size:11px">Swap Front/Back</button><button id="swapLR" style="font-size:11px">Swap Left/Right</button></div></div>`;
}

function wireWallFaceTextures(it) {
  WALL_FACES.forEach(({ index }) => { bindFaceTexture(it, index, `faceName_${index}`, `faceFile_${index}`); bindFaceClear(it, index, `faceName_${index}`, `faceClear_${index}`); });
  document.getElementById('swapFB').onclick = () => swapFaces(it, 4, 5);
  document.getElementById('swapLR').onclick = () => swapFaces(it, 0, 1);
}

export function renderInspector() {
  const it = state.items.find((x) => x.id === state.selectedId);
  if (!it) { inspectorEl.innerHTML = '<div class="label">Select an object.</div>'; return; }
  const pos = it.position;
  const yawDeg = Math.round(((it.rotation[1] * 180) / Math.PI) % 360);
  const dims = it.kind === 'wall'
    ? `<div class="row"><div class="label">Dims (L×H×T)</div><div class="grid3"><input id="ins_len" class="num" type="number" step="0.1" value="${it.length}"/><input id="ins_hgt" class="num" type="number" step="0.1" value="${it.height}"/><input id="ins_thk" class="num" type="number" step="0.01" value="${it.thickness}"/></div></div>`
    : `<div class="row"><div class="label">Dims (W×D×H)</div><div class="grid3"><input id="ins_wid" class="num" type="number" step="0.1" value="${it.width}"/><input id="ins_dep" class="num" type="number" step="0.1" value="${it.depth}"/><input id="ins_hgt" class="num" type="number" step="0.1" value="${it.height}"/></div></div>`;
  const faceTexUI = it.kind === 'wall' ? buildWallFaceTexturesHTML(it) : '';
  inspectorEl.innerHTML = `<div class="title" style="font-weight:600">${it.name}</div><div class="grid2" style="margin-bottom:8px"><label class="mini" style="display:inline-flex;align-items:center;gap:6px"><input id="ins_lockTog" type="checkbox" ${it.locked ? 'checked' : ''}/> Locked</label><label class="mini" style="display:inline-flex;align-items:center;gap:6px"><input id="ins_visTog" type="checkbox" ${it.visible !== false ? 'checked' : ''}/> Visible</label></div><div class="row"><div class="label">Position (X, Y, Z)</div><div class="grid3"><input id="ins_px" class="num" type="number" step="0.1" value="${pos[0].toFixed(2)}"/><input id="ins_py" class="num" type="number" step="0.1" value="${pos[1].toFixed(2)}"/><input id="ins_pz" class="num" type="number" step="0.1" value="${pos[2].toFixed(2)}"/></div></div>${dims}<div class="row"><div class="label">Yaw: ${(yawDeg + 360) % 360}°</div><div class="grid2"><button id="ins_rotL">↺ -15°</button><button id="ins_rotR">↻ +15°</button></div></div>${faceTexUI}<button id="ins_delBtn" style="width:100%;margin-top:8px;border-color:#ef4444;background:var(--danger);color:var(--dangerText)">Delete</button>`;
  document.getElementById('ins_lockTog').onchange = (e) => { it.locked = e.target.checked; callbacks.onListRefresh(); };
  document.getElementById('ins_visTog').onchange = (e) => { it.visible = e.target.checked; callbacks.onRebuild(); callbacks.onListRefresh(); };
  document.getElementById('ins_px').oninput = (e) => { if (!it.locked) { it.position[0] = toNum(e.target.value, pos[0]); callbacks.onRebuild(); } };
  document.getElementById('ins_py').oninput = (e) => { if (!it.locked) { it.position[1] = toNum(e.target.value, pos[1]); callbacks.onRebuild(); } };
  document.getElementById('ins_pz').oninput = (e) => { if (!it.locked) { it.position[2] = toNum(e.target.value, pos[2]); callbacks.onRebuild(); } };
  if (it.kind === 'wall') {
    document.getElementById('ins_len').oninput = (e) => { if (!it.locked) { it.length = clamp(e.target.value, it.length); callbacks.onRebuild(); } };
    document.getElementById('ins_hgt').oninput = (e) => { if (!it.locked) { it.height = clamp(e.target.value, it.height); it.position[1] = it.height / 2; callbacks.onRebuild(); renderInspector(); } };
    document.getElementById('ins_thk').oninput = (e) => { if (!it.locked) { it.thickness = clamp(e.target.value, it.thickness); callbacks.onRebuild(); } };
    wireWallFaceTextures(it);
  } else {
    document.getElementById('ins_wid').oninput = (e) => { if (!it.locked) { it.width = clamp(e.target.value, it.width); callbacks.onRebuild(); } };
    document.getElementById('ins_dep').oninput = (e) => { if (!it.locked) { it.depth = clamp(e.target.value, it.depth); callbacks.onRebuild(); } };
    document.getElementById('ins_hgt').oninput = (e) => { if (!it.locked) { it.height = clamp(e.target.value, it.height); it.position[1] = it.height / 2; callbacks.onRebuild(); renderInspector(); } };
  }
  document.getElementById('ins_rotL').onclick = () => { if (!it.locked) { it.rotation[1] -= (15 * Math.PI) / 180; callbacks.onRebuild(); renderInspector(); } };
  document.getElementById('ins_rotR').onclick = () => { if (!it.locked) { it.rotation[1] += (15 * Math.PI) / 180; callbacks.onRebuild(); renderInspector(); } };
  document.getElementById('ins_delBtn').onclick = () => { if (!it.locked) { disposeTexture(it.id); state.items = state.items.filter((x) => x.id !== it.id); state.selectedId = null; callbacks.onRebuild(); callbacks.onListRefresh(); renderInspector(); } };
}
