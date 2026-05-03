import useSWR from 'swr';
import { api } from '../services/api';
import { Product, Category, Offer } from '../types';

export function useHomeData() {
  const fetcher = async () => {
    try {
      // Fetch sequentially to prevent Supabase Auth LockManager timeouts on concurrent requests
      const productsData = await api.request('getProducts', { limit: 12 });
      const bestSellersData = await api.request('getBestSellers');
      const categoriesData = await api.request('getCategories');
      const offersData = []; // getOffers not implemented, use empty array

      const allProds = productsData?.products || [];
      const products = allProds.filter((p: any) => !p.sale_type || p.sale_type.toLowerCase() === 'online').slice(0, 12);

      const allBS = bestSellersData || [];
      const bestSellers = allBS.filter((p: any) => !p.sale_type || p.sale_type.toLowerCase() === 'online');

      const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || []);

      const offers = offersData || [];

      return { products, bestSellers, categories, offers };
    } catch (e) {
      console.error('SWR fetch error in getHomeData:', e);
      throw e;
    }
  };

  const { data, error, isLoading, mutate } = useSWR('home_data', fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateIfStale: true,
    dedupingInterval: 5000, // Reduced from 30s for more frequent sync
    errorRetryCount: 3,
  });

  return {
    products: data?.products || [],
    bestSellers: data?.bestSellers || [],
    categories: data?.categories || [],
    offers: data?.offers || [],
    isLoading,
    isError: !!error,
    mutate
  };
}
