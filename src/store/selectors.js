export const totalStockValue = (products) => products.reduce((total, p) => total + Number(p.stock || 0) * Number(p.purchasePrice || 0), 0);
export const totalProfit = (transactions) => transactions.reduce((total, t) => (t.type === 'sale' || t.type === 'credit-sale' ? total + Number(t.profit || 0) : total), 0);
export const totalUdhaar = (customers) => customers.reduce((total, c) => total + Number(c.balance || 0), 0);
