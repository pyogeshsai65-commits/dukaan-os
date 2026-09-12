import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, defaultProducts, normalizeCustomers, normalizeEvents, normalizeExpenses, normalizeProducts, normalizeTransactions, SNAPSHOT_VERSION } from '../types/constants';

export const SNAPSHOT_KEY = 'dukaan-snapshot-v1';

export async function loadDukaanData() {
  const snapshot = await AsyncStorage.getItem(SNAPSHOT_KEY);
  const entries = await Promise.all(Object.values(STORAGE_KEYS).map((key) => AsyncStorage.getItem(key)));
  const [p, s, pu, t, c] = entries;
  const parse = (value, fallback) => {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch (error) { console.warn('Ignoring invalid legacy DukaanOS value', error); return fallback; }
  };
  const legacy = {
    products: normalizeProducts(parse(p, defaultProducts)),
    sales: Number(parse(s, 0)) || 0,
    purchases: Number(parse(pu, 0)) || 0,
    transactions: normalizeTransactions(parse(t, [])),
    customers: normalizeCustomers(parse(c, [])),
  };
  if (!snapshot) return { ...legacy, events: legacy.transactions.map((item) => ({ id: item.id, type: item.type, occurredAt: item.occurredAt || item.timestamp, transactionId: item.id, amount: item.amount })) , expenses: [] };
  try {
    const parsed = JSON.parse(snapshot);
    return {
      ...legacy, ...parsed.data,
      products: normalizeProducts(parsed.data?.products || legacy.products),
      transactions: normalizeTransactions(parsed.data?.transactions || legacy.transactions),
      customers: normalizeCustomers(parsed.data?.customers || legacy.customers),
      events: normalizeEvents(parsed.data?.events || []),
      expenses: normalizeExpenses(parsed.data?.expenses),
    };
  } catch (error) {
    console.warn('Ignoring invalid DukaanOS snapshot; legacy data retained', error);
    return { ...legacy, events: [], expenses: [] };
  }
}

export function saveDukaanValue(key, value) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

let saveQueue = Promise.resolve();
export function saveDukaanSnapshot(data) {
  saveQueue = saveQueue.then(() => AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ version: SNAPSHOT_VERSION, savedAt: new Date().toISOString(), data })));
  return saveQueue;
}
