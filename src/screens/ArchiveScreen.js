import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, SectionHeader } from '../components/Controls';
import { styles } from '../components/styles';
import { money } from '../utils/money';

export default function ArchiveScreen({ products, actions }) {
  const archived = products.filter((product) => product.archived);
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.sectionCard}>
      <SectionHeader title="Archive" subtitle={`${archived.length} archived products`} />
      {archived.length === 0 ? <Text style={styles.emptyText}>No archived products.</Text> : archived.map((product) => <View key={product.id} style={styles.archiveCard}>
        <View style={styles.productInfo}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>Stock {product.stock} · Buy {money(product.purchasePrice)} · Sell {money(product.sellingPrice)}</Text></View>
        <Button title="Restore" variant="secondary" style={styles.smallButton} onPress={() => actions.restoreProduct(product.id)} />
      </View>)}
    </View>
  </ScrollView>;
}
