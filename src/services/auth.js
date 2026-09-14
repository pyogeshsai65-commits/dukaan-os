import { supabase } from './supabaseClient';

export async function getCurrentSupabaseSession() {
  if (!supabase) {
    return {
      session: null,
      user: null,
      ready: false,
      error: new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'),
    };
  }

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return {
      session: null,
      user: null,
      ready: true,
      error,
    };
  }

  return {
    session,
    user: session?.user ?? null,
    ready: true,
    error: null,
  };
}

export async function signUpWithEmail(email, password) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'),
    };
  }

  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email, password) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'),
    };
  }

  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) {
    return {
      error: new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'),
    };
  }

  return supabase.auth.signOut();
}

export function subscribeToAuthChanges(onAuthStateChange) {
  if (!supabase) {
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (typeof onAuthStateChange === 'function') {
      onAuthStateChange(event, session);
    }
  });

  return () => subscription.unsubscribe();
}
