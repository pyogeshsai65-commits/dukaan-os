import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SectionHeader } from '../components/Controls';
import { styles } from '../components/styles';
import { money } from '../utils/money';
export default function InventoryScreen({ products, search, setSearch, actions }) {
  const filtered = search.trim() ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())) : products;
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.sectionCard}><SectionHeader title="Inventory" subtitle={`${products.length} products`} actionTitle="＋ Add" onAction={() => actions.modal('product', true)} /><TextInput value={search} onChangeText={setSearch} placeholder="Search products..." placeholderTextColor="#94a3b8" style={styles.searchInput} />{filtered.map((p) => <View key={p.id} style={styles.productCard}><View style={styles.productAvatar}><Text style={styles.productAvatarText}>{p.name.charAt(0).toUpperCase()}</Text></View><View style={styles.productInfo}><Text style={styles.productName}>{p.name}</Text><Text style={styles.productMeta}>Buy {money(p.purchasePrice)}  ·  Sell {money(p.sellingPrice)}</Text></View><View style={styles.stockBox}><Text style={[styles.stockValue, p.stock <= 5 && styles.lowStockText]}>{p.stock}</Text><Text style={styles.stockLabel}>stock</Text></View><Pressable onPress={() => actions.deleteProduct(p.id)} style={styles.deleteButton}><Text style={styles.deleteText}>Delete</Text></Pressable></View>)}{filtered.length === 0 ? <Text style={styles.emptyText}>No products found.</Text> : null}</View></ScrollView>;
}
