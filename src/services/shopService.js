import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const CURRENT_SHOP_ID_KEY = 'dukaanos.current_shop_id';

function buildMissingConfigError() {
  return new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

async function getAuthenticatedUser() {
  if (!supabase) {
    return { user: null, error: buildMissingConfigError() };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    return { user: null, error };
  }

  return { user, error: null };
}

export async function listUserShopsAndMemberships() {
  const { user, error: userError } = await getAuthenticatedUser();

  if (userError || !user) {
    return {
      user: null,
      shops: [],
      memberships: [],
      error: userError || new Error('No authenticated user was found.'),
    };
  }

  const { data: memberships = [], error: membershipError } = await supabase
    .from('shop_memberships')
    .select('shop_id, user_id')
    .eq('user_id', user.id);

  if (membershipError) {
    return {
      user,
      shops: [],
      memberships: [],
      error: membershipError,
    };
  }

  const shopIds = [...new Set((memberships || []).map((membership) => membership.shop_id).filter(Boolean))];

  let shops = [];

  if (shopIds.length > 0) {
    const { data: shopRows, error: shopsError } = await supabase
      .from('shops')
      .select('id, name, created_at')
      .in('id', shopIds);

    if (shopsError) {
      return {
        user,
        shops: [],
        memberships: memberships || [],
        error: shopsError,
      };
    }

    shops = shopRows || [];
  }

  return {
    user,
    shops,
    memberships: memberships || [],
    error: null,
  };
}

export async function createUserShop({ name } = {}) {
  const { user, error: userError } = await getAuthenticatedUser();

  if (userError || !user) {
    return {
      shop: null,
      membership: null,
      error: userError || new Error('No authenticated user was found.'),
    };
  }

  const normalizedName = (name || 'My Shop').trim() || 'My Shop';

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .insert([{ name: normalizedName }])
    .select('id, name, created_at')
    .single();

  if (shopError || !shop) {
    return {
      shop: null,
      membership: null,
      error: shopError || new Error('Could not create a shop.'),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from('shop_memberships')
    .insert([
      {
        user_id: user.id,
        shop_id: shop.id,
      },
    ])
    .select('shop_id, user_id')
    .single();

  if (membershipError || !membership) {
    return {
      shop,
      membership: null,
      error: membershipError || new Error('Could not create the owner membership for this shop.'),
    };
  }

  return {
    shop,
    membership,
    error: null,
  };
}

export async function getCurrentShopId() {
  return AsyncStorage.getItem(CURRENT_SHOP_ID_KEY);
}

export async function setCurrentShopId(shopId) {
  if (!shopId) {
    await AsyncStorage.removeItem(CURRENT_SHOP_ID_KEY);
    return null;
  }

  await AsyncStorage.setItem(CURRENT_SHOP_ID_KEY, String(shopId));
  return String(shopId);
}

export async function restoreCurrentShopId() {
  return getCurrentShopId();
}
