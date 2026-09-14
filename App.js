import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DukaanProvider, useDukaan } from './src/store/DukaanContext';
import { AuthProvider } from './src/store/AuthContext';
import { ShopProvider } from './src/store/ShopContext';
import { createTransaction, createExpense, createInventoryAdjustment, eventForTransaction } from './src/services/operations';
import { nextId, isoNow } from './src/utils/id';
import { totalProfit, totalStockValue, totalUdhaar } from './src/store/selectors';
import { fromPaise, toPaise } from './src/utils/money';
import { customerBalance } from './src/store/ledger';
import { styles } from './src/components/styles';
import { SaleModal, PurchaseModal, RemoveStockModal, AddStockModal, AddProductModal, AddCustomerModal, UdhaarModal, PaymentModal, ExpenseModal } from './src/components/Modals';
import HomeScreen from './src/screens/HomeScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import { money } from './src/utils/money';
import ReportsScreen from './src/screens/ReportsScreen';
import CollectionsScreen from './src/screens/CollectionsScreen';
import ArchiveScreen from './src/screens/ArchiveScreen';
import RecycleBinScreen from './src/screens/RecycleBinScreen';
import ManuscriptBackdrop from './src/components/ManuscriptBackdrop';

const RECYCLE_RETENTION_MS = 15 * 24 * 60 * 60 * 1000;

