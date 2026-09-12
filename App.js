import React, { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StatusBar, Text, View } from 'react-native';
import { DukaanProvider, useDukaan } from './src/store/DukaanContext';
import { createTransaction, createExpense, eventForTransaction } from './src/services/operations';
import { nextId, isoNow } from './src/utils/id';
import { totalProfit, totalStockValue, totalUdhaar } from './src/store/selectors';
import { styles } from './src/components/styles';
import { SaleModal, PurchaseModal, AddProductModal, AddCustomerModal, UdhaarModal, PaymentModal, ExpenseModal } from './src/components/Modals';
import HomeScreen from './src/screens/HomeScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import { money } from './src/utils/money';
import ReportsScreen from './src/screens/ReportsScreen';
import CollectionsScreen from './src/screens/CollectionsScreen';

function Dashboard() {
  const { state, set, domain } = useDukaan();
  const { products, sales, purchases, transactions, customers } = state;
  const [activeTab, setActiveTab] = useState('home'), [search, setSearch] = useState('');
  const [modals, setModals] = useState({});
  const modal = (name, visible) => setModals((current) => ({ ...current, [name]: visible }));
  const actions = { modal, tab: setActiveTab, deleteProduct: (id) => { const product = products.find((p) => p.id === id); Alert.alert('Delete Product', `Delete ${product?.name || 'this product'}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => set('products', (current) => current.filter((p) => p.id !== id)) }]); } };
  function recordSale(items, paymentMethod, customerId) {
    if (!Array.isArray(items) || items.length === 0) return Alert.alert('Record Sale', 'Add at least one product to the sale.');
    const customer = customers.find((c) => String(c.id) === String(customerId));
    if (paymentMethod === 'udhaar' && !customer) return Alert.alert('Record Sale', 'Select or add a customer for an udhaar sale.');

    const lineItems = items.map((item) => {
      const product = products.find((p) => String(p.id) === String(item.productId));
      const quantity = Number(item.quantity);
      return {
        product,
        quantity,
        valid: !!product && Number.isFinite(quantity) && quantity > 0 && quantity <= Number(product?.stock || 0),
      };
    });
    const invalidItem = lineItems.find((item) => !item.valid);
    if (invalidItem) {
      if (!invalidItem.product) return Alert.alert('Record Sale', 'One selected product is no longer available.');
      if (!Number.isFinite(invalidItem.quantity) || invalidItem.quantity <= 0) return Alert.alert('Record Sale', `Enter a valid quantity for ${invalidItem.product.name}.`);
      return Alert.alert('Record Sale', `Only ${invalidItem.product.stock} units of ${invalidItem.product.name} are available.`);
    }

    const timestamp = isoNow();
    const saleItems = lineItems.map(({ product, quantity }) => ({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: Number(product.sellingPrice),
      unitCost: Number(product.purchasePrice),
      amount: Number(product.sellingPrice) * quantity,
      profit: (Number(product.sellingPrice) - Number(product.purchasePrice)) * quantity,
    }));
    const amount = saleItems.reduce((total, item) => total + item.amount, 0);
    const profit = saleItems.reduce((total, item) => total + item.profit, 0);
    const quantity = saleItems.reduce((total, item) => total + item.quantity, 0);
    const updatedProducts = products.map((product) => {
      const item = saleItems.find((line) => line.productId === product.id);
      return item ? { ...product, stock: product.stock - item.quantity } : product;
    });
    const transaction = createTransaction({
      type: paymentMethod === 'udhaar' ? 'credit-sale' : 'sale',
      productName: saleItems.length === 1 ? saleItems[0].productName : `${saleItems.length} products`,
      quantity,
      amount,
      profit,
      customerName: customer?.name || '',
      customerId: customer?.id,
      paymentMethod,
      items: saleItems,
      note: paymentMethod === 'udhaar' ? `Sale on udhaar to ${customer.name}` : 'Paid sale',
    });
    domain({ products: updatedProducts, sales: sales + amount, customers: paymentMethod === 'udhaar' ? customers.map((c) => c.id === customer.id ? { ...c, balance: Number(c.balance || 0) + amount } : c) : customers, transactions: [transaction, ...transactions] }, [eventForTransaction(transaction)]);
    modal('sale', false);
  }
  function recordPurchase(productId, quantity) {
    const product = products.find((p) => String(p.id) === String(productId)), qty = Number(quantity); if (!product) return Alert.alert('Add Purchase', 'Please select a product.'); if (!qty || qty <= 0) return Alert.alert('Add Purchase', 'Enter a valid quantity.');
    const amount = Number(product.purchasePrice) * qty, transaction = createTransaction({ id: nextId(), type: 'purchase', productName: product.name, quantity: qty, amount, profit: 0 });
    domain({ products: products.map((p) => p.id === product.id ? { ...p, stock: p.stock + qty } : p), purchases: purchases + amount, transactions: [transaction, ...transactions] }, [eventForTransaction(transaction)]); modal('purchase', false);
  }
  function addProduct(name, purchasePrice, sellingPrice, openingStock, barcode = '', expiryDate = '') {
    const cleanName = name.trim(), buy = Number(purchasePrice), sell = Number(sellingPrice), stock = Number(openingStock);
    if (!cleanName) return Alert.alert('Add Product', 'Enter product name.'); if (buy <= 0 || sell <= 0 || stock < 0) return Alert.alert('Add Product', 'Enter valid product values.'); if (products.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) return Alert.alert('Add Product', 'A product with this name already exists.');
    if (barcode && products.some((p) => p.barcode && String(p.barcode) === String(barcode).trim())) return Alert.alert('Add Product', 'A product with this barcode already exists.');
    domain({ products: [...products, { id: nextId(), name: cleanName, stock, purchasePrice: buy, sellingPrice: sell, barcode: String(barcode || '').trim(), expiryDate: expiryDate || '' }] }); modal('product', false);
  }
  function addCustomer(name, phone, closeModal = true) {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName) return Alert.alert('Add Customer', 'Enter customer name.');
    if (customers.some((customer) => customer.name.toLowerCase() === cleanName.toLowerCase())) {
      return Alert.alert('Add Customer', 'A customer with this name already exists.');
    }
    const customer = { id: nextId(), name: cleanName, phone: cleanPhone, balance: 0, createdAt: isoNow() };
    domain({ customers: [...customers, customer] });
    if (closeModal) modal('customer', false);
    return customer;
  }
  function addUdhaar(customerId, amount) { const customer = customers.find((c) => String(c.id) === String(customerId)), value = Number(amount); if (!customer) return Alert.alert('Add Udhaar', 'Please select a customer.'); if (!value || value <= 0) return Alert.alert('Add Udhaar', 'Enter a valid amount.'); const transaction = createTransaction({ type: 'credit', productName: customer.name, quantity: 1, amount: value, customerName: customer.name, customerId: customer.id, note: 'Udhaar added' }); domain({ customers: customers.map((c) => c.id === customer.id ? { ...c, balance: Number(c.balance || 0) + value } : c), transactions: [transaction, ...transactions] }, [eventForTransaction(transaction)]); modal('udhaar', false); }
  function receivePayment(customerId, amount) { const customer = customers.find((c) => String(c.id) === String(customerId)), value = Number(amount); if (!customer) return Alert.alert('Receive Payment', 'Please select a customer.'); if (!value || value <= 0) return Alert.alert('Receive Payment', 'Enter a valid amount.'); if (value > Number(customer.balance || 0)) return Alert.alert('Receive Payment', `Outstanding balance is only ${money(customer.balance)}.`); const transaction = createTransaction({ type: 'payment', productName: customer.name, quantity: 1, amount: value, customerName: customer.name, customerId: customer.id, note: 'Payment received' }); domain({ customers: customers.map((c) => c.id === customer.id ? { ...c, balance: Number(c.balance || 0) - value } : c), transactions: [transaction, ...transactions] }, [eventForTransaction(transaction)]); modal('payment', false); }
  function recordExpense(category, amount, note) { const value = Number(amount); if (!value || value <= 0) return Alert.alert('Add Expense', 'Enter a valid amount.'); const expense = createExpense({ category: category.trim() || 'general', amount: value, note: note.trim() }); domain({ expenses: [expense, ...(state.expenses || [])] }, []); modal('expense', false); }
  const data = useMemo(() => ({ products, sales, purchases, transactions, customers, totalStockValue: totalStockValue(products), totalProfit: totalProfit(transactions), totalUdhaar: totalUdhaar(customers) }), [products, sales, purchases, transactions, customers]);
  const title = activeTab === 'home' ? 'Dashboard' : activeTab === 'inventory' ? 'Inventory' : activeTab === 'customers' ? 'Customers' : activeTab === 'collections' ? 'Collections' : activeTab === 'reports' ? 'Reports' : 'Transactions';
  return <SafeAreaView style={styles.safeArea}><StatusBar barStyle="dark-content" /><View style={styles.appShell}><View style={styles.topBar}><View><Text style={styles.appTitle}>DukaanOS</Text><Text style={styles.appSubtitle}>{title}</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>D</Text></View></View><View style={{ flex: 1 }}>{activeTab === 'home' ? <HomeScreen data={data} actions={actions} /> : activeTab === 'inventory' ? <InventoryScreen products={products} search={search} setSearch={setSearch} actions={actions} /> : activeTab === 'customers' ? <CustomersScreen customers={customers} actions={actions} /> : activeTab === 'collections' ? <CollectionsScreen customers={customers} actions={actions} /> : activeTab === 'reports' ? <ReportsScreen state={state} /> : <TransactionsScreen transactions={transactions} />}</View><View style={styles.bottomNav}>{[['home', '⌂', 'Home'], ['inventory', '▦', 'Stock'], ['customers', '♙', 'Customers'], ['collections', '₹', 'Udhaar'], ['reports', '◈', 'Reports'], ['transactions', '↕', 'History']].map(([tab, icon, label]) => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.navItem}><Text style={[styles.navIcon, activeTab === tab && styles.navIconActive]}>{icon}</Text><Text style={[styles.navLabel, activeTab === tab && styles.navLabelActive]}>{label}</Text></Pressable>)}</View></View>
  <SaleModal visible={!!modals.sale} products={products} customers={customers} onConfirm={recordSale} onAddCustomer={(name, phone) => addCustomer(name, phone, false)} onCancel={() => modal('sale', false)} /><PurchaseModal visible={!!modals.purchase} products={products} onConfirm={recordPurchase} onCancel={() => modal('purchase', false)} /><AddProductModal visible={!!modals.product} onConfirm={addProduct} onCancel={() => modal('product', false)} /><AddCustomerModal visible={!!modals.customer} onConfirm={addCustomer} onCancel={() => modal('customer', false)} /><UdhaarModal visible={!!modals.udhaar} customers={customers} onConfirm={addUdhaar} onCancel={() => modal('udhaar', false)} /><PaymentModal visible={!!modals.payment} customers={customers} onConfirm={receivePayment} onCancel={() => modal('payment', false)} /><ExpenseModal visible={!!modals.expense} onConfirm={recordExpense} onCancel={() => modal('expense', false)} /></SafeAreaView>;
}
export default function App() { return <DukaanProvider><Dashboard /></DukaanProvider>; }
