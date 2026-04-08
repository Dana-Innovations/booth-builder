import * as THREE from 'three';
import { scene } from '../scene/renderer.js';

const root = document.documentElement;
const toggle = document.getElementById('themeToggle');

function applyTheme(isDark) {
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem('bb_theme', isDark ? 'dark' : 'light');
  if (scene) scene.background = new THREE.Color(isDark ? 0x2a2a2a : 0xf8fafc);
}

export function initTheme() {
  const saved = localStorage.getItem('bb_theme');
  if (saved) { root.setAttribute('data-theme', saved); toggle.checked = saved === 'dark'; }
  else { root.setAttribute('data-theme', 'light'); toggle.checked = false; }
  toggle.onchange = () => applyTheme(toggle.checked);
  applyTheme(toggle.checked);
}
