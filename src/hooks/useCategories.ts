import useSWR from 'swr';
import { api } from '../services/api';
import { Category } from '../types';

export function useCategories() {
  const fetcher = async () => {
    const res = await api.request('getCategories');
    return Array.isArray(res) ? res as Category[] : (res.categories || []) as Category[];
  };

  const { data, error, isLoading, mutate } = useSWR('categories', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    categories: data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}
