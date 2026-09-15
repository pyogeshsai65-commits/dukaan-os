import { transactionTitle } from '../components/TransactionRow';

function score(value, query) {
  const text = String(value || '').toLowerCase();
  const needle = query.toLowerCase();
  if (!needle || !text) return 0;
  if (text === needle) return 1000;
  if (text.startsWith(needle)) return 700;
  if (text.includes(needle)) return 400;
  let cursor = 0;
  for (const character of needle) {
    cursor = text.indexOf(character, cursor);
    if (cursor < 0) return 0;
    cursor += 1;
  }
  return 100;
}

export function searchDukaan({ query, products = [], customers = [], transactions = [] }) {
  const clean = String(query || '').trim();
  if (!clean) return { products: [], customers: [], transactions: [] };
  return {
    products: products.map((product) => ({ ...product, score: score(product.name, clean) })).filter((item) => item.score).sort((a, b) => b.score - a.score).slice(0, 8),
    customers: customers.map((customer) => ({ ...customer, score: score(`${customer.name} ${customer.phone}`, clean) })).filter((item) => item.score).sort((a, b) => b.score - a.score).slice(0, 8),
    transactions: transactions.map((transaction) => ({ ...transaction, score: score(`${transactionTitle(transaction)} ${transaction.customerName || ''} ${transaction.note || ''}`, clean) })).filter((item) => item.score).sort((a, b) => b.score - a.score).slice(0, 10),
  };
}
