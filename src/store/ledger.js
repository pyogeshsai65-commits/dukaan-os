import { toPaise, fromPaise } from '../utils/money';

const saleTypes = new Set(['sale', 'credit-sale']);

export function transactionDate(transaction) {
  return transaction?.occurredAt || transaction?.createdAt || transaction?.timestamp || '';
}

export function isSale(transaction) {
  return saleTypes.has(transaction?.type);
}

export function transactionLines(transaction, products = []) {
  if (Array.isArray(transaction?.items) && transaction.items.length) {
    return transaction.items.map((line) => ({
      productId: line.productId ? String(line.productId) : '',
      productName: line.productName || transaction.productName || 'Unknown product',
      quantity: Number(line.quantity || 0),
      unitPrice: Number(line.unitPrice ?? line.price ?? 0),
      amount: Number(line.amount ?? (Number(line.unitPrice ?? line.price ?? 0) * Number(line.quantity || 0))),
      unitCost: line.unitCost !== null && line.unitCost !== undefined && Number.isFinite(Number(line.unitCost)) ? Number(line.unitCost) : null,
      costKnown: line.unitCost !== null && line.unitCost !== undefined && Number.isFinite(Number(line.unitCost)),
    }));
  }

  if (!transaction || !transaction.type || (!transaction.productName && !transaction.productId)) return [];
  const product = products.find((item) => (transaction.productId && String(item.id) === String(transaction.productId)) || (transaction.productName && item.name === transaction.productName));
  const quantity = Number(transaction.quantity || 0);
  const unitPrice = Number(transaction.unitPrice ?? (quantity ? Number(transaction.amount || 0) / quantity : 0));
  const explicitCost = transaction.unitCost ?? transaction.purchasePrice;
  const costKnown = explicitCost !== null && explicitCost !== undefined && Number.isFinite(Number(explicitCost));
  return [{
    productId: transaction.productId ? String(transaction.productId) : String(product?.id || ''),
    productName: transaction.productName || product?.name || 'Unknown product',
    quantity,
    unitPrice,
    amount: Number(transaction.amount || 0),
    unitCost: costKnown ? Number(explicitCost) : null,
    costKnown,
  }];
}

export function saleLines(transaction, products = []) {
  return isSale(transaction) ? transactionLines(transaction, products) : [];
}

export function customerBalancePaise(transactions = [], customerId) {
  return transactions.reduce((balance, transaction) => {
    if (String(transaction.customerId) !== String(customerId)) return balance;
    if (transaction.type === 'credit-sale' || transaction.type === 'credit') return balance + toPaise(transaction.amount);
    if (transaction.type === 'payment') return balance - toPaise(transaction.amount);
    if (transaction.type === 'payment-reversal') return balance + toPaise(transaction.amount);
    return balance;
  }, 0);
}

export function customerBalance(transactions, customerId) {
  return fromPaise(Math.max(0, customerBalancePaise(transactions, customerId)));
}

export function transactionCost(transaction, products = []) {
  return saleLines(transaction, products).reduce((result, line) => {
    if (!line.costKnown) return { ...result, known: false };
    return { valuePaise: result.valuePaise + toPaise(line.unitCost * line.quantity), known: result.known };
  }, { valuePaise: 0, known: true });
}
