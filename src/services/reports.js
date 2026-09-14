import { selectMonthlyPL, selectCollections, selectStockSummary, selectBestProducts, selectSlowProducts, selectDeadProducts, selectWhyProfitInsights } from '../store/selectors';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { transactionLines } from '../store/ledger';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const reportMoney = (value) => value === null ? 'Unavailable' : Number(value || 0).toFixed(2);

export function buildBusinessReport(state, month) {
  const from = `${month}-01T00:00:00`;
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999`;
  const inMonth = (transaction) => {
    const date = new Date(transaction.occurredAt || transaction.timestamp || transaction.createdAt);
    return Number.isFinite(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === month;
  };
  const paymentsReceived = (state.transactions || []).filter((transaction) => (transaction.type === 'payment' || transaction.type === 'payment-reversal') && inMonth(transaction)).reduce((total, transaction) => total + (transaction.type === 'payment' ? Number(transaction.amount || 0) : -Number(transaction.amount || 0)), 0);
  const purchases = (state.transactions || []).filter((transaction) => transaction.type === 'purchase' && inMonth(transaction)).reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  return {
    generatedAt: new Date().toISOString(),
    month: selectMonthlyPL(state, month),
    collections: selectCollections(state),
    stock: selectStockSummary(state),
    bestProducts: selectBestProducts(state, 5, from, to),
    slowProducts: selectSlowProducts(state, 30, Date.now(), from, to),
    deadProducts: selectDeadProducts(state, 90, Date.now(), from, to),
    insights: selectWhyProfitInsights(state, from, to),
    paymentsReceived,
    purchases,
  };
}

export async function exportReportPdf(report) {
  const html = `<html><body style="font-family:Arial;color:#0f172a;padding:24px"><h1>DukaanOS</h1><h2>Monthly Business Report</h2><p>Period: ${escapeHtml(report.month.month)}</p><hr/><table style="width:100%;border-collapse:collapse"><tr><td>Revenue</td><td>₹${reportMoney(report.month.revenue)}</td></tr><tr><td>COGS</td><td>${report.month.cogs === null ? 'Unavailable' : `₹${reportMoney(report.month.cogs)}`}</td></tr><tr><td>Gross Profit</td><td>${report.month.grossProfit === null ? 'Unavailable' : `₹${reportMoney(report.month.grossProfit)}`}</td></tr><tr><td>Expenses</td><td>₹${reportMoney(report.month.expenses)}</td></tr><tr><td><b>Net Profit</b></td><td><b>${report.month.netProfit === null ? 'Unavailable' : `₹${reportMoney(report.month.netProfit)}`}</b></td></tr></table><h3>Top products</h3><ul>${report.bestProducts.map((item) => `<li>${escapeHtml(item.productName)}: ${item.quantity} sold, ₹${reportMoney(item.profit)} profit</li>`).join('')}</ul><p>Generated ${new Date(report.generatedAt).toLocaleString()}</p></body></html>`;
  try {
    const result = await Print.printToFileAsync({ html });
    if (result?.uri && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share DukaanOS report' });
      return { supported: true, uri: result.uri, message: 'Report PDF created and shared.' };
    }
    return { supported: true, uri: result?.uri, message: 'Report PDF created.' };
  } catch (error) {
    return { supported: false, message: `Could not create report PDF: ${error.message}` };
  }
}

export function buildInvoice(transaction) {
  return { id: transaction.id, issuedAt: transaction.occurredAt || transaction.timestamp, customerName: transaction.customerName || 'Walk-in customer', items: transaction.items || [], total: Number(transaction.amount || 0), paymentMethod: transaction.paymentMethod || (transaction.type === 'credit-sale' ? 'udhaar' : 'paid') };
}

export async function exportInvoicePdf(transaction) {
  const invoice = buildInvoice(transaction);
  const rows = transactionLines(transaction).map((item) => `<tr><td>${escapeHtml(item.productName)}</td><td>${item.quantity}</td><td>₹${Number(item.unitPrice || 0).toFixed(2)}</td><td>₹${Number(item.amount || 0).toFixed(2)}</td></tr>`).join('');
  const html = `<html><body style="font-family:Arial;padding:24px"><h1>DukaanOS</h1><h2>${invoice.paymentMethod === 'udhaar' ? 'Udhaar Invoice' : 'Sale Receipt'}</h2><p>Transaction: ${escapeHtml(invoice.id)}</p><p>Customer: ${escapeHtml(invoice.customerName)}</p><p>Date: ${new Date(invoice.issuedAt).toLocaleString()}</p><table style="width:100%;border-collapse:collapse"><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table><h3>Total: ₹${invoice.total.toFixed(2)}</h3></body></html>`;
  try {
    const result = await Print.printToFileAsync({ html });
    if (result?.uri && await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share DukaanOS invoice' });
    return { supported: true, uri: result?.uri, message: 'Invoice PDF created.' };
  } catch (error) {
    return { supported: false, message: `Could not create invoice PDF: ${error.message}` };
  }
}
