import useSWR from 'swr';
import { useEffect } from 'react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProducts() {
  const fetcher = async () => {
    const res = await api.request('getProducts');
    return res.products as Product[];
  };

  const { data, error, isLoading, mutate } = useSWR('products', fetcher, {
    // SWR caching & revalidation options
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5 seconds
    focusThrottleInterval: 5000,
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
