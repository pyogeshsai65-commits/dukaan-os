export async function createUserShop({ name }) {
  const { user, error: userError } = await getAuthenticatedUser();

  if (userError || !user) {
    return {
      shop: null,
      membership: null,
      error: userError || new Error('No authenticated user was found.'),
    };
  }

  const normalizedName = (name || 'My Shop').trim() || 'My Shop';

  const { data, error } = await supabase.rpc(
    'create_shop_for_current_user',
    {
      p_name: normalizedName,
    }
  );

  if (error) {
    return {
      shop: null,
      membership: null,
      error,
    };
  }

  const shop = Array.isArray(data) ? data[0] : data;

  if (!shop?.id) {
    return {
      shop: null,
      membership: null,
      error: new Error('Shop creation returned no shop.'),
    };
  }

  return {
    shop,
    membership: {
      shop_id: shop.id,
      user_id: user.id,
    },
    error: null,
  };
}