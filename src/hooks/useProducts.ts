import useSWR from 'swr';
import { useEffect } from 'react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProducts() {
  const fetcher = async () => {
    try {
      const res = await api.request('getProducts');
      return res.products as Product[];
    } catch (e) {
      console.error('SWR fetch error in getProducts:', e);
      throw e;
    }
  };

  const { data, error, isLoading, mutate } = useSWR('products', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    revalidateOnMount: true,
    dedupingInterval: 2000, // Reduced from 5s to 2s for better responsiveness on back/forth
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    focusThrottleInterval: 2000,
  });

  // Setup Supabase Realtime for instant UI updates
  useEffect(() => {
    const channel = supabase.channel('realtime_products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Product changed!', payload);
          // Optimistically update or trigger re-fetch
          mutate(); // Re-fetch all to ensure related tables (like ratings) are consistent
        }
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
