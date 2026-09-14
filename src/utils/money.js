export function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

export function toPaise(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

export function fromPaise(value) {
  return Math.round(Number(value) || 0) / 100;
}
