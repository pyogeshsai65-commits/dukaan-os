import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { STORAGE_KEYS, defaultProducts } from '../types/constants';
import { loadDukaanData, saveDukaanValue } from '../services/storage';

const initialState = { products: defaultProducts, sales: 0, purchases: 0, transactions: [], customers: [], hydrated: false };
const DukaanContext = createContext(null);

function reducer(state, action) {
  if (action.type === 'HYDRATE') return { ...state, ...action.data, hydrated: true };
  if (action.type === 'SET') return { ...state, [action.key]: typeof action.value === 'function' ? action.value(state[action.key]) : action.value };
  return state;
}

export function DukaanProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    let mounted = true;
    loadDukaanData().then((data) => mounted && dispatch({ type: 'HYDRATE', data })).catch((error) => {
      console.warn('Could not load saved DukaanOS data', error);
      if (mounted) dispatch({ type: 'HYDRATE', data: {} });
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => saveDukaanValue(storageKey, state[key]));
  }, [state.hydrated, state.products, state.sales, state.purchases, state.transactions, state.customers]);

  const value = useMemo(() => ({ state, set: (key, value) => dispatch({ type: 'SET', key, value }) }), [state]);
  return <DukaanContext.Provider value={value}>{children}</DukaanContext.Provider>;
}

export function useDukaan() {
  const context = useContext(DukaanContext);
  if (!context) throw new Error('useDukaan must be used inside DukaanProvider');
  return context;
}
