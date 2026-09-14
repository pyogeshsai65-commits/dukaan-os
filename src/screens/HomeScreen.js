import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, SectionHeader, StatCard } from '../components/Controls';
import { TransactionRow } from '../components/TransactionRow';
import { styles } from '../components/styles';
import { money } from '../utils/money';
import UniversalSearch from '../components/UniversalSearch';

export default function HomeScreen({ data, actions }) {
  const insets = useSafeAreaInsets();
  const { products, sales, purchases, transactions, customers, totalStockValue, totalProfit, totalUdhaar } = data;
  const lowStock = products.filter((p) => p.stock <= 5);
  const recent = transactions.slice(0, 8);
  return <ScrollView contentContainerStyle={[styles.content, { paddingBottom: styles.content.paddingBottom + insets.bottom }]} showsVerticalScrollIndicator={false}>
    <UniversalSearch query={data.searchQuery} setQuery={data.setSearchQuery} products={products} customers={customers} transactions={transactions} actions={actions} />
    <View style={styles.heroCard}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>DU <Text style={{ color: '#C89B3C' }}>KAN</Text> <Text style={{ color: '#F2C7D0' }}>OS</Text></Text><Text style={styles.heroTitle}>Dukaan ka control, pocket mein.</Text><Text style={styles.heroSubtitle}>Sales, stock aur udhaar ek hi jagah.</Text></View><Text style={styles.heroEmoji}>✦</Text></View>
    <View style={styles.statGrid}><StatCard title="Sales Today" value={money(sales)} icon="💰" /><StatCard title="Purchases" value={money(purchases)} icon="📦" /><StatCard title="Stock Value" value={money(totalStockValue)} icon="🏪" /><StatCard title="Profit" value={money(totalProfit)} icon="📈" /><StatCard title="Total Udhaar" value={money(totalUdhaar)} icon="🤝" /></View>
    <View style={styles.sectionCard}><SectionHeader title="Quick Actions" subtitle="Common shop tasks" /><View style={styles.actionGrid}>
      <Button title="＋ Record Sale" onPress={() => actions.modal('sale', true)} /><Button title="＋ Add Purchase" onPress={() => actions.modal('purchase', true)} /><Button title="＋ Add Product" onPress={() => actions.modal('product', true)} variant="secondary" /><Button title="＋ Add Customer" onPress={() => actions.modal('customer', true)} variant="secondary" /><Button title="＋ Add Udhaar" onPress={() => actions.modal('udhaar', true)} variant="secondary" disabled={customers.length === 0} />      <Button title="＋ Receive Payment" onPress={() => actions.modal('payment', true)} variant="secondary" disabled={customers.length === 0} /><Button title="＋ Add Expense" onPress={() => actions.modal('expense', true)} variant="secondary" /><Button title="View Collections" onPress={() => actions.tab('collections')} variant="secondary" /><Button title="View Reports" onPress={() => actions.tab('reports')} variant="secondary" />
    </View></View>
    {lowStock.length > 0 ? <View style={styles.warningCard}><Text style={styles.warningTitle}>⚠ Low Stock</Text><Text style={styles.warningText}>{lowStock.map((p) => `${p.name} (${p.stock})`).join('  •  ')}</Text></View> : null}
    <View style={styles.sectionCard}><SectionHeader title="Recent Transactions" subtitle={`${recent.length} latest entries`} actionTitle="See all" onAction={() => actions.tab('transactions')} />{recent.length === 0 ? <Text style={styles.emptyText}>No transactions yet.</Text> : recent.map((t) => <TransactionRow key={t.id} transaction={t} />)}</View>
  </ScrollView>;
}
