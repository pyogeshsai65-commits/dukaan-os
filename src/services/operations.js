export function createTransaction({ type, productName, quantity, amount, profit = 0, customerName = '', note = '' }) {
  const timestamp = Date.now();
  return { id: timestamp, type, productName, quantity, amount, profit, timestamp, customerName, note };
}

export function updateStock(products, productId, quantity) {
  return products.map((product) => product.id === productId ? { ...product, stock: product.stock + quantity } : product);
}
