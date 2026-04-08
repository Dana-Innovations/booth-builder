import { state } from '../state.js';

const listEl = document.getElementById('list');
const emptyMsg = document.getElementById('emptyMsg');

let callbacks = { onSelect: () => {}, onRebuild: () => {}, onInspectorRefresh: () => {} };

export function initList(cb) { callbacks = { ...callbacks, ...cb }; }

export function refreshList() {
  listEl.innerHTML = '';
  emptyMsg.style.display = state.items.length ? 'none' : 'block';
  state.items.forEach((it) => {
    const row = document.createElement('div');
    row.className = 'rowwrap' + (it.visible === false ? ' hidden-item' : '');
    const nameBtn = document.createElement('button');
    nameBtn.textContent = (it.kind === 'wall' ? '🧱 ' : '🟩 ') + it.name + (it.locked ? ' 🔒' : '');
    nameBtn.className = state.selectedId === it.id ? 'active' : '';
    nameBtn.style.cssText = 'width:100%; text-align:left;';
    nameBtn.onclick = () => callbacks.onSelect(it.id);
    nameBtn.ondblclick = () => { const n = prompt('Rename:', it.name); if (n && n.trim()) { it.name = n.trim(); refreshList(); callbacks.onInspectorRefresh(); } };
    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex; gap:4px; margin-top:2px;';
    const visBtn = document.createElement('button');
    visBtn.textContent = it.visible !== false ? 'Hide' : 'Show';
    visBtn.style.cssText = 'min-width:44px; font-size:11px;';
    if (it.visible === false) visBtn.style.opacity = '0.5';
    visBtn.onclick = (e) => { e.stopPropagation(); it.visible = it.visible === false ? true : false; callbacks.onRebuild(); refreshList(); };
    const lockBtn = document.createElement('button');
    lockBtn.textContent = it.locked ? 'Unlock' : 'Lock';
    lockBtn.style.cssText = 'min-width:50px; font-size:11px;';
    lockBtn.onclick = (e) => { e.stopPropagation(); it.locked = !it.locked; refreshList(); callbacks.onInspectorRefresh(); };
    btnGroup.appendChild(visBtn); btnGroup.appendChild(lockBtn);
    row.appendChild(nameBtn); row.appendChild(btnGroup);
    listEl.appendChild(row);
  });
}
