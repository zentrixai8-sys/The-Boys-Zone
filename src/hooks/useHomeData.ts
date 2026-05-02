import useSWR from 'swr';
import { api } from '../services/api';
import { Product, Category, Offer } from '../types';

export function useHomeData() {
  const fetcher = async () => {
    try {
      // Fetch sequentially to prevent Supabase Auth LockManager timeouts on concurrent requests
      const productsData = await api.request('getProducts', { limit: 12 }).catch(e => { console.error(e); return null; });
      const bestSellersData = await api.request('getBestSellers').catch(e => { console.error(e); return []; });
      const categoriesData = await api.request('getCategories').catch(e => { console.error(e); return []; });
      const offersData = await api.request('getOffers').catch(e => { console.error(e); return []; });

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
    dedupingInterval: 30000,
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
