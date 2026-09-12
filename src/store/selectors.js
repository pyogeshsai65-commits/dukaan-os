const inRange = (value, from, to) => (!from || value >= from) && (!to || value <= to);
const dateOf = (record) => record.occurredAt || record.createdAt || record.timestamp || '';
const localMonth = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export const totalStockValue = (products = []) => products.reduce((total, p) => total + Number(p.stock || 0) * Number(p.purchasePrice || 0), 0);
export const totalProfit = (transactions = []) => transactions.reduce((total, t) => (t.type === 'sale' || t.type === 'credit-sale' ? total + Number(t.profit || 0) : total), 0);
export const totalUdhaar = (customers) => customers.reduce((total, c) => total + Number(c.balance || 0), 0);
export const filterByDateRange = (records = [], from, to) => records.filter((r) => inRange(r.occurredAt || r.createdAt || r.timestamp || '', from, to));
export const selectSales = (state, from, to) => filterByDateRange((state.transactions || []).filter((t) => t.type === 'sale' || t.type === 'credit-sale'), from, to);
export const selectPurchases = (state, from, to) => filterByDateRange((state.transactions || []).filter((t) => t.type === 'purchase'), from, to);
export const selectReceivables = (state) => (state.customers || []).map((c) => ({ ...c, receivable: Number(c.balance || 0) }));
export const selectCOGS = (state, from, to) => selectSales(state, from, to).reduce((n, sale) => n + ((sale.items && sale.items.length) ? sale.items : [{ unitCost: sale.unitCost || sale.purchasePrice || 0, quantity: sale.quantity || 0 }]).reduce((sum, line) => sum + Number(line.unitCost || line.purchasePrice || 0) * Number(line.quantity || 0), 0), 0);
export const selectGrossProfit = (state, from, to) => selectSales(state, from, to).reduce((n, sale) => n + Number(sale.amount || 0), 0) - selectCOGS(state, from, to);
export const selectExpenses = (state, from, to) => filterByDateRange(state.expenses || [], from, to);
export const selectNetProfit = (state, from, to) => selectGrossProfit(state, from, to) - selectExpenses(state, from, to).reduce((n, e) => n + Number(e.amount || 0), 0);
export const selectProductProfitability = (state, from, to) => {
  const result = {};
  selectSales(state, from, to).forEach((sale) => (sale.items || []).forEach((line) => {
    const key = String(line.productId); const current = result[key] || { productId: key, productName: line.productName, quantity: 0, revenue: 0, cogs: 0, profit: 0 };
    current.quantity += Number(line.quantity || 0); current.revenue += Number(line.amount || 0); current.cogs += Number(line.unitCost || 0) * Number(line.quantity || 0); current.profit = current.revenue - current.cogs; result[key] = current;
  }));
  return Object.values(result);
};
export const selectSlowStock = (state, days = 30) => (state.products || []).filter((p) => Number(p.stock || 0) > 0 && !(state.transactions || []).some((t) => (t.type === 'sale' || t.type === 'credit-sale') && (Date.now() - new Date(t.occurredAt || t.timestamp).getTime()) <= days * 86400000 && (t.items || []).some((i) => String(i.productId) === String(p.id))));
export const selectExpiryRisk = (state) => (state.products || []).filter((p) => p.expiryDate || p.expiryAt).map((p) => ({ productId: p.id, expiryDate: p.expiryDate || p.expiryAt }));
export const selectBarcodeMatches = (state, barcode) => (state.products || []).filter((p) => barcode && String(p.barcode || '') === String(barcode));
export const selectExpiryStatuses = (state, now = Date.now()) => (state.products || []).filter((p) => p.expiryDate || p.expiryAt).map((p) => {
  const time = new Date(p.expiryDate || p.expiryAt).getTime();
  const status = !Number.isFinite(time) ? 'unknown' : time < now ? 'expired' : time - now < 30 * 86400000 ? 'soon' : 'ok';
  return { productId: p.id, expiryDate: p.expiryDate || p.expiryAt, status };
});
export const selectMonthlyPL = (state, month = localMonth()) => {
  const sales = selectSales(state).filter((t) => { const d = new Date(dateOf(t)); return Number.isFinite(d.getTime()) && localMonth(d) === month; });
  const revenue = sales.reduce((n, t) => n + Number(t.amount || 0), 0);
  const cogs = sales.reduce((n, t) => n + (t.items || []).reduce((m, i) => m + Number(i.unitCost || 0) * Number(i.quantity || 0), 0), 0);
  const expenses = selectExpenses(state).filter((e) => { const d = new Date(dateOf(e)); return Number.isFinite(d.getTime()) && localMonth(d) === month; }).reduce((n, e) => n + Number(e.amount || 0), 0);
  return { month, revenue, cogs, grossProfit: revenue - cogs, expenses, netProfit: revenue - cogs - expenses };
};
export const selectCollections = (state) => selectReceivables(state).filter((c) => c.receivable > 0).sort((a, b) => b.receivable - a.receivable);
export const selectStockSummary = (state) => (state.products || []).map((p) => ({ ...p, stockValue: Number(p.stock || 0) * Number(p.purchasePrice || 0), low: Number(p.stock || 0) <= 5 }));
export const selectBestProducts = (state, limit = 5) => selectProductProfitability(state).sort((a, b) => b.profit - a.profit).slice(0, limit);
export const selectSlowProducts = (state, days = 30) => selectSlowStock(state, days);
export const selectDeadProducts = (state, days = 90) => selectSlowStock(state, days);
export const selectWhyProfitInsights = (state) => {
  const best = selectBestProducts(state, 1)[0];
  const slow = selectSlowProducts(state);
  const collections = selectCollections(state);
  const insights = [];
  if (best) insights.push(`${best.productName} is your strongest profit driver (${best.quantity} sold).`);
  if (slow.length) insights.push(`${slow.length} stocked product${slow.length > 1 ? 's are' : ' is'} moving slowly; consider a bundle or promotion.`);
  if (collections.length) insights.push(`${collections.length} customer${collections.length > 1 ? 's have' : ' has'} outstanding udhaar. Send a reminder before extending more credit.`);
  if (!insights.length) insights.push('Record a few sales to unlock deterministic business insights.');
  return insights;
};
