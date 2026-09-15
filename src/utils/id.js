export function nextId() {
  // IDs are opaque strings so they remain stable across platforms and exports.
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function canonicalId(value) {
  return value === null || value === undefined ? nextId() : String(value);
}

export function isoNow() {
  return new Date().toISOString();
}
