import useSWR from 'swr';
import { api } from '../services/api';
import { Category } from '../types';

export function useCategories() {
  const fetcher = async () => {
    try {
      const res = await api.request('getCategories');
      return Array.isArray(res) ? (res as Category[]) : ((res?.categories || []) as Category[]);
    } catch (e) {
      console.error('SWR fetch error in getCategories:', e);
      throw e;
    }
  };

  const { data, error, isLoading, mutate } = useSWR('categories', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 300000, // 5 minutes — categories rarely change
  });

  return {
    categories: data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}