function Dashboard() {
  const { state, set, domain } = useDukaan();
  const insets = useSafeAreaInsets();
  const { products, sales, purchases, transactions, customers } = state;
  const [activeTab, setActiveTab] = useState('home'), [search, setSearch] = useState(''), [searchQuery, setSearchQuery] = useState(''), [menuOpen, setMenuOpen] = useState(false), [stockAdjustmentProduct, setStockAdjustmentProduct] = useState(null);
  const [modals, setModals] = useState({});
  const startupPurgeRequested = useRef(false);
  const [stockAdditionProduct, setStockAdditionProduct] = useState(null);
  const modal = (name, visible) => setModals((current) => ({ ...current, [name]: visible }));
  const actions = { modal, tab: setActiveTab, reversePayment, addStock: (product) => { setStockAdditionProduct(product); modal('addStock', true); }, removeStock: (product) => { setStockAdjustmentProduct(product); modal('removeStock', true); }, archiveProduct, restoreProduct, deleteProduct, purgeExpiredDeletedProducts };
  async function recordSale(items, paymentMethod, customerId, operationId) {
    if (!Array.isArray(items) || items.length === 0) return Alert.alert('Record Sale', 'Add at least one product to the sale.');
    const result = await domain((current) => {
      const customer = current.customers.find((c) => String(c.id) === String(customerId));
      if (paymentMethod === 'udhaar' && !customer) return { error: 'Select or add a customer for an udhaar sale.' };
      const merged = items.reduce((map, item) => map.set(String(item.productId), (map.get(String(item.productId)) || 0) + Number(item.quantity)), new Map());
      const saleItems = [];
      for (const [productId, quantity] of merged) {
        const product = current.products.find((p) => String(p.id) === productId && !p.archived && !p.deletedAt);
        if (!product) return { error: 'One selected product is no longer available.' };
        if (!Number.isFinite(quantity) || quantity <= 0) return { error: `Enter a valid quantity for ${product.name}.` };
        if (quantity > Number(product.stock || 0)) return { error: `Only ${product.stock} units of ${product.name} are available.` };
        const unitPrice = Number(product.sellingPrice), unitCost = Number(product.purchasePrice);
        saleItems.push({ productId: product.id, productName: product.name, quantity, unitPrice, unitCost, amount: fromPaise(toPaise(unitPrice) * quantity), profit: fromPaise((toPaise(unitPrice) - toPaise(unitCost)) * quantity) });
      }
      const amount = fromPaise(saleItems.reduce((total, item) => total + toPaise(item.amount), 0));
      const profit = fromPaise(saleItems.reduce((total, item) => total + toPaise(item.profit), 0));
      const transaction = createTransaction({ type: paymentMethod === 'udhaar' ? 'credit-sale' : 'sale', productName: saleItems.length === 1 ? saleItems[0].productName : `${saleItems.length} products`, quantity: saleItems.reduce((total, item) => total + item.quantity, 0), amount, profit, customerName: customer?.name || '', customerId: customer?.id, paymentMethod, items: saleItems, note: paymentMethod === 'udhaar' ? `Sale on udhaar to ${customer.name}` : 'Paid sale' });
      return { update: { products: current.products.map((product) => { const item = saleItems.find((line) => String(line.productId) === String(product.id)); return item ? { ...product, stock: Number(product.stock) - item.quantity } : product; }), sales: fromPaise(toPaise(current.sales) + toPaise(amount)), transactions: [transaction, ...current.transactions] }, events: [eventForTransaction(transaction)] };
    }, [], operationId);
    if (!result.saved) return Alert.alert('Record Sale', result.error?.message || 'Could not save the sale. Please retry.');
    modal('sale', false);
  }
  async function recordPurchase(productId, quantity) {
    const result = await domain((current) => {
      const product = current.products.find((p) => String(p.id) === String(productId) && !p.archived && !p.deletedAt), qty = Number(quantity);
      if (!product) return { error: 'Please select a product.' };
      if (!Number.isFinite(qty) || qty <= 0) return { error: 'Enter a valid quantity.' };
      const unitCost = Number(product.purchasePrice), amount = fromPaise(toPaise(unitCost) * qty);
      const transaction = createTransaction({ type: 'purchase', productId: product.id, productName: product.name, quantity: qty, amount, unitCost, items: [{ productId: product.id, productName: product.name, quantity: qty, unitCost, unitPrice: unitCost, amount, profit: 0 }], profit: 0 });
      return { update: { products: current.products.map((p) => p.id === product.id ? { ...p, stock: Number(p.stock) + qty } : p), purchases: fromPaise(toPaise(current.purchases) + toPaise(amount)), transactions: [transaction, ...current.transactions] }, events: [eventForTransaction(transaction)] };
    }, [], `purchase-${productId}-${Date.now()}`);
    if (!result.saved) return Alert.alert('Add Purchase', result.error?.message || 'Could not save the purchase. Please retry.');
    modal('purchase', false);
  }
  async function removeStock(productId, quantity, reason, note) {
    const result = await domain((current) => {
      const product = current.products.find((item) => String(item.id) === String(productId) && !item.archived && !item.deletedAt);
      const value = Number(quantity);
      if (!product) return { error: 'This product is no longer active.' };
      if (!Number.isInteger(value) || value <= 0) return { error: 'Enter a positive whole-number quantity.' };
      if (value > Number(product.stock || 0)) return { error: `Only ${product.stock} units are available.` };
      const adjustment = createInventoryAdjustment({ productId: product.id, productName: product.name, quantity: value, reason, note });
      return { update: { products: current.products.map((item) => String(item.id) === String(product.id) ? { ...item, stock: Number(item.stock || 0) - value } : item), transactions: [adjustment, ...current.transactions] }, events: [eventForTransaction(adjustment)] };
    }, [], `inventory-adjustment-${productId}-${Date.now()}-${Math.random()}`);
    if (!result.saved) return Alert.alert('Remove Stock', result.error?.message || 'Could not remove stock. Please retry.');
    modal('removeStock', false);
    setStockAdjustmentProduct(null);
  }
  async function addStock(productId, quantity, reason, note) {
    const result = await domain((current) => {
      const product = current.products.find((item) => String(item.id) === String(productId) && !item.archived && !item.deletedAt);
      const value = Number(quantity);
      if (!product) return { error: 'This product is no longer active.' };
      if (!Number.isInteger(value) || value <= 0) return { error: 'Enter a positive whole-number quantity.' };
      const adjustment = createInventoryAdjustment({ productId: product.id, productName: product.name, quantity: value, reason, note, direction: 'ADD' });
      return { update: { products: current.products.map((item) => String(item.id) === String(product.id) ? { ...item, stock: Number(item.stock || 0) + value } : item), transactions: [adjustment, ...current.transactions] }, events: [eventForTransaction(adjustment)] };
    }, [], `inventory-addition-${productId}-${Date.now()}-${Math.random()}`);
    if (!result.saved) return Alert.alert('Add Stock', result.error?.message || 'Could not add stock. Please retry.');
    modal('addStock', false);
    setStockAdditionProduct(null);
  }
  async function archiveProduct(id) {
    const product = products.find((item) => String(item.id) === String(id) && !item.deletedAt);
    if (!product) return;
    Alert.alert('Archive Product', `Archive ${product.name}? Its stock and history will remain preserved.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Archive', style: 'destructive', onPress: async () => {
      const result = await domain((current) => ({ update: { products: current.products.map((item) => String(item.id) === String(id) ? { ...item, archived: true, archivedAt: isoNow() } : item) } }), [], `archive-${id}-${Date.now()}`);
      if (!result.saved) Alert.alert('Archive Product', result.error?.message || 'Could not archive product.');
    } }]);
  }
  async function restoreProduct(id) {
    const result = await domain((current) => {
      const product = current.products.find((item) => String(item.id) === String(id));
      if (!product) return { error: 'Product not found.' };
      if (product.deletedAt) {
        return { update: { products: current.products.map((item) => String(item.id) === String(id) ? { ...item, deletedAt: null, archived: item.archivedBeforeDelete === true, archivedAt: item.archivedBeforeDelete === true ? (item.archivedAtBeforeDelete || null) : null, archivedBeforeDelete: false, archivedAtBeforeDelete: null } : item) } };
      }
      if (!product.archived) return { error: 'Product is already active.' };
      return { update: { products: current.products.map((item) => String(item.id) === String(id) ? { ...item, archived: false, archivedAt: null } : item) } };
    }, [], `restore-${id}-${Date.now()}`);
    if (!result.saved) Alert.alert('Restore Product', result.error?.message || 'Could not restore product.');
  }
  function deleteProduct(id) {
    const product = products.find((item) => String(item.id) === String(id) && !item.deletedAt);
    if (!product) return;
    Alert.alert(`Move ${product.name} to Recycle Bin?`, 'This product will be removed from active inventory and moved to Recycle Bin. You can restore it within 15 days. After 15 days, it will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Move to Recycle Bin', style: 'destructive', onPress: async () => {
        const result = await domain((current) => {
          const currentProduct = current.products.find((item) => String(item.id) === String(id) && !item.deletedAt);
          if (!currentProduct) return { error: 'Product is no longer available.' };
          return { update: { products: current.products.map((item) => String(item.id) === String(id) ? { ...item, deletedAt: isoNow(), archivedBeforeDelete: item.archived === true, archivedAtBeforeDelete: item.archivedAt || null, archived: false, archivedAt: null } : item) } };
        }, [], `delete-${id}-${Date.now()}`);
        if (!result.saved) Alert.alert('Move to Recycle Bin', result.error?.message || 'Could not move product to Recycle Bin.');
      } },
    ]);
  }
  async function purgeExpiredDeletedProducts() {
    const now = Date.now();
    const result = await domain((current) => ({ update: { products: current.products.filter((product) => {
      if (!product.deletedAt) return true;
      const deletedAt = new Date(product.deletedAt).getTime();
      return !Number.isFinite(deletedAt) || now < deletedAt + RECYCLE_RETENTION_MS;
    }) } }), [], `purge-deleted-${now}`);
    if (!result.saved) Alert.alert('Recycle Bin', result.error?.message || 'Could not clean up expired products.');
    return result;
  }
  async function addProduct(name, purchasePrice, sellingPrice, openingStock, barcode = '', expiryDate = '') {
    const cleanName = name.trim(), buy = Number(purchasePrice), sell = Number(sellingPrice), stock = Number(openingStock);
    if (!cleanName) return Alert.alert('Add Product', 'Enter product name.'); if (buy <= 0 || sell <= 0 || stock < 0) return Alert.alert('Add Product', 'Enter valid product values.'); if (products.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) return Alert.alert('Add Product', 'A product with this name already exists.');
    if (barcode && products.some((p) => p.barcode && String(p.barcode) === String(barcode).trim())) return Alert.alert('Add Product', 'A product with this barcode already exists.');
    const product = { id: nextId(), name: cleanName, stock, purchasePrice: buy, sellingPrice: sell, barcode: String(barcode || '').trim(), expiryDate: expiryDate || '' };
    const opening = stock > 0 ? createTransaction({ type: 'opening-inventory', productId: product.id, productName: product.name, quantity: stock, amount: fromPaise(toPaise(buy) * stock), unitCost: buy, items: [{ productId: product.id, productName: product.name, quantity: stock, unitCost: buy, unitPrice: buy, amount: fromPaise(toPaise(buy) * stock), profit: 0 }], note: 'Opening inventory' }) : null;
    const result = await domain((current) => ({ update: { products: [...current.products, product], transactions: opening ? [opening, ...current.transactions] : current.transactions }, events: opening ? [eventForTransaction(opening)] : [] }), [], `product-${product.id}`);
    if (!result.saved) return Alert.alert('Add Product', 'Could not save the product. Please retry.');
    modal('product', false);
  }
  function addCustomer(name, phone, closeModal = true) {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName) return Alert.alert('Add Customer', 'Enter customer name.');
    if (customers.some((customer) => customer.name.toLowerCase() === cleanName.toLowerCase())) {
      return Alert.alert('Add Customer', 'A customer with this name already exists.');
    }
    const customer = { id: nextId(), name: cleanName, phone: cleanPhone, balance: 0, createdAt: isoNow() };
    domain((current) => ({ update: { customers: [...current.customers, customer] } }), [], `customer-${customer.id}`);
    if (closeModal) modal('customer', false);
    return customer;
  }
  async function addUdhaar(customerId, amount) { const value = Number(amount); const result = await domain((current) => { const customer = current.customers.find((c) => String(c.id) === String(customerId)); if (!customer) return { error: 'Please select a customer.' }; if (!Number.isFinite(value) || value <= 0) return { error: 'Enter a valid amount.' }; const transaction = createTransaction({ type: 'credit', productName: customer.name, quantity: 1, amount: fromPaise(toPaise(value)), customerName: customer.name, customerId: customer.id, note: 'Udhaar added' }); return { update: { transactions: [transaction, ...current.transactions] }, events: [eventForTransaction(transaction)] }; }, [], `credit-${customerId}-${Date.now()}`); if (!result.saved) return Alert.alert('Add Udhaar', result.error?.message || 'Could not save udhaar.'); modal('udhaar', false); }
  async function receivePayment(customerId, amount) { const value = Number(amount); const result = await domain((current) => { const customer = current.customers.find((c) => String(c.id) === String(customerId)); const outstanding = customer ? customerBalance(current.transactions, customer.id) : 0; if (!customer) return { error: 'Please select a customer.' }; if (!Number.isFinite(value) || value <= 0) return { error: 'Enter a valid amount.' }; if (toPaise(value) > toPaise(outstanding)) return { error: `Outstanding balance is only ${money(outstanding)}.` }; const transaction = createTransaction({ type: 'payment', productName: customer.name, quantity: 1, amount: fromPaise(toPaise(value)), customerName: customer.name, customerId: customer.id, note: 'Payment received' }); return { update: { transactions: [transaction, ...current.transactions] }, events: [eventForTransaction(transaction)] }; }, [], `payment-${customerId}-${Date.now()}`); if (!result.saved) return Alert.alert('Receive Payment', result.error?.message || 'Could not save payment.'); modal('payment', false); }
  async function reversePayment(payment) {
    if (!payment || payment.type !== 'payment') return;
    const result = await domain((current) => {
      const currentPayment = current.transactions.find((item) => item.id === payment.id);
      if (!currentPayment || currentPayment.type !== 'payment') return { error: 'Payment is no longer available.' };
      if (current.transactions.some((item) => item.type === 'payment-reversal' && item.reversesTransactionId === currentPayment.id)) return { error: 'This payment has already been reversed.' };
      const reversal = createTransaction({ type: 'payment-reversal', productName: currentPayment.productName, customerName: currentPayment.customerName, customerId: currentPayment.customerId, amount: currentPayment.amount, quantity: 1, note: `Reversal of payment ${currentPayment.id}`, paymentMethod: currentPayment.paymentMethod });
      reversal.reversesTransactionId = currentPayment.id;
      return { update: { transactions: [reversal, ...current.transactions] }, events: [eventForTransaction(reversal)] };
    }, [], `reverse-payment-${payment.id}`);
    if (!result.saved) Alert.alert('Reverse payment', result.error?.message || 'Could not reverse the payment. Please retry.');
  }
  async function recordExpense(category, amount, note) { const value = Number(amount); if (!Number.isFinite(value) || value <= 0) return Alert.alert('Add Expense', 'Enter a valid amount.'); const expense = createExpense({ category: category.trim() || 'general', amount: fromPaise(toPaise(value)), note: note.trim() }); const result = await domain((current) => ({ update: { expenses: [expense, ...(current.expenses || [])] } }), [], `expense-${expense.id}`); if (!result.saved) return Alert.alert('Add Expense', 'Could not save the expense. Please retry.'); modal('expense', false); }
  const customerViews = useMemo(() => customers.map((customer) => ({ ...customer, balance: customerBalance(transactions, customer.id) })), [customers, transactions]);
  const activeProducts = useMemo(() => products.filter((product) => !product.archived && !product.deletedAt), [products]);
  const archivedProducts = useMemo(() => products.filter((product) => product.archived && !product.deletedAt), [products]);
  const deletedProducts = useMemo(() => products.filter((product) => product.deletedAt), [products]);
  useEffect(() => {
    if (state.hydrated && !startupPurgeRequested.current) {
      startupPurgeRequested.current = true;
      purgeExpiredDeletedProducts();
    }
  }, [state.hydrated]);
  const data = useMemo(() => ({ products: activeProducts, sales, purchases, transactions, customers: customerViews, searchQuery, setSearchQuery, totalStockValue: totalStockValue(activeProducts), totalProfit: totalProfit(transactions), totalUdhaar: totalUdhaar(customerViews, transactions) }), [activeProducts, sales, purchases, transactions, customerViews, searchQuery]);
  const title = activeTab === 'home' ? 'Dashboard' : activeTab === 'inventory' ? 'Inventory' : activeTab === 'customers' ? 'Customers' : activeTab === 'collections' ? 'Collections' : activeTab === 'reports' ? 'Reports' : activeTab === 'archive' ? 'Archive' : activeTab === 'recycleBin' ? 'Recycle Bin' : 'Transactions';
  const menuItems = [['home', 'Home'], ['inventory', 'Stock'], ['customers', 'Customers'], ['transactions', 'History'], ['archive', 'Archive'], ['recycleBin', 'Recycle Bin']];
  const selectTab = (tab) => { setActiveTab(tab); setMenuOpen(false); if (tab === 'recycleBin') purgeExpiredDeletedProducts(); };
  return <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}><StatusBar barStyle="dark-content" /><View style={styles.appShell}><View pointerEvents="none" style={styles.shellBackground} /><ManuscriptBackdrop /><View style={styles.appContentLayer}><View style={styles.topBar}><View><Text style={styles.appTitle}>DU<Text style={{ color: '#C89B3C' }}>KAN</Text><Text style={{ color: '#8B2638' }}>OS</Text></Text><Text style={styles.appSubtitle}>{title}</Text></View><Pressable onPress={() => setMenuOpen((open) => !open)} accessibilityRole="button" accessibilityLabel={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} accessibilityState={{ expanded: menuOpen }} style={styles.menuButton}><Text style={styles.menuButtonText}>☰</Text></Pressable>{menuOpen ? <View style={styles.menuPanel}>{menuItems.map(([tab, label]) => <Pressable key={tab} onPress={() => selectTab(tab)} accessibilityRole="menuitem" style={[styles.menuItem, activeTab === tab && styles.menuItemActive]}><Text style={[styles.menuItemText, activeTab === tab && styles.menuItemTextActive]}>{label}</Text></Pressable>)}</View> : null}</View><View style={styles.mainContent}>{activeTab === 'home' ? <HomeScreen data={data} actions={actions} /> : activeTab === 'inventory' ? <InventoryScreen products={activeProducts} search={search} setSearch={setSearch} actions={actions} /> : activeTab === 'customers' ? <CustomersScreen customers={customerViews} actions={actions} /> : activeTab === 'collections' ? <CollectionsScreen customers={customerViews} actions={actions} /> : activeTab === 'reports' ? <ReportsScreen state={{ ...state, customers: customerViews }} /> : activeTab === 'archive' ? <ArchiveScreen products={archivedProducts} actions={actions} /> : activeTab === 'recycleBin' ? <RecycleBinScreen products={deletedProducts} actions={actions} /> : <TransactionsScreen transactions={transactions} actions={actions} />}</View>
  <SaleModal visible={!!modals.sale} products={activeProducts} customers={customerViews} onConfirm={recordSale} onAddCustomer={(name, phone) => addCustomer(name, phone, false)} onCancel={() => modal('sale', false)} /><PurchaseModal visible={!!modals.purchase} products={activeProducts} onConfirm={recordPurchase} onCancel={() => modal('purchase', false)} /><RemoveStockModal visible={!!modals.removeStock} product={stockAdjustmentProduct} onConfirm={removeStock} onCancel={() => { modal('removeStock', false); setStockAdjustmentProduct(null); }} /><AddStockModal visible={!!modals.addStock} product={stockAdditionProduct} onConfirm={addStock} onCancel={() => { modal('addStock', false); setStockAdditionProduct(null); }} /><AddProductModal visible={!!modals.product} onConfirm={addProduct} onCancel={() => modal('product', false)} /><AddCustomerModal visible={!!modals.customer} onConfirm={addCustomer} onCancel={() => modal('customer', false)} /><UdhaarModal visible={!!modals.udhaar} customers={customerViews} onConfirm={addUdhaar} onCancel={() => modal('udhaar', false)} /><PaymentModal visible={!!modals.payment} customers={customerViews} onConfirm={receivePayment} onCancel={() => modal('payment', false)} /><ExpenseModal visible={!!modals.expense} onConfirm={recordExpense} onCancel={() => modal('expense', false)} /></View></View></View>;
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ShopProvider>
          <DukaanProvider>
            <Dashboard />
          </DukaanProvider>
        </ShopProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
