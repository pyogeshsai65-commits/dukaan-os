import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultProducts = [
  { id: 1, name: 'Parle-G', stock: 24, purchasePrice: 8, sellingPrice: 10 },
  { id: 2, name: 'Tata Salt', stock: 12, purchasePrice: 22, sellingPrice: 28 },
  { id: 3, name: 'Maggi', stock: 8, purchasePrice: 10, sellingPrice: 14 },
  { id: 4, name: 'Amul Milk', stock: 6, purchasePrice: 26, sellingPrice: 30 },
];

const STORAGE_KEYS = {
  products: 'dukaan-products',
  sales: 'dukaan-sales',
  purchases: 'dukaan-purchases',
  transactions: 'dukaan-transactions',
  customers: 'dukaan-customers',
};

function normalizeProducts(saved) {
  if (!Array.isArray(saved)) return defaultProducts;
  return saved.map((product) => ({
    id: product.id ?? Date.now() + Math.random(),
    name: product.name ?? 'Unnamed Product',
    stock: Number(product.stock) || 0,
    purchasePrice: Number(product.purchasePrice ?? product.price ?? 0),
    sellingPrice: Number(product.sellingPrice ?? product.price ?? 0),
  }));
}

function normalizeTransactions(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.filter((item) => item && item.type && item.productName);
}

function normalizeCustomers(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.map((customer) => ({
    id: customer.id ?? Date.now() + Math.random(),
    name: customer.name ?? 'Unnamed Customer',
    phone: customer.phone ?? '',
    balance: Number(customer.balance) || 0,
  }));
}

function money(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Button({ title, onPress, variant = 'primary', disabled = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        variant === 'danger' && styles.dangerButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
          variant === 'danger' && styles.dangerButtonText,
          disabled && styles.disabledButtonText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        <Text style={styles.statLabel}>{title}</Text>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title, subtitle, actionTitle, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionTitle ? <Button title={actionTitle} onPress={onAction} style={styles.smallButton} /> : null}
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        style={styles.input}
        autoCapitalize={keyboardType === 'default' ? 'sentences' : 'none'}
      />
    </View>
  );
}

