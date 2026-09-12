import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, defaultProducts, normalizeCustomers, normalizeProducts, normalizeTransactions } from '../types/constants';

export async function loadDukaanData() {
  const entries = await Promise.all(Object.values(STORAGE_KEYS).map((key) => AsyncStorage.getItem(key)));
  const [p, s, pu, t, c] = entries;
  return {
    products: p ? normalizeProducts(JSON.parse(p)) : defaultProducts,
    sales: s ? Number(JSON.parse(s)) || 0 : 0,
    purchases: pu ? Number(JSON.parse(pu)) || 0 : 0,
    transactions: t ? normalizeTransactions(JSON.parse(t)) : [],
    customers: c ? normalizeCustomers(JSON.parse(c)) : [],
  };
}

export function saveDukaanValue(key, value) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}
