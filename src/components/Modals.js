import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, FormField, ModalShell, PickerRow } from './Controls';
import { styles } from './styles';
import { money } from '../utils/money';

function Options({ items, selected, onSelect, detail }) {
  return <View style={styles.optionList}>{items.map((item) => <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.optionRow, selected === item.id && styles.optionRowActive]}><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{item.name}</Text><Text style={styles.optionMeta}>{detail(item)}</Text></View>{selected === item.id ? <Text style={styles.check}>✓</Text> : null}</Pressable>)}</View>;
}
function Actions({ cancel, confirm, title }) { return <View style={styles.modalActions}><Button title="Cancel" onPress={cancel} variant="danger" style={{ flex: 1 }} /><Button title={title} onPress={confirm} style={{ flex: 1 }} /></View>; }

export function SaleModal({ visible, products, customers, onConfirm, onAddCustomer, onCancel }) {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('paid');
  const [customerId, setCustomerId] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setCart([]);
      setPaymentMethod('paid');
      setCustomerId('');
      setAddingCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setError('');
    }
  }, [visible]);

  useEffect(() => {
    if (customerId && !customers.some((customer) => String(customer.id) === String(customerId))) setCustomerId('');
  }, [customers, customerId]);

  const cartTotal = cart.reduce((total, item) => total + item.price * Number(item.quantity || 0), 0);
  const selectedCustomer = customers.find((customer) => String(customer.id) === String(customerId));

  function addProduct(product) {
    setError('');
    if (Number(product.stock) <= 0) {
      setError(`${product.name} is out of stock.`);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { productId: product.id, name: product.name, stock: product.stock, price: Number(product.sellingPrice), quantity: 1 }];
    });
  }

  function updateQuantity(productId, value) {
    const product = products.find((item) => item.id === productId);
    const quantity = Number(value);
    setError('');
    if (!product) return;
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setCart((current) => current.map((item) => item.productId === productId ? { ...item, quantity: value } : item));
      return;
    }
    if (quantity > product.stock) {
      setError(`Only ${product.stock} units of ${product.name} are available.`);
      setCart((current) => current.map((item) => item.productId === productId ? { ...item, quantity: product.stock } : item));
      return;
    }
    setCart((current) => current.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  function removeProduct(productId) {
    setCart((current) => current.filter((item) => item.productId !== productId));
    setError('');
  }

  function saveInlineCustomer() {
    const cleanName = newCustomerName.trim();
    if (!cleanName) {
      setError('Enter a customer name to continue with udhaar.');
      return;
    }
    if (customers.some((customer) => customer.name.toLowerCase() === cleanName.toLowerCase())) {
      setError('A customer with this name already exists. Select the existing customer instead.');
      return;
    }
    const customer = onAddCustomer(newCustomerName, newCustomerPhone);
    if (customer) {
      setCustomerId(customer.id);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setAddingCustomer(false);
      setError('');
    }
  }

  function submit() {
    if (cart.length === 0) {
      setError('Add at least one product to the sale.');
      return;
    }
    const invalid = cart.find((item) => !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0);
    if (invalid) {
      setError(`Enter a valid quantity for ${invalid.name}.`);
      return;
    }
    if (paymentMethod === 'udhaar' && !selectedCustomer) {
      setError('Select a customer or add a new customer for udhaar.');
      return;
    }
    onConfirm(cart, paymentMethod, customerId);
  }

  return <ModalShell visible={visible} title="Record Sale" onClose={onCancel}>
    <Text style={styles.modalDescription}>Build one sale with multiple products.</Text>
    <Text style={styles.fieldLabel}>SALE CART</Text>
    {cart.length === 0 ? <Text style={styles.emptyText}>No products selected yet. Add products below.</Text> : cart.map((item) => (
      <View key={item.productId} style={styles.optionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{item.name}</Text>
          <Text style={styles.optionMeta}>Available {item.stock} · {money(item.price)} each</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Pressable onPress={() => updateQuantity(item.productId, Math.max(1, Number(item.quantity || 1) - 1))} style={styles.selectChip}><Text style={styles.selectChipText}>−</Text></Pressable>
            <TextInput value={String(item.quantity)} onChangeText={(value) => updateQuantity(item.productId, value)} keyboardType="number-pad" style={[styles.input, { width: 58, height: 38, textAlign: 'center', marginHorizontal: 6 }]} />
            <Pressable onPress={() => updateQuantity(item.productId, Math.min(item.stock, Number(item.quantity || 0) + 1))} style={styles.selectChip}><Text style={styles.selectChipText}>＋</Text></Pressable>
            <Text style={[styles.optionTitle, { marginLeft: 'auto' }]}>{money(item.price * Number(item.quantity || 0))}</Text>
          </View>
        </View>
        <Pressable onPress={() => removeProduct(item.productId)} style={styles.deleteButton}><Text style={styles.deleteText}>Remove</Text></Pressable>
      </View>
    ))}
    <Text style={styles.fieldLabel}>Select Products</Text>
    <View style={styles.optionList}>
      {products.map((product) => {
        const selected = cart.some((item) => item.productId === product.id);
        return <Pressable key={product.id} onPress={() => addProduct(product)} style={styles.optionRow}>
          <View style={{ flex: 1 }}><Text style={styles.optionTitle}>{product.name}</Text><Text style={styles.optionMeta}>Stock {product.stock} · Sell {money(product.sellingPrice)}</Text></View>
          <Text style={styles.check}>{selected ? '＋ Add More' : '＋ Add'}</Text>
        </Pressable>;
      })}
    </View>
    <View style={styles.amountPreview}><Text style={styles.amountPreviewLabel}>Sale total</Text><Text style={styles.amountPreviewValue}>{money(cartTotal)}</Text></View>
    <PickerRow label="Payment" value={paymentMethod} onChange={(value) => { setPaymentMethod(value); setError(''); }} options={[{ value: 'paid', label: 'Paid' }, { value: 'udhaar', label: 'Udhaar' }]} />
    {paymentMethod === 'udhaar' ? <View>
      <Text style={styles.fieldLabel}>Customer</Text>
      {addingCustomer ? <View style={styles.sectionCard}>
        <Text style={styles.modalDescription}>Add a customer to continue with udhaar.</Text>
        <FormField label="Customer Name" value={newCustomerName} onChangeText={setNewCustomerName} placeholder="e.g. Ramesh" />
        <FormField label="Phone" value={newCustomerPhone} onChangeText={setNewCustomerPhone} keyboardType="phone-pad" placeholder="Optional" />
        <View style={styles.modalActions}><Button title="Back" onPress={() => setAddingCustomer(false)} variant="secondary" style={{ flex: 1 }} /><Button title="Save Customer" onPress={saveInlineCustomer} style={{ flex: 1 }} /></View>
      </View> : customers.length === 0 ? <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No customers yet</Text>
        <Text style={styles.emptySubtext}>Add a customer to continue with udhaar.</Text>
        <Button title="＋ Add Customer" onPress={() => setAddingCustomer(true)} />
      </View> : <View>
        <Options items={customers} selected={customerId} onSelect={(id) => { setCustomerId(id); setError(''); }} detail={(customer) => `Current due ${money(customer.balance)}`} />
        <Button title="＋ Add New Customer" onPress={() => setAddingCustomer(true)} variant="secondary" />
      </View>}
    </View> : null}
    {error ? <Text style={styles.warningText}>{error}</Text> : null}
    <View style={styles.modalActions}><Button title="Cancel" onPress={onCancel} variant="danger" style={{ flex: 1 }} /><Button title="Record Sale" onPress={submit} style={{ flex: 1 }} /></View>
  </ModalShell>;
}
export function PurchaseModal({ visible, products, onConfirm, onCancel }) {
  const [productId, setProductId] = useState(''), [quantity, setQuantity] = useState('1');
  useEffect(() => { if (visible) { setProductId(products[0]?.id ?? ''); setQuantity('1'); } }, [visible, products.length]);
  const product = products.find((p) => String(p.id) === String(productId)); const total = product ? product.purchasePrice * (Number(quantity) || 0) : 0;
  return <ModalShell visible={visible} title="Add Purchase" onClose={onCancel}><Text style={styles.modalDescription}>Increase stock using the purchase price.</Text><Text style={styles.fieldLabel}>Product</Text><Options items={products} selected={productId} onSelect={setProductId} detail={(p) => `Buy ${money(p.purchasePrice)} · Stock ${p.stock}`} /><FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="1" /><View style={styles.amountPreview}><Text style={styles.amountPreviewLabel}>Purchase amount</Text><Text style={styles.amountPreviewValue}>{money(total)}</Text></View><Actions cancel={onCancel} confirm={() => onConfirm(productId, quantity)} title="Add Purchase" /></ModalShell>;
}
export function AddProductModal({ visible, onConfirm, onCancel }) {
  const [name, setName] = useState(''), [purchasePrice, setPurchasePrice] = useState(''), [sellingPrice, setSellingPrice] = useState(''), [stock, setStock] = useState(''), [barcode, setBarcode] = useState(''), [expiryDate, setExpiryDate] = useState('');
  useEffect(() => { if (visible) { setName(''); setPurchasePrice(''); setSellingPrice(''); setStock(''); setBarcode(''); setExpiryDate(''); } }, [visible]);
  return <ModalShell visible={visible} title="Add Product" onClose={onCancel}><Text style={styles.modalDescription}>Create a product with its opening stock.</Text><FormField label="Product Name" value={name} onChangeText={setName} placeholder="e.g. Britannia Biscuit" /><FormField label="Purchase Price" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="0" /><FormField label="Selling Price" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="decimal-pad" placeholder="0" /><FormField label="Opening Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" /><FormField label="Barcode (optional)" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" placeholder="Scan or enter barcode" /><FormField label="Expiry date (optional)" value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" /><Actions cancel={onCancel} confirm={() => onConfirm(name, purchasePrice, sellingPrice, stock, barcode, expiryDate)} title="Add Product" /></ModalShell>;
}
export function AddCustomerModal({ visible, onConfirm, onCancel }) {
  const [name, setName] = useState(''), [phone, setPhone] = useState(''); useEffect(() => { if (visible) { setName(''); setPhone(''); } }, [visible]);
  return <ModalShell visible={visible} title="Add Customer" onClose={onCancel}><Text style={styles.modalDescription}>Save a customer for udhaar tracking.</Text><FormField label="Customer Name" value={name} onChangeText={setName} placeholder="e.g. Ramesh" /><FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optional" /><Actions cancel={onCancel} confirm={() => onConfirm(name, phone)} title="Add Customer" /></ModalShell>;
}
function LedgerModal({ visible, title, description, customers, onConfirm, onCancel, actionTitle, payment }) {
  const [customerId, setCustomerId] = useState(''), [amount, setAmount] = useState(''); useEffect(() => { if (visible) { setCustomerId(customers[0]?.id ?? ''); setAmount(''); } }, [visible, customers.length]); const customer = customers.find((c) => c.id === Number(customerId));
  return <ModalShell visible={visible} title={title} onClose={onCancel}><Text style={styles.modalDescription}>{description}</Text><Text style={styles.fieldLabel}>Customer</Text><Options items={customers} selected={customerId} onSelect={setCustomerId} detail={(c) => `${payment ? 'Outstanding' : 'Current due'} ${money(c.balance)}`} /><FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={payment ? '300' : '850'} />{payment ? <View style={styles.amountPreview}><Text style={styles.amountPreviewLabel}>Remaining after payment</Text><Text style={styles.amountPreviewValue}>{money(Math.max(0, Number(customer?.balance || 0) - Number(amount || 0)))}</Text></View> : null}<Actions cancel={onCancel} confirm={() => onConfirm(customerId, amount)} title={actionTitle} /></ModalShell>;
}
export function UdhaarModal(props) { return <LedgerModal {...props} title="Add Udhaar" description="Add an outstanding amount without creating a product sale." actionTitle="Add Udhaar" />; }
export function PaymentModal(props) { return <LedgerModal {...props} title="Receive Payment" description="Reduce a customer's outstanding balance." actionTitle="Receive Payment" payment />; }
export function ExpenseModal({ visible, onConfirm, onCancel }) {
  const [category, setCategory] = useState('general'), [amount, setAmount] = useState(''), [note, setNote] = useState('');
  useEffect(() => { if (visible) { setCategory('general'); setAmount(''); setNote(''); } }, [visible]);
  return <ModalShell visible={visible} title="Add Expense" onClose={onCancel}><Text style={styles.modalDescription}>Track shop costs for an accurate net profit.</Text><FormField label="Category" value={category} onChangeText={setCategory} placeholder="rent, transport, etc." /><FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" /><FormField label="Note (optional)" value={note} onChangeText={setNote} placeholder="What was this for?" /><Actions cancel={onCancel} confirm={() => onConfirm(category, amount, note)} title="Add Expense" /></ModalShell>;
}
