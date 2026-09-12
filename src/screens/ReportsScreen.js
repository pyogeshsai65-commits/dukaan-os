import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, SectionHeader, StatCard } from '../components/Controls';
import { styles } from '../components/styles';
import { money } from '../utils/money';
import { buildBusinessReport, exportReportPdf } from '../services/reports';

export default function ReportsScreen({ state }) {
  const [month] = useState(() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; });
  const report = buildBusinessReport(state, month);
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.heroCard}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>BUSINESS INSIGHTS</Text><Text style={styles.heroTitle}>Samajhiye dukaan ka profit.</Text><Text style={styles.heroSubtitle}>A simple, deterministic view of this month's business.</Text></View><Text style={styles.heroEmoji}>📊</Text></View>
    <View style={styles.statGrid}><StatCard title="Revenue" value={money(report.month.revenue)} icon="💰" /><StatCard title="Gross Profit" value={money(report.month.grossProfit)} icon="📈" /><StatCard title="Expenses" value={money(report.month.expenses)} icon="🧾" /><StatCard title="Net Profit" value={money(report.month.netProfit)} icon="✅" /></View>
    <View style={styles.sectionCard}><SectionHeader title="Why profit?" subtitle="Based only on your recorded data" />{report.insights.map((item, index) => <Text key={index} style={styles.reportInsight}>• {item}</Text>)}</View>
    <View style={styles.sectionCard}><SectionHeader title="Product performance" subtitle="Best, slow and dead stock" /><Text style={styles.reportHeading}>Best sellers</Text>{report.bestProducts.length ? report.bestProducts.map((p) => <Text style={styles.reportLine} key={p.productId}>{p.productName} · {p.quantity} sold · {money(p.profit)} profit</Text>) : <Text style={styles.emptyText}>No sales recorded this month.</Text>}<Text style={styles.reportHeading}>Slow/dead stock</Text>{report.deadProducts.length ? report.deadProducts.map((p) => <Text style={styles.reportLine} key={p.id}>{p.name} · {p.stock} in stock</Text>) : <Text style={styles.emptyText}>No dead stock signal yet.</Text>}</View>
    <View style={styles.sectionCard}><SectionHeader title="Stock snapshot" subtitle={`${report.stock.length} products`} />{report.stock.map((p) => <Text style={styles.reportLine} key={p.id}>{p.name} · {p.stock} units · {money(p.stockValue)} at cost{p.low ? ' · Low' : ''}</Text>)}</View>
    <Button title="Export report (PDF)" variant="secondary" onPress={async () => { const result = await exportReportPdf(report); Alert.alert('Report export', result.message); }} />
  </ScrollView>;
}
