import useSWR from 'swr';
import { api } from '../services/api';
import { Product, Category, Offer } from '../types';

export function useHomeData() {
  const fetcher = async () => {
    try {
      const [productsData, bestSellersData, categoriesData, offersData] = await Promise.all([
        api.request('getProducts', { limit: 12 }),
        api.request('getBestSellers'),
        api.request('getCategories'),
        api.request('getOffers').catch(() => []),
      ]);

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
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateIfStale: false,
    dedupingInterval: 120000,
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
