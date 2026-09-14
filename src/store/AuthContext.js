import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentSupabaseSession, signInWithEmail, signOut, signUpWithEmail, subscribeToAuthChanges } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      const result = await getCurrentSupabaseSession();
      if (!active) return;

      setSession(result.session ?? null);
      setUser(result.user ?? null);
      setError(result.error ? String(result.error.message || result.error) : null);
      setLoading(false);
    }

    bootstrapSession();

    const unsubscribe = subscribeToAuthChanges((event, nextSession) => {
      if (!active) return;

      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setError(null);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    signUp: async (email, password) => {
      const result = await signUpWithEmail(email, password);
      if (result?.error) {
        setError(String(result.error.message || result.error));
      }
      return result;
    },
    signIn: async (email, password) => {
      const result = await signInWithEmail(email, password);
      if (result?.error) {
        setError(String(result.error.message || result.error));
      }
      return result;
    },
    signOut: async () => {
      const result = await signOut();
      if (result?.error) {
        setError(String(result.error.message || result.error));
      }
      setSession(null);
      setUser(null);
      return result;
    },
    refreshSession: async () => {
      const result = await getCurrentSupabaseSession();
      setSession(result.session ?? null);
      setUser(result.user ?? null);
      setError(result.error ? String(result.error.message || result.error) : null);
      return result;
    },
  }), [session, user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
