import { canonicalId, isoNow } from '../utils/id';

export const defaultProducts = [
  { id: '1', name: 'Parle-G', stock: 24, purchasePrice: 8, sellingPrice: 10 },
  { id: '2', name: 'Tata Salt', stock: 12, purchasePrice: 22, sellingPrice: 28 },
  { id: '3', name: 'Maggi', stock: 8, purchasePrice: 10, sellingPrice: 14 },
  { id: '4', name: 'Amul Milk', stock: 6, purchasePrice: 26, sellingPrice: 30 },
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
  return saved.map((product, index) => ({
    id: canonicalId(product.id ?? `legacy-product-${index}`),
    name: product.name ?? 'Unnamed Product',
    stock: Number(product.stock) || 0,
    purchasePrice: Number(product.purchasePrice ?? product.price ?? 0),
    sellingPrice: Number(product.sellingPrice ?? product.price ?? 0),
    barcode: product.barcode ? String(product.barcode) : '',
    expiryDate: product.expiryDate || product.expiryAt || '',
    archived: product.archived === true,
    archivedAt: product.archivedAt || null,
    deletedAt: product.deletedAt || null,
    archivedBeforeDelete: product.archivedBeforeDelete === true,
    archivedAtBeforeDelete: product.archivedAtBeforeDelete || null,
  }));
}

export function normalizeTransactions(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.filter((item) => item && item.type).map((item, index) => ({
    ...item,
    id: canonicalId(item.id ?? `legacy-transaction-${index}`),
    timestamp: item.timestamp || item.createdAt || isoNow(),
    createdAt: item.createdAt || (typeof item.timestamp === 'string' ? item.timestamp : isoNow()),
  }));
}

export function normalizeCustomers(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.map((customer, index) => ({
    id: canonicalId(customer.id ?? `legacy-customer-${index}`),
    name: customer.name ?? 'Unnamed Customer',
    phone: customer.phone ?? '',
    balance: Number(customer.balance) || 0,
  }));
}

export function normalizeEvents(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.filter(Boolean).map((event, index) => ({
    ...event,
    id: canonicalId(event.id ?? `legacy-event-${index}`),
    occurredAt: event.occurredAt || event.createdAt || isoNow(),
    createdAt: event.createdAt || event.occurredAt || isoNow(),
  }));
}

export function normalizeExpenses(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.filter(Boolean).map((expense) => ({ ...expense, id: canonicalId(expense.id), amount: Number(expense.amount) || 0, category: expense.category || 'general', occurredAt: expense.occurredAt || expense.createdAt || isoNow(), createdAt: expense.createdAt || expense.occurredAt || isoNow() }));
}

export const SNAPSHOT_VERSION = 2;

export function migrateSnapshot(snapshot) {
  const version = Number(snapshot?.version || 1);
  const data = snapshot?.data && typeof snapshot.data === 'object' ? snapshot.data : {};
  if (version >= SNAPSHOT_VERSION) return { version: SNAPSHOT_VERSION, data };
  return {
    version: SNAPSHOT_VERSION,
    data: {
      ...data,
      products: normalizeProducts(data.products),
      transactions: normalizeTransactions(data.transactions),
      customers: normalizeCustomers(data.customers),
      events: normalizeEvents(data.events),
      expenses: normalizeExpenses(data.expenses),
    },
  };
}
