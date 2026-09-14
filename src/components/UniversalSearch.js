import React, { useMemo } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from './styles';
import { money } from '../utils/money';
import { searchDukaan } from '../utils/search';
import { transactionTitle } from './TransactionRow';

export default function UniversalSearch({ query, setQuery, products, customers, transactions, actions }) {
  const results = useMemo(() => searchDukaan({ query, products, customers, transactions }), [query, products, customers, transactions]);
  const hasResults = results.products.length || results.customers.length || results.transactions.length;
  return <View style={styles.searchSection}>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search products, customers, transactions..." placeholderTextColor="#94a3b8" style={styles.searchInput} accessibilityLabel="Search products, customers and transactions" />
    {query.trim() ? <View style={styles.searchResults}>
      {!hasResults ? <Text style={styles.emptyText}>No matching products, customers or transactions.</Text> : null}
      {results.products.length ? <SearchGroup title="PRODUCTS" items={results.products} onPress={() => actions.tab('inventory')} render={(item) => `${item.name} · Stock ${item.stock}`} /> : null}
      {results.customers.length ? <SearchGroup title="CUSTOMERS" items={results.customers} onPress={() => actions.tab('customers')} render={(item) => `${item.name} · Due ${money(item.balance)}`} /> : null}
      {results.transactions.length ? <SearchGroup title="TRANSACTIONS" items={results.transactions} onPress={() => actions.tab('transactions')} render={(item) => transactionTitle(item)} /> : null}
    </View> : null}
  </View>;
}

function SearchGroup({ title, items, onPress, render }) {
  return <View style={styles.searchGroup}><Text style={styles.searchGroupTitle}>{title}</Text>{items.map((item) => <Pressable key={item.id} onPress={onPress} style={styles.searchResultRow}><Text style={styles.searchResultTitle}>{render(item)}</Text><Text style={styles.searchResultArrow}>›</Text></Pressable>)}</View>;
}
