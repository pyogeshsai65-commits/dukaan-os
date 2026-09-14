// Application-side interfaces. Native camera/scanner and expiry notifications can be
// plugged in later without changing product or inventory screens.
export function normalizeBarcode(value) { return String(value || '').trim(); }
export function getExpiryStatus(product, now = Date.now()) {
  if (!product?.expiryDate && !product?.expiryAt) return { status: 'unknown', label: 'No expiry date' };
  const raw = product.expiryDate || product.expiryAt;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const time = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999).getTime() : new Date(raw).getTime();
  if (!Number.isFinite(time)) return { status: 'unknown', label: 'Invalid expiry date' };
  if (time < now) return { status: 'expired', label: 'Expired' };
  if (time - now < 30 * 86400000) return { status: 'soon', label: 'Expires soon' };
  return { status: 'ok', label: 'Fresh' };
}
export const barcodeService = { scan: async () => ({ supported: false, value: null }), lookup: async (barcode) => ({ barcode: normalizeBarcode(barcode), supported: false }) };
