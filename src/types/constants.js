export const defaultProducts = [
  { id: 1, name: 'Parle-G', stock: 24, purchasePrice: 8, sellingPrice: 10 },
  { id: 2, name: 'Tata Salt', stock: 12, purchasePrice: 22, sellingPrice: 28 },
  { id: 3, name: 'Maggi', stock: 8, purchasePrice: 10, sellingPrice: 14 },
  { id: 4, name: 'Amul Milk', stock: 6, purchasePrice: 26, sellingPrice: 30 },
];

export const STORAGE_KEYS = {
  products: 'dukaan-products',
  sales: 'dukaan-sales',
  purchases: 'dukaan-purchases',
  transactions: 'dukaan-transactions',
  customers: 'dukaan-customers',
};

export function normalizeProducts(saved) {
  if (!Array.isArray(saved)) return defaultProducts;
  return saved.map((product) => ({
    id: product.id ?? Date.now() + Math.random(),
    name: product.name ?? 'Unnamed Product',
    stock: Number(product.stock) || 0,
    purchasePrice: Number(product.purchasePrice ?? product.price ?? 0),
    sellingPrice: Number(product.sellingPrice ?? product.price ?? 0),
  }));
}

export function normalizeTransactions(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.filter((item) => item && item.type && item.productName);
}

export function normalizeCustomers(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.map((customer) => ({
    id: customer.id ?? Date.now() + Math.random(),
    name: customer.name ?? 'Unnamed Customer',
    phone: customer.phone ?? '',
    balance: Number(customer.balance) || 0,
  }));
}
