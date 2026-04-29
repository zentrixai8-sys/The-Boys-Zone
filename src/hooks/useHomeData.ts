import useSWR from 'swr';
import { api } from '../services/api';
import { Product, Category, Offer } from '../types';

export function useHomeData() {
  const fetcher = async () => {
    const [productsRes, bestSellersRes, categoriesRes, offersRes] = await Promise.allSettled([
      api.request('getProducts', { limit: 12 }),
      api.request('getBestSellers'),
      api.request('getCategories'),
      api.request('getOffers')
    ]);

    const allProds = productsRes.status === 'fulfilled' && productsRes.value.products 
      ? productsRes.value.products 
      : [];
    const products = allProds.filter((p: any) => !p.sale_type || p.sale_type.toLowerCase() === 'online').slice(0, 12);

    const allBS = bestSellersRes.status === 'fulfilled' ? (bestSellersRes.value || []) : [];
    const bestSellers = allBS.filter((p: any) => !p.sale_type || p.sale_type.toLowerCase() === 'online');

    const categories = categoriesRes.status === 'fulfilled' 
      ? (Array.isArray(categoriesRes.value) ? categoriesRes.value : (categoriesRes.value.categories || [])) 
      : [];

    const offers = offersRes.status === 'fulfilled' ? (offersRes.value || []) : [];

    return { products, bestSellers, categories, offers };
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
