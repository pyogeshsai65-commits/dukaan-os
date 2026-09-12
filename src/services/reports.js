import { selectMonthlyPL, selectCollections, selectStockSummary, selectBestProducts, selectSlowProducts, selectDeadProducts, selectWhyProfitInsights } from '../store/selectors';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export function buildBusinessReport(state, month) {
  return {
    generatedAt: new Date().toISOString(),
    month: selectMonthlyPL(state, month),
    collections: selectCollections(state),
    stock: selectStockSummary(state),
    bestProducts: selectBestProducts(state),
    slowProducts: selectSlowProducts(state),
    deadProducts: selectDeadProducts(state),
    insights: selectWhyProfitInsights(state),
  };
}

export async function exportReportPdf(report) {
  const html = `<html><body style="font-family:Arial;color:#0f172a;padding:24px"><h1>DukaanOS</h1><h2>Monthly Business Report</h2><p>Period: ${report.month.month}</p><hr/><table style="width:100%;border-collapse:collapse"><tr><td>Revenue</td><td>₹${report.month.revenue.toFixed(2)}</td></tr><tr><td>COGS</td><td>₹${report.month.cogs.toFixed(2)}</td></tr><tr><td>Gross Profit</td><td>₹${report.month.grossProfit.toFixed(2)}</td></tr><tr><td>Expenses</td><td>₹${report.month.expenses.toFixed(2)}</td></tr><tr><td><b>Net Profit</b></td><td><b>₹${report.month.netProfit.toFixed(2)}</b></td></tr></table><h3>Top products</h3><ul>${report.bestProducts.map((item) => `<li>${item.productName}: ${item.quantity} sold, ₹${item.profit.toFixed(2)} profit</li>`).join('')}</ul><p>Generated ${new Date(report.generatedAt).toLocaleString()}</p></body></html>`;
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
  return { id: transaction.id, issuedAt: transaction.occurredAt || transaction.timestamp, customerName: transaction.customerName || 'Walk-in customer', items: transaction.items || [], total: Number(transaction.amount || 0), paymentMethod: transaction.paymentMethod || 'paid' };
}

export async function exportInvoicePdf(transaction) {
  const invoice = buildInvoice(transaction);
  const rows = invoice.items.map((item) => `<tr><td>${item.productName}</td><td>${item.quantity}</td><td>₹${Number(item.unitPrice || 0).toFixed(2)}</td><td>₹${Number(item.amount || 0).toFixed(2)}</td></tr>`).join('');
  const html = `<html><body style="font-family:Arial;padding:24px"><h1>DukaanOS</h1><h2>${invoice.paymentMethod === 'udhaar' ? 'Udhaar Invoice' : 'Sale Receipt'}</h2><p>Transaction: ${invoice.id}</p><p>Customer: ${invoice.customerName}</p><p>Date: ${new Date(invoice.issuedAt).toLocaleString()}</p><table style="width:100%;border-collapse:collapse"><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table><h3>Total: ₹${invoice.total.toFixed(2)}</h3></body></html>`;
  try {
    const result = await Print.printToFileAsync({ html });
    if (result?.uri && await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share DukaanOS invoice' });
    return { supported: true, uri: result?.uri, message: 'Invoice PDF created.' };
  } catch (error) {
    return { supported: false, message: `Could not create invoice PDF: ${error.message}` };
  }
}
