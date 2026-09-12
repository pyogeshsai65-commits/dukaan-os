// Application-side interfaces. Native camera/scanner and expiry notifications can be
// plugged in later without changing product or inventory screens.
export function normalizeBarcode(value) { return String(value || '').trim(); }
export function getExpiryStatus(product, now = Date.now()) {
  if (!product?.expiryDate && !product?.expiryAt) return { status: 'unknown', label: 'No expiry date' };
  const time = new Date(product.expiryDate || product.expiryAt).getTime();
  if (!Number.isFinite(time)) return { status: 'unknown', label: 'Invalid expiry date' };
  if (time < now) return { status: 'expired', label: 'Expired' };
  if (time - now < 30 * 86400000) return { status: 'soon', label: 'Expires soon' };
  return { status: 'ok', label: 'Fresh' };
}
export const barcodeService = { scan: async () => ({ supported: false, value: null }), lookup: async (barcode) => ({ barcode: normalizeBarcode(barcode), supported: false }) };
