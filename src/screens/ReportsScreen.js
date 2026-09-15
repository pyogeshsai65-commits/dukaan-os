import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, SectionHeader, StatCard } from '../components/Controls';
import { styles } from '../components/styles';
import { money } from '../utils/money';
import { buildBusinessReport, exportReportPdf } from '../services/reports';

export default function ReportsScreen({ state }) {
  const [month, setMonth] = useState(() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; });
  const report = buildBusinessReport(state, month);
  const reportMoney = (value) => value === null ? 'Unavailable' : money(value);
  function shiftMonth(delta) {
    const [year, currentMonth] = month.split('-').map(Number);
    const date = new Date(year, currentMonth - 1 + delta, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.heroCard}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>BUSINESS INSIGHTS</Text><Text style={styles.heroTitle}>Samajhiye dukaan ka profit.</Text><Text style={styles.heroSubtitle}>A simple, deterministic view of this month's business.</Text></View><Text style={styles.heroEmoji}>📊</Text></View>
    <View style={styles.sectionCard}><View style={styles.monthPicker}><Pressable onPress={() => shiftMonth(-1)} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable><Text style={styles.monthLabel}>{month}</Text><Pressable onPress={() => shiftMonth(1)} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable></View></View>
    <View style={styles.statGrid}><StatCard title="Revenue" value={money(report.month.revenue)} icon="💰" /><StatCard title="Purchases" value={money(report.purchases)} icon="📦" /><StatCard title="Payments received" value={money(report.paymentsReceived)} icon="🤝" /><StatCard title="Gross Profit" value={reportMoney(report.month.grossProfit)} icon="📈" /><StatCard title="Expenses" value={money(report.month.expenses)} icon="🧾" /><StatCard title="Net Profit" value={reportMoney(report.month.netProfit)} icon="✅" /></View>
    <View style={styles.sectionCard}><SectionHeader title="Why profit?" subtitle="Based only on your recorded data" />{report.insights.map((item, index) => <Text key={index} style={styles.reportInsight}>• {item}</Text>)}</View>
    <View style={styles.sectionCard}><SectionHeader title="Product performance" subtitle="Best, slow and dead stock" /><Text style={styles.reportHeading}>Best sellers</Text>{report.bestProducts.length ? report.bestProducts.map((p) => <Text style={styles.reportLine} key={p.productId}>{p.productName} · {p.quantity} sold · {money(p.profit)} profit</Text>) : <Text style={styles.emptyText}>No sales recorded this month.</Text>}<Text style={styles.reportHeading}>Slow/dead stock</Text>{report.deadProducts.length ? report.deadProducts.map((p) => <Text style={styles.reportLine} key={p.id}>{p.name} · {p.stock} in stock</Text>) : <Text style={styles.emptyText}>No dead stock signal yet.</Text>}</View>
    <View style={styles.sectionCard}><SectionHeader title="Stock snapshot" subtitle={`${report.stock.length} products`} />{report.stock.map((p) => <Text style={styles.reportLine} key={p.id}>{p.name} · {p.stock} units · {money(p.stockValue)} at cost{p.low ? ' · Low' : ''}</Text>)}</View>
    <Button title="Export report (PDF)" variant="secondary" onPress={async () => { const result = await exportReportPdf(report); Alert.alert('Report export', result.message); }} />
  </ScrollView>;
}
