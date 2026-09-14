import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { defaultProducts } from '../types/constants';
import { loadDukaanData, saveDukaanState } from '../services/storage';
import { styles } from '../components/styles';

const initialState = { products: defaultProducts, sales: 0, purchases: 0, transactions: [], customers: [], events: [], expenses: [], hydrated: false, storageError: null };
const DukaanContext = createContext(null);

function reducer(state, action) {
  if (action.type === 'HYDRATE') {
    const next = {
      ...state,
      ...action.data,
      products: Array.isArray(action.data.products) ? action.data.products : state.products,
      sales: Number.isFinite(Number(action.data.sales)) ? Number(action.data.sales) : state.sales,
      purchases: Number.isFinite(Number(action.data.purchases)) ? Number(action.data.purchases) : state.purchases,
      transactions: Array.isArray(action.data.transactions) ? action.data.transactions : state.transactions,
      customers: Array.isArray(action.data.customers) ? action.data.customers : state.customers,
      events: Array.isArray(action.data.events) ? action.data.events : state.events,
      expenses: Array.isArray(action.data.expenses) ? action.data.expenses : state.expenses,
      hydrated: !action.data.storageReadFailed,
    };
    return next;
  }
  if (action.type === 'SET') return { ...state, [action.key]: typeof action.value === 'function' ? action.value(state[action.key]) : action.value };
  if (action.type === 'DOMAIN') return { ...state, ...action.update, events: [...(state.events || []), ...(action.events || [])] };
  return state;
}

export function DukaanProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const commandQueue = useRef(Promise.resolve());
  const completedOperations = useRef(new Set());
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    let mounted = true;
    loadDukaanData().then((data) => mounted && dispatch({ type: 'HYDRATE', data })).catch((error) => {
      console.warn('Could not load saved DukaanOS data', error);
      if (mounted) dispatch({ type: 'HYDRATE', data: { storageError: 'Saved data could not be loaded. Existing data was kept.', storageReadFailed: true } });
    });
    return () => { mounted = false; };
  }, []);

  const domain = (update, events = [], operationId) => {
    commandQueue.current = commandQueue.current.then(async () => {
      if (operationId && completedOperations.current.has(operationId)) return { duplicate: true };
      const current = stateRef.current;
      const resolved = typeof update === 'function' ? update(current) : update;
      if (resolved?.error) return { saved: false, error: new Error(resolved.error) };
      const next = reducer(current, { type: 'DOMAIN', update: resolved?.update || resolved, events: resolved?.events || events });
      const data = { products: next.products, sales: next.sales, purchases: next.purchases, transactions: next.transactions, customers: next.customers, events: next.events, expenses: next.expenses };
      await saveDukaanState(data);
      stateRef.current = next;
      dispatch({ type: 'HYDRATE', data: next });
      if (operationId) completedOperations.current.add(operationId);
      return { saved: true };
    }).catch((error) => {
      console.warn('Could not persist DukaanOS operation', error);
      dispatch({ type: 'SET', key: 'storageError', value: 'Could not save this change. Please retry.' });
      return { saved: false, error };
    });
    return commandQueue.current;
  };
  const value = useMemo(() => ({ state, set: (key, value) => dispatch({ type: 'SET', key, value }), domain }), [state]);
  if (!state.hydrated) return <HydrationScreen error={state.storageError} />;
  return <DukaanContext.Provider value={value}>{children}</DukaanContext.Provider>;
}

function HydrationScreen({ error }) {
  const pulse = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.94, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);
  return <View style={styles.startupScreen}>
    <Animated.View style={[styles.startupMark, { transform: [{ scale: pulse }] }]}>
      <Text style={styles.startupMarkText}>DUK <Text style={{ color: '#C89B3C' }}>KAN</Text> <Text style={{ color: '#F2C7D0' }}>OS</Text></Text>
    </Animated.View>
    <Text style={styles.startupTitle}>DukaanOS</Text>
    <View style={styles.startupRule} />
    <Text style={styles.startupSubtitle}>{error ? 'Saved data could not be loaded' : 'Loading your shop…'}</Text>
    {error ? <Text style={styles.startupError}>Your data was not overwritten. Restart the app and try again.</Text> : null}
  </View>;
}

export function useDukaan() {
  const context = useContext(DukaanContext);
  if (!context) throw new Error('useDukaan must be used inside DukaanProvider');
  return context;
}
