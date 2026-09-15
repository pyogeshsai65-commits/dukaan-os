import { fromPaise, toPaise } from '../utils/money';
import { customerBalance, saleLines, transactionCost, transactionDate } from './ledger';

const inRange = (value, from, to) => (!from || value >= from) && (!to || value <= to);
const localMonth = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const sale = (transaction) => transaction.type === 'sale' || transaction.type === 'credit-sale';

export const totalStockValue = (products = []) => fromPaise(products.reduce((total, p) => total + Number(p.stock || 0) * toPaise(p.purchasePrice), 0));
export const totalProfit = (transactions = []) => fromPaise(transactions.reduce((total, t) => total + toPaise(t.profit), 0));
export const totalUdhaar = (customers = [], transactions = []) => fromPaise(customers.reduce((total, c) => total + Math.max(0, toPaise(customerBalance(transactions, c.id))), 0));
export const filterByDateRange = (records = [], from, to) => records.filter((r) => inRange(transactionDate(r), from, to));
export const selectSales = (state, from, to) => filterByDateRange((state.transactions || []).filter(sale), from, to);
export const selectPurchases = (state, from, to) => filterByDateRange((state.transactions || []).filter((t) => t.type === 'purchase' || t.type === 'opening-inventory'), from, to);
export const selectReceivables = (state) => (state.customers || []).map((c) => ({ ...c, receivable: customerBalance(state.transactions || [], c.id) }));

export const selectCOGS = (state, from, to) => selectSales(state, from, to).reduce((total, transaction) => {
  const cost = transactionCost(transaction, state.products || []);
  return cost.known ? total + cost.valuePaise : total;
}, 0) / 100;

export const selectUnknownCostSales = (state, from, to) => selectSales(state, from, to).filter((transaction) => !transactionCost(transaction, state.products || []).known);
export const selectGrossProfit = (state, from, to) => selectSales(state, from, to).reduce((total, transaction) => total + toPaise(transaction.amount), 0) / 100 - selectCOGS(state, from, to);
export const selectExpenses = (state, from, to) => filterByDateRange(state.expenses || [], from, to);
export const selectNetProfit = (state, from, to) => selectGrossProfit(state, from, to) - selectExpenses(state, from, to).reduce((total, e) => total + Number(e.amount || 0), 0);

export const selectProductProfitability = (state, from, to) => {
  const result = {};
  selectSales(state, from, to).forEach((transaction) => saleLines(transaction, state.products || []).forEach((line) => {
    const key = String(line.productId || line.productName);
    const current = result[key] || { productId: line.productId, productName: line.productName, quantity: 0, revenue: 0, cogs: null, profit: null, costKnown: true };
    current.quantity += Number(line.quantity || 0);
    current.revenue += Number(line.amount || 0);
    if (line.costKnown) {
      current.cogs = (current.cogs || 0) + Number(line.unitCost || 0) * Number(line.quantity || 0);
      current.profit = current.revenue - current.cogs;
    } else {
      current.costKnown = false;
      current.profit = null;
    }
    result[key] = current;
  }));
  return Object.values(result);
};

export const selectSlowStock = (state, days = 30, now = Date.now(), from, to) => (state.products || []).filter((product) => {
  if (Number(product.stock || 0) <= 0) return false;
  const relevantSales = selectSales(state, from, to);
  return !relevantSales.some((transaction) => {
    const time = new Date(transactionDate(transaction)).getTime();
    if (!Number.isFinite(time) || time > now) return false;
    return now - time <= days * 86400000 && saleLines(transaction, state.products || []).some((line) => String(line.productId) === String(product.id));
  });
});

export const selectExpiryRisk = (state) => (state.products || []).filter((p) => p.expiryDate || p.expiryAt).map((p) => ({ productId: p.id, expiryDate: p.expiryDate || p.expiryAt }));
export const selectBarcodeMatches = (state, barcode) => (state.products || []).filter((p) => barcode && String(p.barcode || '') === String(barcode));
export const selectExpiryStatuses = (state, now = new Date()) => (state.products || []).filter((p) => p.expiryDate || p.expiryAt).map((p) => {
  const raw = p.expiryDate || p.expiryAt;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const expiryEnd = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999).getTime() : new Date(raw).getTime();
  const time = new Date(now).getTime();
  const status = !Number.isFinite(expiryEnd) ? 'unknown' : expiryEnd < time ? 'expired' : expiryEnd - time < 30 * 86400000 ? 'soon' : 'ok';
  return { productId: p.id, expiryDate: raw, status };
});

export const selectMonthlyPL = (state, month = localMonth()) => {
  const sales = selectSales(state).filter((t) => { const d = new Date(transactionDate(t)); return Number.isFinite(d.getTime()) && localMonth(d) === month; });
  const revenue = sales.reduce((n, t) => n + Number(t.amount || 0), 0);
  const unknownCostSales = selectUnknownCostSales(state).filter((t) => localMonth(new Date(transactionDate(t))) === month).length;
  const cogs = unknownCostSales ? null : sales.reduce((total, transaction) => total + transactionCost(transaction, state.products || []).valuePaise, 0) / 100;
  const expenses = selectExpenses(state).filter((e) => { const d = new Date(transactionDate(e)); return Number.isFinite(d.getTime()) && localMonth(d) === month; }).reduce((n, e) => n + Number(e.amount || 0), 0);
  return { month, revenue, cogs, grossProfit: cogs === null ? null : revenue - cogs, expenses, netProfit: cogs === null ? null : revenue - cogs - expenses, unknownCostSales };
};
export const selectCollections = (state) => selectReceivables(state).filter((c) => c.receivable > 0).sort((a, b) => b.receivable - a.receivable);
export const selectStockSummary = (state) => (state.products || []).map((p) => ({ ...p, stockValue: Number(p.stock || 0) * Number(p.purchasePrice || 0), low: Number(p.stock || 0) <= 5 }));
export const selectBestProducts = (state, limit = 5, from, to) => selectProductProfitability(state, from, to).filter((p) => p.costKnown).sort((a, b) => b.profit - a.profit).slice(0, limit);
export const selectSlowProducts = (state, days = 30, now, from, to) => selectSlowStock(state, days, now, from, to);
export const selectDeadProducts = (state, days = 90, now, from, to) => selectSlowStock(state, days, now, from, to);
export const selectWhyProfitInsights = (state, from, to) => {
  const best = selectBestProducts(state, 1, from, to)[0];
  const slow = selectSlowProducts(state, 30, Date.now(), from, to);
  const periodTransactions = (state.transactions || []).filter((transaction) => {
    const time = new Date(transactionDate(transaction)).getTime();
    return Number.isFinite(time) && (!from || time >= new Date(from).getTime()) && (!to || time <= new Date(to).getTime());
  });
  const collections = selectCollections(state).filter((customer) => periodTransactions.some((transaction) => String(transaction.customerId) === String(customer.id)));
  const insights = [];
  if (best) insights.push(`${best.productName} is your strongest profit driver (${best.quantity} sold).`);
  if (slow.length) insights.push(`${slow.length} stocked product${slow.length > 1 ? 's are' : ' is'} moving slowly; consider a bundle or promotion.`);
  if (collections.length) insights.push(`${collections.length} customer${collections.length > 1 ? 's have' : ' has'} outstanding udhaar. Send a reminder before extending more credit.`);
  if (!insights.length) insights.push('Record a few sales to unlock deterministic business insights.');
  return insights;
};
