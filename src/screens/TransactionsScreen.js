import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SectionHeader } from '../components/Controls';
import { TransactionRow } from '../components/TransactionRow';
import { styles } from '../components/styles';
export default function TransactionsScreen({ transactions }) {
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.sectionCard}><SectionHeader title="Transactions" subtitle={`${transactions.length} total entries`} />{transactions.length === 0 ? <Text style={styles.emptyText}>No transactions yet.</Text> : transactions.map((t) => <TransactionRow key={t.id} transaction={t} detailed />)}</View></ScrollView>;
}
