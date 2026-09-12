import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, FormField, ModalShell, PickerRow } from './Controls';
import { styles } from './styles';
import { money } from '../utils/money';

function Options({ items, selected, onSelect, detail }) {
  return <View style={styles.optionList}>{items.map((item) => <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.optionRow, selected === item.id && styles.optionRowActive]}><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{item.name}</Text><Text style={styles.optionMeta}>{detail(item)}</Text></View>{selected === item.id ? <Text style={styles.check}>✓</Text> : null}</Pressable>)}</View>;
}
function Actions({ cancel, confirm, title }) { return <View style={styles.modalActions}><Button title="Cancel" onPress={cancel} variant="danger" style={{ flex: 1 }} /><Button title={title} onPress={confirm} style={{ flex: 1 }} /></View>; }

export function SaleModal({ visible, products, customers, onConfirm, onCancel }) {
  const [productId, setProductId] = useState(''), [quantity, setQuantity] = useState('1'), [paymentMethod, setPaymentMethod] = useState('paid'), [customerId, setCustomerId] = useState('');
  useEffect(() => { if (visible) { setProductId(products[0]?.id ?? ''); setQuantity('1'); setPaymentMethod('paid'); setCustomerId(customers[0]?.id ?? ''); } }, [visible, products.length, customers.length]);
  const product = products.find((p) => p.id === Number(productId)); const total = product ? product.sellingPrice * (Number(quantity) || 0) : 0;
  return <ModalShell visible={visible} title="Record Sale" onClose={onCancel}><Text style={styles.modalDescription}>Reduce stock and record the sale.</Text><Text style={styles.fieldLabel}>Product</Text><Options items={products} selected={productId} onSelect={setProductId} detail={(p) => `Stock ${p.stock} · Sell ${money(p.sellingPrice)}`} /><FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="1" /><PickerRow label="Payment" value={paymentMethod} onChange={setPaymentMethod} options={[{ value: 'paid', label: 'Paid' }, { value: 'udhaar', label: 'Udhaar' }]} />{paymentMethod === 'udhaar' ? <><Text style={styles.fieldLabel}>Customer</Text><Options items={customers} selected={customerId} onSelect={setCustomerId} detail={(c) => `Current due ${money(c.balance)}`} /></> : null}<View style={styles.amountPreview}><Text style={styles.amountPreviewLabel}>Sale amount</Text><Text style={styles.amountPreviewValue}>{money(total)}</Text></View><Actions cancel={onCancel} confirm={() => onConfirm(productId, quantity, paymentMethod, customerId)} title="Record Sale" /></ModalShell>;
}
export function PurchaseModal({ visible, products, onConfirm, onCancel }) {
  const [productId, setProductId] = useState(''), [quantity, setQuantity] = useState('1');
  useEffect(() => { if (visible) { setProductId(products[0]?.id ?? ''); setQuantity('1'); } }, [visible, products.length]);
  const product = products.find((p) => p.id === Number(productId)); const total = product ? product.purchasePrice * (Number(quantity) || 0) : 0;
  return <ModalShell visible={visible} title="Add Purchase" onClose={onCancel}><Text style={styles.modalDescription}>Increase stock using the purchase price.</Text><Text style={styles.fieldLabel}>Product</Text><Options items={products} selected={productId} onSelect={setProductId} detail={(p) => `Buy ${money(p.purchasePrice)} · Stock ${p.stock}`} /><FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="1" /><View style={styles.amountPreview}><Text style={styles.amountPreviewLabel}>Purchase amount</Text><Text style={styles.amountPreviewValue}>{money(total)}</Text></View><Actions cancel={onCancel} confirm={() => onConfirm(productId, quantity)} title="Add Purchase" /></ModalShell>;
}
export function AddProductModal({ visible, onConfirm, onCancel }) {
  const [name, setName] = useState(''), [purchasePrice, setPurchasePrice] = useState(''), [sellingPrice, setSellingPrice] = useState(''), [stock, setStock] = useState('');
  useEffect(() => { if (visible) { setName(''); setPurchasePrice(''); setSellingPrice(''); setStock(''); } }, [visible]);
  return <ModalShell visible={visible} title="Add Product" onClose={onCancel}><Text style={styles.modalDescription}>Create a product with its opening stock.</Text><FormField label="Product Name" value={name} onChangeText={setName} placeholder="e.g. Britannia Biscuit" /><FormField label="Purchase Price" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="0" /><FormField label="Selling Price" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="decimal-pad" placeholder="0" /><FormField label="Opening Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" /><Actions cancel={onCancel} confirm={() => onConfirm(name, purchasePrice, sellingPrice, stock)} title="Add Product" /></ModalShell>;
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
