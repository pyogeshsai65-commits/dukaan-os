import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: AsyncStorage,
        },
      })
    : null;

export function getSupabaseStatus() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ready: false,
      reason: 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY',
      url: Boolean(supabaseUrl),
      key: Boolean(supabaseAnonKey),
    };
  }

  return {
    ready: true,
    reason: 'Supabase public client initialized',
    url: true,
    key: true,
  };
}

export async function testSupabaseReadOnly() {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase client is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  const { data, error } = await supabase.from('shops').select('id').limit(1);

  if (error) {
    return {
      ok: false,
      message: 'Supabase read-only query failed',
      error,
    };
  }

  return {
    ok: true,
    message: 'Supabase read-only query succeeded',
    data,
  };
}
code .env
