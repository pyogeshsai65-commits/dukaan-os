import React from 'react';
import { Alert } from 'react-native';
import { ScrollView, Text, View } from 'react-native';
import { Button, SectionHeader } from '../components/Controls';
import { TransactionRow } from '../components/TransactionRow';
import { styles } from '../components/styles';
import { exportInvoicePdf } from '../services/reports';
export default function TransactionsScreen({ transactions }) {
  async function exportInvoice(transaction) {
    const result = await exportInvoicePdf(transaction);
    Alert.alert('Invoice export', result.message);
  }
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.sectionCard}><SectionHeader title="Transactions" subtitle={`${transactions.length} total entries`} />{transactions.length === 0 ? <Text style={styles.emptyText}>No transactions yet.</Text> : transactions.map((t) => <View key={t.id}><TransactionRow transaction={t} detailed />{(t.type === 'sale' || t.type === 'credit-sale') ? <Button title="Export invoice PDF" variant="secondary" onPress={() => exportInvoice(t)} /> : null}</View>)}</View></ScrollView>;
}
