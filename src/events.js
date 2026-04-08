const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(fn);
}

export function emit(event, data) {
  const fns = listeners.get(event);
  if (fns) fns.forEach(fn => fn(data));
}