function PickerRow({ label, value, options, onChange, disabled = false }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => (
          <Pressable
            key={String(option.value)}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.selectChip, value === option.value && styles.selectChipActive, disabled && styles.disabledChip]}
          >
            <Text style={[styles.selectChipText, value === option.value && styles.selectChipTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ModalShell({ visible, title, children, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function App() {
  const [products, setProducts] = useState(defaultProducts);
  const [sales, setSales] = useState(0);
  const [purchases, setPurchases] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [search, setSearch] = useState('');

  const [showSale, setShowSale] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddUdhaar, setShowAddUdhaar] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const entries = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.products),
          AsyncStorage.getItem(STORAGE_KEYS.sales),
          AsyncStorage.getItem(STORAGE_KEYS.purchases),
          AsyncStorage.getItem(STORAGE_KEYS.transactions),
          AsyncStorage.getItem(STORAGE_KEYS.customers),
        ]);
        const [p, s, pu, t, c] = entries;
        if (p) setProducts(normalizeProducts(JSON.parse(p)));
        if (s) setSales(Number(JSON.parse(s)) || 0);
        if (pu) setPurchases(Number(JSON.parse(pu)) || 0);
        if (t) setTransactions(normalizeTransactions(JSON.parse(t)));
        if (c) setCustomers(normalizeCustomers(JSON.parse(c)));
      } catch (error) {
        console.warn('Could not load saved DukaanOS data', error);
      }
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales)); }, [sales]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.purchases, JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers)); }, [customers]);

  const totalStockValue = useMemo(
    () => products.reduce((total, product) => total + Number(product.stock || 0) * Number(product.purchasePrice || 0), 0),
    [products]
  );

  const totalProfit = useMemo(
    () => transactions.reduce((total, transaction) => {
      if (transaction.type === 'sale' || transaction.type === 'credit-sale') return total + Number(transaction.profit || 0);
      return total;
    }, 0),
    [transactions]
  );

  const totalUdhaar = useMemo(
    () => customers.reduce((total, customer) => total + Number(customer.balance || 0), 0),
    [customers]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => product.name.toLowerCase().includes(query));
  }, [products, search]);

  const lowStock = products.filter((product) => product.stock <= 5);
  const recentTransactions = transactions.slice(0, 8);

  function recordSale(productId, quantity, paymentMethod, customerId) {
    const product = products.find((p) => p.id === Number(productId));
    const qty = Number(quantity);
    const customer = customers.find((c) => c.id === Number(customerId));

    if (!product) return Alert.alert('Record Sale', 'Please select a product.');
    if (!qty || qty <= 0) return Alert.alert('Record Sale', 'Enter a valid quantity.');
    if (product.stock < qty) return Alert.alert('Record Sale', `Only ${product.stock} units of ${product.name} are available.`);
    if (paymentMethod === 'udhaar' && !customer) return Alert.alert('Record Sale', 'Please select a customer for an udhaar sale.');

    const sellingPrice = Number(product.sellingPrice);
    const purchasePrice = Number(product.purchasePrice);
    const saleAmount = sellingPrice * qty;
    const profit = (sellingPrice - purchasePrice) * qty;

    setProducts((current) => current.map((p) => p.id === product.id ? { ...p, stock: p.stock - qty } : p));
    setSales((value) => value + saleAmount);

    if (paymentMethod === 'udhaar') {
      setCustomers((current) => current.map((c) => c.id === customer.id ? { ...c, balance: Number(c.balance || 0) + saleAmount } : c));
    }

    setTransactions((current) => [{
      id: Date.now(),
      type: paymentMethod === 'udhaar' ? 'credit-sale' : 'sale',
      productName: product.name,
      quantity: qty,
      amount: saleAmount,
      profit,
      timestamp: Date.now(),
      customerName: customer?.name || '',
      note: paymentMethod === 'udhaar' ? `Sale on udhaar to ${customer.name}` : 'Paid sale',
    }, ...current]);

    setShowSale(false);
  }

  function recordPurchase(productId, quantity) {
    const product = products.find((p) => p.id === Number(productId));
    const qty = Number(quantity);
    if (!product) return Alert.alert('Add Purchase', 'Please select a product.');
    if (!qty || qty <= 0) return Alert.alert('Add Purchase', 'Enter a valid quantity.');

    const purchaseAmount = Number(product.purchasePrice) * qty;
    setProducts((current) => current.map((p) => p.id === product.id ? { ...p, stock: p.stock + qty } : p));
    setPurchases((value) => value + purchaseAmount);
    setTransactions((current) => [{
      id: Date.now(), type: 'purchase', productName: product.name, quantity: qty,
      amount: purchaseAmount, profit: 0, timestamp: Date.now(),
    }, ...current]);
    setShowPurchase(false);
  }

  function addProduct(name, purchasePrice, sellingPrice, openingStock) {
    const cleanName = name.trim();
    const buyPrice = Number(purchasePrice);
    const sellPrice = Number(sellingPrice);
    const stock = Number(openingStock);
    if (!cleanName) return Alert.alert('Add Product', 'Enter product name.');
    if (buyPrice <= 0 || sellPrice <= 0 || stock < 0) return Alert.alert('Add Product', 'Enter valid product values.');
    if (products.some((product) => product.name.toLowerCase() === cleanName.toLowerCase())) {
      return Alert.alert('Add Product', 'A product with this name already exists.');
    }

    setProducts((current) => [...current, {
      id: Date.now(), name: cleanName, stock, purchasePrice: buyPrice, sellingPrice: sellPrice,
    }]);
    setShowAddProduct(false);
  }

  function deleteProduct(productId) {
    const product = products.find((p) => p.id === productId);
    Alert.alert('Delete Product', `Delete ${product?.name || 'this product'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setProducts((current) => current.filter((p) => p.id !== productId)) },
    ]);
  }

  function addCustomer(name, phone) {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName) return Alert.alert('Add Customer', 'Enter customer name.');
    setCustomers((current) => [...current, { id: Date.now(), name: cleanName, phone: cleanPhone, balance: 0 }]);
    setShowAddCustomer(false);
  }

  function addUdhaar(customerId, amount) {
    const customer = customers.find((c) => c.id === Number(customerId));
    const value = Number(amount);
    if (!customer) return Alert.alert('Add Udhaar', 'Please select a customer.');
    if (!value || value <= 0) return Alert.alert('Add Udhaar', 'Enter a valid amount.');

    setCustomers((current) => current.map((c) => c.id === customer.id ? { ...c, balance: Number(c.balance || 0) + value } : c));
    setTransactions((current) => [{
      id: Date.now(), type: 'credit', productName: customer.name, quantity: 1, amount: value, profit: 0,
      timestamp: Date.now(), customerName: customer.name, note: 'Udhaar added',
    }, ...current]);
    setShowAddUdhaar(false);
  }

  function receivePayment(customerId, amount) {
    const customer = customers.find((c) => c.id === Number(customerId));
    const value = Number(amount);
    if (!customer) return Alert.alert('Receive Payment', 'Please select a customer.');
    if (!value || value <= 0) return Alert.alert('Receive Payment', 'Enter a valid amount.');
    if (value > Number(customer.balance || 0)) return Alert.alert('Receive Payment', `Outstanding balance is only ${money(customer.balance)}.`);

    setCustomers((current) => current.map((c) => c.id === customer.id ? { ...c, balance: Number(c.balance || 0) - value } : c));
    setTransactions((current) => [{
      id: Date.now(), type: 'payment', productName: customer.name, quantity: 1, amount: value, profit: 0,
      timestamp: Date.now(), customerName: customer.name, note: 'Payment received',
    }, ...current]);
    setShowPayment(false);
  }

  function transactionTitle(transaction) {
    if (transaction.type === 'sale') return `Sold ${transaction.quantity} × ${transaction.productName}`;
    if (transaction.type === 'credit-sale') return `Udhaar Sale · ${transaction.quantity} × ${transaction.productName}`;
    if (transaction.type === 'purchase') return `Purchased ${transaction.quantity} × ${transaction.productName}`;
    if (transaction.type === 'credit') return `Udhaar Added · ${transaction.productName}`;
    if (transaction.type === 'payment') return `Payment from ${transaction.productName}`;
    return transaction.productName;
  }

  function transactionAmountStyle(type) {
    return type === 'purchase' ? styles.negativeAmount : styles.positiveAmount;
  }

  function renderHome() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DUKAANOS</Text>
            <Text style={styles.heroTitle}>Dukaan ka control, pocket mein.</Text>
            <Text style={styles.heroSubtitle}>Sales, stock aur udhaar ek hi jagah.</Text>
          </View>
          <Text style={styles.heroEmoji}>🧾</Text>
        </View>

        <View style={styles.statGrid}>
          <StatCard title="Sales Today" value={money(sales)} icon="💰" />
          <StatCard title="Purchases" value={money(purchases)} icon="📦" />
          <StatCard title="Stock Value" value={money(totalStockValue)} icon="🏪" />
          <StatCard title="Profit" value={money(totalProfit)} icon="📈" />
          <StatCard title="Total Udhaar" value={money(totalUdhaar)} icon="🤝" />
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader title="Quick Actions" subtitle="Common shop tasks" />
          <View style={styles.actionGrid}>
            <Button title="＋ Record Sale" onPress={() => setShowSale(true)} />
            <Button title="＋ Add Purchase" onPress={() => setShowPurchase(true)} />
            <Button title="＋ Add Product" onPress={() => setShowAddProduct(true)} variant="secondary" />
            <Button title="＋ Add Customer" onPress={() => setShowAddCustomer(true)} variant="secondary" />
            <Button title="＋ Add Udhaar" onPress={() => setShowAddUdhaar(true)} variant="secondary" disabled={customers.length === 0} />
            <Button title="＋ Receive Payment" onPress={() => setShowPayment(true)} variant="secondary" disabled={customers.length === 0} />
          </View>
        </View>

        {lowStock.length > 0 ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠ Low Stock</Text>
            <Text style={styles.warningText}>{lowStock.map((product) => `${product.name} (${product.stock})`).join('  •  ')}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <SectionHeader title="Recent Transactions" subtitle={`${recentTransactions.length} latest entries`} actionTitle="See all" onAction={() => setActiveTab('transactions')} />
          {recentTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  function renderInventory() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <SectionHeader title="Inventory" subtitle={`${products.length} products`} actionTitle="＋ Add" onAction={() => setShowAddProduct(true)} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search products..." placeholderTextColor="#94a3b8" style={styles.searchInput} />
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productAvatar}><Text style={styles.productAvatarText}>{product.name.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productMeta}>Buy {money(product.purchasePrice)}  ·  Sell {money(product.sellingPrice)}</Text>
              </View>
              <View style={styles.stockBox}>
                <Text style={[styles.stockValue, product.stock <= 5 && styles.lowStockText]}>{product.stock}</Text>
                <Text style={styles.stockLabel}>stock</Text>
              </View>
              <Pressable onPress={() => deleteProduct(product.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          ))}
          {filteredProducts.length === 0 ? <Text style={styles.emptyText}>No products found.</Text> : null}
        </View>
      </ScrollView>
    );
  }

  function renderCustomers() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <SectionHeader title="Customer Ledger" subtitle="Outstanding udhaar" actionTitle="＋ Add" onAction={() => setShowAddCustomer(true)} />
          {customers.length === 0 ? (
            <View style={styles.emptyBox}><Text style={styles.emptyText}>No customers yet.</Text><Text style={styles.emptySubtext}>Add a customer to start tracking udhaar.</Text></View>
          ) : (
            customers.map((customer) => (
              <View key={customer.id} style={styles.customerCard}>
                <View style={styles.customerAvatar}><Text style={styles.customerAvatarText}>{customer.name.charAt(0).toUpperCase()}</Text></View>
                <View style={styles.customerInfo}>
                  <Text style={styles.productName}>{customer.name}</Text>
                  <Text style={styles.productMeta}>{customer.phone || 'No phone number'}</Text>
                </View>
                <View style={styles.customerBalance}>
                  <Text style={[styles.customerAmount, customer.balance > 0 ? styles.dueText : styles.clearText]}>{money(customer.balance)}</Text>
                  <Text style={styles.customerStatus}>{customer.balance > 0 ? 'Due' : 'Clear'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ledger Actions</Text>
          <Button title="＋ Add Udhaar" onPress={() => setShowAddUdhaar(true)} disabled={customers.length === 0} />
          <Button title="＋ Receive Payment" onPress={() => setShowPayment(true)} variant="secondary" disabled={customers.length === 0} />
        </View>
      </ScrollView>
    );
  }

  function renderTransactions() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <SectionHeader title="Transactions" subtitle={`${transactions.length} total entries`} />
          {transactions.length === 0 ? <Text style={styles.emptyText}>No transactions yet.</Text> : transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} detailed />)}
        </View>
      </ScrollView>
    );
  }

  function TransactionRow({ transaction, detailed }) {
    return (
      <View style={styles.transactionRow}>
        <View style={[styles.transactionIcon, transaction.type === 'purchase' ? styles.purchaseIcon : transaction.type === 'payment' ? styles.paymentIcon : styles.saleIcon]}>
          <Text style={styles.transactionIconText}>{transaction.type === 'purchase' ? '↓' : transaction.type === 'payment' ? '✓' : transaction.type === 'credit' || transaction.type === 'credit-sale' ? '🤝' : '↑'}</Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{transactionTitle(transaction)}</Text>
          <Text style={styles.transactionMeta}>{formatTime(transaction.timestamp)}{transaction.note ? `  ·  ${transaction.note}` : ''}</Text>
          {transaction.profit > 0 ? <Text style={styles.profitText}>Profit {money(transaction.profit)}</Text> : null}
        </View>
        <Text style={[styles.transactionAmount, transactionAmountStyle(transaction.type)]}>
          {transaction.type === 'purchase' ? '-' : '+'}{money(transaction.amount)}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appShell}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>DukaanOS</Text>
            <Text style={styles.appSubtitle}>{activeTab === 'home' ? 'Dashboard' : activeTab === 'inventory' ? 'Inventory' : activeTab === 'customers' ? 'Customers' : 'Transactions'}</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>D</Text></View>
        </View>

        <View style={{ flex: 1 }}>
          {activeTab === 'home' ? renderHome() : null}
          {activeTab === 'inventory' ? renderInventory() : null}
          {activeTab === 'customers' ? renderCustomers() : null}
          {activeTab === 'transactions' ? renderTransactions() : null}
        </View>

        <View style={styles.bottomNav}>
          {[
            ['home', '⌂', 'Home'],
            ['inventory', '▦', 'Stock'],
            ['customers', '♙', 'Customers'],
            ['transactions', '↕', 'History'],
          ].map(([tab, icon, label]) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.navItem}>
              <Text style={[styles.navIcon, activeTab === tab && styles.navIconActive]}>{icon}</Text>
              <Text style={[styles.navLabel, activeTab === tab && styles.navLabelActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SaleModal visible={showSale} products={products} customers={customers} onConfirm={recordSale} onCancel={() => setShowSale(false)} />
      <PurchaseModal visible={showPurchase} products={products} onConfirm={recordPurchase} onCancel={() => setShowPurchase(false)} />
      <AddProductModal visible={showAddProduct} onConfirm={addProduct} onCancel={() => setShowAddProduct(false)} />
      <AddCustomerModal visible={showAddCustomer} onConfirm={addCustomer} onCancel={() => setShowAddCustomer(false)} />
      <UdhaarModal visible={showAddUdhaar} customers={customers} onConfirm={addUdhaar} onCancel={() => setShowAddUdhaar(false)} />
      <PaymentModal visible={showPayment} customers={customers} onConfirm={receivePayment} onCancel={() => setShowPayment(false)} />
    </SafeAreaView>
  );
}

function SaleModal({ visible, products, customers, onConfirm, onCancel }) {
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('paid');
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');

  useEffect(() => {
    if (visible) {
      setProductId(products[0]?.id ?? '');
      setQuantity('1');
      setPaymentMethod('paid');
      setCustomerId(customers[0]?.id ?? '');
    }
  }, [visible, products.length, customers.length]);

  const product = products.find((item) => item.id === Number(productId));
  const qty = Number(quantity) || 0;
  const total = product ? product.sellingPrice * qty : 0;

  return (
    <ModalShell visible={visible} title="Record Sale" onClose={onCancel}>
      <Text style={styles.modalDescription}>Reduce stock and record the sale.</Text>
      <Text style={styles.fieldLabel}>Product</Text>
      <View style={styles.optionList}>
        {products.map((item) => (
          <Pressable key={item.id} onPress={() => setProductId(item.id)} style={[styles.optionRow, productId === item.id && styles.optionRowActive]}>
            <View style={{ flex: 1 }}><Text style={styles.optionTitle}>{item.name}</Text><Text style={styles.optionMeta}>Stock {item.stock} · Sell {money(item.sellingPrice)}</Text></View>
            {productId === item.id ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        ))}
      </View>
      <FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="1" />
      <PickerRow label="Payment" value={paymentMethod} onChange={setPaymentMethod} options={[{ value: 'paid', label: 'Paid' }, { value: 'udhaar', label: 'Udhaar' }]} />
      {paymentMethod === 'udhaar' ? (
        <>
          <Text style={styles.fieldLabel}>Customer</Text>
          <View style={styles.optionList}>
            {customers.map((item) => (
              <Pressable key={item.id} onPress={() => setCustomerId(item.id)} style={[styles.optionRow, customerId === item.id && styles.optionRowActive]}>
                <View style={{ flex: 1 }}><Text style={styles.optionTitle}>{item.name}</Text><Text style={styles.optionMeta}>Current due {money(item.balance)}</Text></View>
                {customerId === item.id ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.amountPreview}><Text style={styles.amountPreviewLabel}>Sale amount</Text><Text style={styles.amountPreviewValue}>{money(total)}</Text></View>
      <View style={styles.modalActions}><Button title="Cancel" onPress={onCancel} variant="danger" style={{ flex: 1 }} /><Button title="Record Sale" onPress={() => onConfirm(productId, quantity, paymentMethod, customerId)} style={{ flex: 1 }} /></View>
    </ModalShell>
  );
}

function PurchaseModal({ visible, products, onConfirm, onCancel }) {
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  useEffect(() => { if (visible) { setProductId(products[0]?.id ?? ''); setQuantity('1'); } }, [visible, products.length]);
  const product = products.find((item) => item.id === Number(productId));
  const total = product ? product.purchasePrice * (Number(quantity) || 0) : 0;
  return (
    <ModalShell visible={visible} title="Add Purchase" onClose={onCancel}>
      <Text style={styles.modalDescription}>Increase stock using the purchase price.</Text>
      <Text style={styles.fieldLabel}>Product</Text>
      <View style={styles.optionList}>
        {products.map((item) => <Pressable key={item.id} onPress={() => setProductId(item.id)} style={[styles.optionRow, productId === item.id && styles.optionRowActive]}><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{item.name}</Text><Text style={styles.optionMeta}>Buy {money(item.purchasePrice)} · Stock {item.stock}</Text></View>{productId === item.id ? <Text style={styles.check}>✓</Text> : null}</Pressable>)}
      </View>
      <FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="1" />
      <View style={styles.amountPreview}><Text style={styles.amountPreviewLabel}>Purchase amount</Text><Text style={styles.amountPreviewValue}>{money(total)}</Text></View>
      <View style={styles.modalActions}><Button title="Cancel" onPress={onCancel} variant="danger" style={{ flex: 1 }} /><Button title="Add Purchase" onPress={() => onConfirm(productId, quantity)} style={{ flex: 1 }} /></View>
    </ModalShell>
  );
}

function AddProductModal({ visible, onConfirm, onCancel }) {
  const [name, setName] = useState(''); const [purchasePrice, setPurchasePrice] = useState(''); const [sellingPrice, setSellingPrice] = useState(''); const [stock, setStock] = useState('');
  useEffect(() => { if (visible) { setName(''); setPurchasePrice(''); setSellingPrice(''); setStock(''); } }, [visible]);
  return (
    <ModalShell visible={visible} title="Add Product" onClose={onCancel}>
      <Text style={styles.modalDescription}>Create a product with its opening stock.</Text>
      <FormField label="Product Name" value={name} onChangeText={setName} placeholder="e.g. Britannia Biscuit" />
      <FormField label="Purchase Price" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="0" />
      <FormField label="Selling Price" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="decimal-pad" placeholder="0" />
      <FormField label="Opening Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" />
      <View style={styles.modalActions}><Button title="Cancel" onPress={onCancel} variant="danger" style={{ flex: 1 }} /><Button title="Add Product" onPress={() => onConfirm(name, purchasePrice, sellingPrice, stock)} style={{ flex: 1 }} /></View>
    </ModalShell>
  );
}

function AddCustomerModal({ visible, onConfirm, onCancel }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  useEffect(() => { if (visible) { setName(''); setPhone(''); } }, [visible]);
  return (
    <ModalShell visible={visible} title="Add Customer" onClose={onCancel}>
      <Text style={styles.modalDescription}>Save a customer for udhaar tracking.</Text>
      <FormField label="Customer Name" value={name} onChangeText={setName} placeholder="e.g. Ramesh" />
      <FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optional" />
      <View style={styles.modalActions}><Button title="Cancel" onPress={onCancel} variant="danger" style={{ flex: 1 }} /><Button title="Add Customer" onPress={() => onConfirm(name, phone)} style={{ flex: 1 }} /></View>
    </ModalShell>
  );
}

function UdhaarModal({ visible, customers, onConfirm, onCancel }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? ''); const [amount, setAmount] = useState('');
  useEffect(() => { if (visible) { setCustomerId(customers[0]?.id ?? ''); setAmount(''); } }, [visible, customers.length]);
  return (
    <ModalShell visible={visible} title="Add Udhaar" onClose={onCancel}>
      <Text style={styles.modalDescription}>Add an outstanding amount without creating a product sale.</Text>
      <Text style={styles.fieldLabel}>Customer</Text>
      <View style={styles.optionList}>{customers.map((item) => <Pressable key={item.id} onPress={() => setCustomerId(item.id)} style={[styles.optionRow, customerId === item.id && styles.optionRowActive]}><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{item.name}</Text><Text style={styles.optionMeta}>Current due {money(item.balance)}</Text></View>{customerId === item.id ? <Text style={styles.check}>✓</Text> : null}</Pressable>)}</View>
      <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="850" />
      <View style={styles.modalActions}><Button title="Cancel" onPress={onCancel} variant="danger" style={{ flex: 1 }} /><Button title="Add Udhaar" onPress={() => onConfirm(customerId, amount)} style={{ flex: 1 }} /></View>
    </ModalShell>
  );
}

function PaymentModal({ visible, customers, onConfirm, onCancel }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? ''); const [amount, setAmount] = useState('');
  useEffect(() => { if (visible) { setCustomerId(customers[0]?.id ?? ''); setAmount(''); } }, [visible, customers.length]);
  const customer = customers.find((item) => item.id === Number(customerId));
  return (
    <ModalShell visible={visible} title="Receive Payment" onClose={onCancel}>
      <Text style={styles.modalDescription}>Reduce a customer's outstanding balance.</Text>
      <Text style={styles.fieldLabel}>Customer</Text>
      <View style={styles.optionList}>{customers.map((item) => <Pressable key={item.id} onPress={() => setCustomerId(item.id)} style={[styles.optionRow, customerId === item.id && styles.optionRowActive]}><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{item.name}</Text><Text style={styles.optionMeta}>Outstanding {money(item.balance)}</Text></View>{customerId === item.id ? <Text style={styles.check}>✓</Text> : null}</Pressable>)}</View>
      <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="300" />
      <View style={styles.amountPreview}><Text style={styles.amountPreviewLabel}>Remaining after payment</Text><Text style={styles.amountPreviewValue}>{money(Math.max(0, Number(customer?.balance || 0) - Number(amount || 0)))}</Text></View>
      <View style={styles.modalActions}><Button title="Cancel" onPress={onCancel} variant="danger" style={{ flex: 1 }} /><Button title="Receive Payment" onPress={() => onConfirm(customerId, amount)} style={{ flex: 1 }} /></View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  appShell: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  appTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  appSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  heroCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center' },
  eyebrow: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 30, marginTop: 6 },
  heroSubtitle: { color: '#cbd5e1', fontSize: 13, marginTop: 5, lineHeight: 19 },
  heroEmoji: { fontSize: 42, marginLeft: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', width: '48.5%' },
  statTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  statIcon: { fontSize: 17 },
  statValue: { color: '#0f172a', fontSize: 21, fontWeight: '800', marginTop: 10 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: '#64748b', fontSize: 12, marginTop: 3 },
  actionGrid: { gap: 9 },
  button: { minHeight: 46, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginTop: 8 },
  primaryButton: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  secondaryButton: { backgroundColor: '#fff', borderColor: '#cbd5e1' },
  dangerButton: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  disabledButton: { opacity: 0.45 },
  pressedButton: { transform: [{ scale: 0.985 }] },
  buttonText: { fontWeight: '800', fontSize: 13 },
  primaryButtonText: { color: '#fff' },
  secondaryButtonText: { color: '#0f172a' },
  dangerButtonText: { color: '#be123c' },
  disabledButtonText: { color: '#64748b' },
  smallButton: { minHeight: 38, marginTop: 0, paddingHorizontal: 11 },
  warningCard: { backgroundColor: '#fff7ed', borderRadius: 16, borderWidth: 1, borderColor: '#fed7aa', padding: 14 },
  warningTitle: { color: '#9a3412', fontWeight: '800', fontSize: 13 },
  warningText: { color: '#7c2d12', marginTop: 5, fontSize: 12, lineHeight: 18 },
  emptyText: { color: '#64748b', textAlign: 'center', paddingVertical: 18 },
  emptySubtext: { color: '#94a3b8', textAlign: 'center', marginTop: -12, paddingBottom: 18, fontSize: 12 },
  emptyBox: { alignItems: 'center' },
  searchInput: { height: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 10 },
  productCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  productAvatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  productAvatarText: { color: '#334155', fontWeight: '900', fontSize: 17 },
  productInfo: { flex: 1, marginLeft: 10 },
  productName: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  productMeta: { color: '#64748b', fontSize: 11, marginTop: 4 },
  stockBox: { alignItems: 'flex-end', marginLeft: 8 },
  stockValue: { color: '#15803d', fontSize: 18, fontWeight: '900' },
  lowStockText: { color: '#be123c' },
  stockLabel: { color: '#94a3b8', fontSize: 10 },
  deleteButton: { paddingHorizontal: 8, paddingVertical: 7, marginLeft: 6 },
  deleteText: { color: '#be123c', fontSize: 10, fontWeight: '800' },
  customerCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  customerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  customerInfo: { flex: 1, marginLeft: 10 },
  customerBalance: { alignItems: 'flex-end' },
  customerAmount: { fontSize: 15, fontWeight: '900' },
  dueText: { color: '#be123c' },
  clearText: { color: '#15803d' },
  customerStatus: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  transactionIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  saleIcon: { backgroundColor: '#dcfce7' },
  purchaseIcon: { backgroundColor: '#fee2e2' },
  paymentIcon: { backgroundColor: '#dbeafe' },
  transactionIconText: { fontSize: 15, fontWeight: '900' },
  transactionInfo: { flex: 1, marginLeft: 10, marginRight: 8 },
  transactionTitle: { color: '#0f172a', fontSize: 12, fontWeight: '800' },
  transactionMeta: { color: '#94a3b8', fontSize: 9, marginTop: 4 },
  transactionAmount: { fontSize: 13, fontWeight: '900' },
  positiveAmount: { color: '#15803d' },
  negativeAmount: { color: '#be123c' },
  profitText: { color: '#15803d', fontSize: 9, fontWeight: '700', marginTop: 3 },
  bottomNav: { height: 72, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 8 : 2 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { color: '#94a3b8', fontSize: 20, lineHeight: 22 },
  navIconActive: { color: '#0f172a' },
  navLabel: { color: '#94a3b8', fontSize: 9, fontWeight: '700', marginTop: 3 },
  navLabelActive: { color: '#0f172a' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalKeyboard: { width: '100%' },
  modalCard: { backgroundColor: '#fff', maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { color: '#0f172a', fontSize: 21, fontWeight: '900' },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 23, color: '#475569', lineHeight: 26 },
  modalDescription: { color: '#64748b', fontSize: 12, marginBottom: 15 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { color: '#334155', fontSize: 11, fontWeight: '800', marginBottom: 7 },
  input: { height: 48, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, color: '#0f172a', backgroundColor: '#f8fafc' },
  chipWrap: { flexDirection: 'row', gap: 8 },
  selectChip: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' },
  selectChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  selectChipText: { color: '#475569', fontSize: 12, fontWeight: '800' },
  selectChipTextActive: { color: '#fff' },
  disabledChip: { opacity: 0.45 },
  optionList: { gap: 8, marginBottom: 10 },
  optionRow: { minHeight: 56, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 11, flexDirection: 'row', alignItems: 'center' },
  optionRowActive: { borderColor: '#0f172a', backgroundColor: '#f8fafc' },
  optionTitle: { color: '#0f172a', fontSize: 13, fontWeight: '800' },
  optionMeta: { color: '#64748b', fontSize: 10, marginTop: 3 },
  check: { color: '#0f172a', fontWeight: '900', fontSize: 18 },
  amountPreview: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  amountPreviewLabel: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  amountPreviewValue: { color: '#0f172a', fontSize: 19, fontWeight: '900' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 4 },
});
