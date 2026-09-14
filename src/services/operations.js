import { nextId, isoNow } from '../utils/id';

export function createTransaction({ id, type, productId, productName, quantity, amount, unitCost, profit = 0, customerName = '', note = '', items, customerId, paymentMethod }) {
  const occurredAt = isoNow();
  return { id: id || nextId(), type, productId, productName, quantity, amount, unitCost, profit, timestamp: occurredAt, createdAt: occurredAt, occurredAt, customerName, customerId, paymentMethod, note, ...(items ? { items } : {}) };
}

export function updateStock(products, productId, quantity) {
  return products.map((product) => String(product.id) === String(productId) ? { ...product, stock: Number(product.stock || 0) + Number(quantity || 0) } : product);
}

export function saleEvent({ sale, items }) {
  return { id: nextId(), type: 'sale', occurredAt: sale.occurredAt || isoNow(), saleId: sale.id, items, amount: sale.amount, customerId: sale.customerId, paymentMethod: sale.paymentMethod };
}

export function eventForTransaction(transaction) {
  return { id: nextId(), type: transaction.type, occurredAt: transaction.occurredAt || transaction.timestamp || isoNow(), transactionId: transaction.id, amount: Number(transaction.amount || 0), productId: transaction.productId, productName: transaction.productName, quantity: Number(transaction.quantity || 0), customerId: transaction.customerId, paymentMethod: transaction.paymentMethod, items: transaction.items };
}

export function createExpense({ category = 'general', amount, note = '' }) {
  const createdAt = isoNow();
  return { id: nextId(), type: 'expense', category, amount: Number(amount), note, createdAt, occurredAt: createdAt };
}

export function createInventoryAdjustment({ productId, productName = '', quantity, reason = 'adjustment', note = '', direction = 'REMOVE' }) {
  const occurredAt = isoNow();
  return { id: nextId(), type: 'inventory-adjustment', productId: String(productId), productName, quantity: Number(quantity), direction, amount: 0, profit: 0, reason, note, occurredAt, createdAt: occurredAt };
}
