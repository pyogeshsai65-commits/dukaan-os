import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createUserShop, getCurrentShopId, listUserShopsAndMemberships, setCurrentShopId } from '../services/shopService';
import { useAuth } from './AuthContext';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [shops, setShops] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [currentShopId, setCurrentShopIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshShops = async () => {
    if (!isAuthenticated || !user) {
      setShops([]);
      setMemberships([]);
      setCurrentShopIdState(null);
      setLoading(false);
      return { shops: [], memberships: [], currentShopId: null, error: null };
    }

    const result = await listUserShopsAndMemberships();

    if (result.error) {
      setError(String(result.error.message || result.error));
      setShops([]);
      setMemberships([]);
      setLoading(false);
      return { shops: [], memberships: [], currentShopId: null, error: result.error };
    }

    const nextMemberships = result.memberships || [];
    const nextShops = result.shops || [];
    setMemberships(nextMemberships);
    setShops(nextShops);

    let nextCurrentShopId = await getCurrentShopId();
    const ownsCurrentShop = !nextCurrentShopId || nextMemberships.some((membership) => String(membership.shop_id) === String(nextCurrentShopId));

    if (!ownsCurrentShop) {
      nextCurrentShopId = nextMemberships[0]?.shop_id ?? nextShops[0]?.id ?? null;
      if (nextCurrentShopId) {
        await setCurrentShopId(nextCurrentShopId);
      } else {
        await setCurrentShopId(null);
      }
    }

    setCurrentShopIdState(nextCurrentShopId ?? null);
    setError(null);
    setLoading(false);

    return {
      shops: nextShops,
      memberships: nextMemberships,
      currentShopId: nextCurrentShopId ?? null,
      error: null,
    };
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      setShops([]);
      setMemberships([]);
      setCurrentShopIdState(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function bootstrap() {
      if (!active) return;
      await refreshShops();
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated, user?.id]);

  const value = useMemo(() => ({
    shops,
    memberships,
    currentShopId,
    loading,
    error,
    isAuthenticated,
    refreshShops,
    createShop: async (payload = {}) => {
      const result = await createUserShop(payload);
      if (result.error) {
        setError(String(result.error.message || result.error));
        return result;
      }

      const nextShopId = result.shop?.id ?? null;
      if (nextShopId) {
        await setCurrentShopId(nextShopId);
        setCurrentShopIdState(nextShopId);
      }

      await refreshShops();
      return result;
    },
    selectShop: async (shopId) => {
      if (!shopId) {
        await setCurrentShopId(null);
        setCurrentShopIdState(null);
        return null;
      }

      const membershipMatches = memberships.some((membership) => String(membership.shop_id) === String(shopId));
      const shopExists = shops.some((shop) => String(shop.id) === String(shopId));

      if (!membershipMatches || !shopExists) {
        setError('That shop is not available to the authenticated user.');
        return null;
      }

      await setCurrentShopId(shopId);
      setCurrentShopIdState(String(shopId));
      setError(null);
      return String(shopId);
    },
  }), [shops, memberships, currentShopId, loading, error, isAuthenticated, user]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used inside ShopProvider');
  }
  return context;
}
