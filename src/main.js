import { state } from './state.js';
import { on, emit } from './events.js';
import { startRenderLoop } from './scene/renderer.js';
import { rebuildGround, applyFloorTex } from './scene/floor.js';
import { rebuildSceneObjects, makeWall } from './scene/objects.js';
import './scene/camera.js';
import './controls/mouse.js';
import './controls/keyboard.js';
import { initTheme } from './ui/theme.js';
import { initList, refreshList } from './ui/list.js';
import { initInspector, renderInspector } from './ui/inspector.js';
import { initCameraPanel, refreshCameraPanel } from './ui/camera-panel.js';
import { initToolbar } from './ui/toolbar.js';

function selectById(id) {
  state.selectedId = id;
  rebuildSceneObjects();
  refreshList();
  renderInspector();
}

function rebuildAll() {
  rebuildSceneObjects();
  refreshList();
  renderInspector();
}

function duplicateWall(src) {
  if (!src || src.kind !== 'wall' || src.locked) return;
  const copy = makeWall(src.name + ' Copy', {
    position: [src.position[0] + 0.5, src.position[1], src.position[2] + 0.5],
    rotation: [...src.rotation],
    length: src.length,
    height: src.height,
    thickness: src.thickness,
  });
  state.items.push(copy);
  selectById(copy.id);
}

on('select', (id) => selectById(id));
on('rebuild', () => rebuildAll());
on('inspectorRefresh', () => renderInspector());
on('camui', () => refreshCameraPanel());
on('duplicateWall', (src) => duplicateWall(src));
on('refresh-list', () => refreshList());
on('inspector:refresh', () => renderInspector());

initTheme();
initList({ onSelect: (id) => selectById(id), onRebuild: () => rebuildAll(), onInspectorRefresh: () => renderInspector() });
initInspector({ onRebuild: () => rebuildAll(), onListRefresh: () => refreshList() });
initCameraPanel();
initToolbar({ onSelect: (id) => selectById(id), onRebuild: () => rebuildAll(), onCameraPanelRefresh: () => refreshCameraPanel() });

applyFloorTex();
rebuildGround();
rebuildSceneObjects();
refreshList();
renderInspector();
startRenderLoop();
