import useSWR from 'swr';
import { useEffect } from 'react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProducts() {
  const fetcher = async () => {
    try {
      const res = await api.request('getProducts');
      return (res?.products || []) as Product[];
    } catch (e) {
      console.error('SWR fetch error in getProducts:', e);
      throw e;
    }
  };

  const { data, error, isLoading, mutate } = useSWR('products', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    dedupingInterval: 60000,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    focusThrottleInterval: 60000,
  });

  // Realtime: only revalidate on INSERT/UPDATE/DELETE, not on every postgres event
  useEffect(() => {
    const channel = supabase.channel('realtime_products')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        () => mutate()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          // Optimistically patch local cache instead of full re-fetch
          mutate((current: any) => {
            if (!current) return current;
            return current.map((p: any) =>
              p.product_id === payload.new.product_id ? { ...p, ...payload.new } : p
            );
          }, { revalidate: false });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        () => mutate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  return {
    products: data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}
