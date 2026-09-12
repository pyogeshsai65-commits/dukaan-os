import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { STORAGE_KEYS, defaultProducts } from '../types/constants';
import { loadDukaanData, saveDukaanSnapshot, saveDukaanValue } from '../services/storage';

const initialState = { products: defaultProducts, sales: 0, purchases: 0, transactions: [], customers: [], events: [], expenses: [], hydrated: false, storageError: null };
const DukaanContext = createContext(null);

function reducer(state, action) {
  if (action.type === 'HYDRATE') return { ...state, ...action.data, hydrated: true };
  if (action.type === 'SET') return { ...state, [action.key]: typeof action.value === 'function' ? action.value(state[action.key]) : action.value };
  if (action.type === 'DOMAIN') return { ...state, ...action.update, events: [...(state.events || []), ...(action.events || [])] };
  return state;
}

export function DukaanProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    let mounted = true;
    loadDukaanData().then((data) => mounted && dispatch({ type: 'HYDRATE', data })).catch((error) => {
      console.warn('Could not load saved DukaanOS data', error);
      if (mounted) dispatch({ type: 'HYDRATE', data: { storageError: 'Saved data could not be loaded. Existing data was kept.' } });
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const data = { products: state.products, sales: state.sales, purchases: state.purchases, transactions: state.transactions, customers: state.customers, events: state.events, expenses: state.expenses };
    saveDukaanSnapshot(data).catch((error) => console.warn('Could not save DukaanOS snapshot', error));
    // Keep every established key readable by older app versions.
    Object.entries(STORAGE_KEYS).reduce((promise, [key, storageKey]) => promise.then(() => saveDukaanValue(storageKey, state[key])), Promise.resolve()).catch((error) => console.warn('Could not save legacy DukaanOS data', error));
  }, [state.hydrated, state.products, state.sales, state.purchases, state.transactions, state.customers, state.events, state.expenses]);

  const value = useMemo(() => ({ state, set: (key, value) => dispatch({ type: 'SET', key, value }), domain: (update, events = []) => dispatch({ type: 'DOMAIN', update, events }) }), [state]);
  return <DukaanContext.Provider value={value}>{children}</DukaanContext.Provider>;
}

export function useDukaan() {
  const context = useContext(DukaanContext);
  if (!context) throw new Error('useDukaan must be used inside DukaanProvider');
  return context;
}
