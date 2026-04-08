export const toNum = (x, d = 0) => { const n = Number(x); return Number.isFinite(n) ? n : d; };
export const clamp = (n, d = 0) => { const v = Number(n); return Number.isFinite(v) ? v : d; };
export const vec3 = (v, d = [0, 0, 0]) => Array.isArray(v) && v.length === 3 ? v.map(Number) : d;
export const snapVal = (v, s) => (s > 0 ? Math.round(v / s) * s : v);
export const uid = (() => { let c = 0; return () => `${Date.now().toString(36)}_${(c++).toString(36)}`; })();
