import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, SectionHeader } from '../components/Controls';
import { styles } from '../components/styles';

const RETENTION_MS = 15 * 24 * 60 * 60 * 1000;

function formatDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : 'Unknown date';
}

function retentionText(deletedAt) {
  const remaining = new Date(deletedAt).getTime() + RETENTION_MS - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) return 'Permanently deletes soon';
  if (remaining < 24 * 60 * 60 * 1000) return 'Permanently deletes in less than 1 day';
  return `Permanently deletes in ${Math.ceil(remaining / (24 * 60 * 60 * 1000))} days`;
}

export default function RecycleBinScreen({ products, actions }) {
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.sectionCard}>
      <SectionHeader title="Recycle Bin" subtitle={`${products.length} deleted products`} />
      {products.length === 0 ? <View><Text style={styles.emptyText}>Recycle Bin is empty</Text><Text style={styles.emptySubtext}>Deleted products can be restored for 15 days.</Text></View> : products.map((product) => <View key={product.id} style={styles.recycleCard}>
        <View style={styles.productInfo}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>Stock {product.stock} · Deleted {formatDate(product.deletedAt)}</Text><Text style={styles.recycleRetention}>{retentionText(product.deletedAt)}</Text></View>
        <Button title="Restore" variant="secondary" style={styles.smallButton} onPress={() => actions.restoreProduct(product.id)} />
      </View>)}
    </View>
  </ScrollView>;
}
