import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, defaultProducts, migrateSnapshot, normalizeCustomers, normalizeEvents, normalizeExpenses, normalizeProducts, normalizeTransactions, SNAPSHOT_VERSION } from '../types/constants';
import { isoNow } from '../utils/id';
import { decryptSnapshot, encryptSnapshot, isEncryptedSnapshot } from './secureSnapshot';

export const SNAPSHOT_KEY = 'dukaan-snapshot-v1';

function coalesceNormalizedArray(candidate, fallback, normalizer, label) {
  if (Array.isArray(candidate)) return normalizer(candidate);
  if (candidate === undefined || candidate === null) return normalizer(fallback);
  console.warn(`Ignoring malformed ${label} payload in saved DukaanOS data`);
  return normalizer(fallback);
}

export async function loadDukaanData() {
  let snapshotReadFailed = false;
  const snapshot = await AsyncStorage.getItem(SNAPSHOT_KEY).catch((error) => {
    snapshotReadFailed = true;
    console.warn(`Could not read ${SNAPSHOT_KEY}`, error);
    return null;
  });
  let legacyReadFailed = false;
  let legacyParseFailed = false;
  const entries = await Promise.all(Object.values(STORAGE_KEYS).map((key) => AsyncStorage.getItem(key).catch((error) => {
    legacyReadFailed = true;
    console.warn(`Could not read ${key}`, error);
    return null;
  })));
  const [p, s, pu, t, c] = entries;
  const parse = (value, fallback) => {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch (error) { legacyParseFailed = true; console.warn('Ignoring invalid legacy DukaanOS value', error); return fallback; }
  };
  const legacy = {
    products: normalizeProducts(parse(p, defaultProducts)),
    sales: Number(parse(s, 0)) || 0,
    purchases: Number(parse(pu, 0)) || 0,
    transactions: normalizeTransactions(parse(t, [])),
    customers: normalizeCustomers(parse(c, [])),
  };
  legacy.transactions = legacy.transactions.map((transaction) => {
    if (!transaction.customerId && transaction.customerName) {
      const customer = legacy.customers.find((item) => item.name === transaction.customerName);
      return customer ? { ...transaction, customerId: customer.id } : transaction;
    }
    return transaction;
  });
  const backfillBalances = (customers, transactions) => customers.forEach((customer) => {
    const ledgerBalance = transactions.reduce((total, transaction) => {
      if (String(transaction.customerId) !== String(customer.id)) return total;
      return total + (transaction.type === 'credit-sale' || transaction.type === 'credit' ? Number(transaction.amount || 0) : transaction.type === 'payment' ? -Number(transaction.amount || 0) : 0);
    }, 0);
    if (ledgerBalance === 0 && Number(customer.balance || 0) > 0) {
      const occurredAt = customer.createdAt || isoNow();
      transactions.push({ id: `legacy-opening-balance-${customer.id}`, type: 'credit', productName: customer.name, quantity: 1, amount: Number(customer.balance), customerName: customer.name, customerId: customer.id, note: 'Migrated customer balance', timestamp: occurredAt, createdAt: occurredAt, occurredAt });
    }
  });
  backfillBalances(legacy.customers, legacy.transactions);
  if (!snapshot) {
    const migrated = { ...legacy, events: legacy.transactions.map((item) => ({ id: `legacy-event-${item.id}`, type: item.type, occurredAt: item.occurredAt || item.timestamp, transactionId: item.id, amount: item.amount })), expenses: [] };
    if (!snapshotReadFailed && !legacyReadFailed && !legacyParseFailed) await saveDukaanState(migrated);
    return { ...migrated, storageReadFailed: snapshotReadFailed || legacyReadFailed || legacyParseFailed, storageError: legacyParseFailed ? 'Saved data could not be parsed. Your data was not overwritten.' : undefined };
  }
  try {
    const parsedSnapshot = isEncryptedSnapshot(snapshot) ? await decryptSnapshot(snapshot) : JSON.parse(snapshot);
    const migrated = migrateSnapshot(parsedSnapshot);
    const snapshotTransactions = coalesceNormalizedArray(migrated.data?.transactions, legacy.transactions, normalizeTransactions, 'transactions');
    const snapshotCustomers = coalesceNormalizedArray(migrated.data?.customers, legacy.customers, normalizeCustomers, 'customers');
    const snapshotProducts = coalesceNormalizedArray(migrated.data?.products, legacy.products, normalizeProducts, 'products');
    const snapshotEvents = coalesceNormalizedArray(migrated.data?.events, [], normalizeEvents, 'events');
    const snapshotExpenses = coalesceNormalizedArray(migrated.data?.expenses, [], normalizeExpenses, 'expenses');
    backfillBalances(snapshotCustomers, snapshotTransactions);
    const result = {
      ...legacy, sales: Number(migrated.data?.sales ?? legacy.sales) || 0, purchases: Number(migrated.data?.purchases ?? legacy.purchases) || 0, storageReadFailed: false,
      products: snapshotProducts,
      transactions: snapshotTransactions,
      customers: snapshotCustomers,
      events: snapshotEvents,
      expenses: snapshotExpenses,
    };
    if (!isEncryptedSnapshot(snapshot)) await saveDukaanState(result);
    return result;
  } catch (error) {
    console.warn('Ignoring invalid DukaanOS snapshot; legacy data retained', error);
    if (isEncryptedSnapshot(snapshot)) {
      return { ...legacy, events: [], expenses: [], storageReadFailed: true, storageError: 'Saved data could not be verified. Your data was not overwritten.' };
    }
    return { ...legacy, events: [], expenses: [] };
  }
}

export function saveDukaanValue(key, value) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

let saveQueue = Promise.resolve();
export function saveDukaanState(data) {
  saveQueue = saveQueue.catch(() => undefined).then(async () => {
    const snapshot = await encryptSnapshot({ version: SNAPSHOT_VERSION, savedAt: new Date().toISOString(), data });
    await AsyncStorage.setItem(SNAPSHOT_KEY, snapshot);
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  });
  return saveQueue;
}

export function saveDukaanSnapshot(data) {
  return saveDukaanState(data);
}
