export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  role: "user" | "admin";
  avatar_url?: string;
  created_at: string;
}

export interface ProductVariant {
  color: string;
  colorImage?: string;
  images?: string[];
  sizes: {
    size: string;
    stock: number;
    store_stock?: number;
    online_stock?: number;
  }[];
}

export interface Product {
  product_id: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  size: string;
  sizes?: string[];
  color: string;
  sub_category: string;
  price: number;
  discount_price: number;
  stock: number;
  store_stock?: number;
  online_stock?: number;
  image_url: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  variants?: ProductVariant[];
  video_url?: string;
  created_at: string;
  is_store_only?: boolean;
  sale_type?: 'Online' | 'Store';
}

export interface Category {
  category_id: string;
  category_name: string;
  image_url: string;
}

export interface CartItem {
  cart_id?: string;
  product_id: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  product?: Product;
}

export interface Order {
  order_id: string;
  user_id: string;
  products: string; // JSON string
  total_amount: number;
  payment_id: string;
  payment_status: string;
  order_status: string;
  address: string;
  date: string;
  created_at?: string;
  profiles?: {
    name: string;
    phone: string;
  };
}

export interface Review {
  review_id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link?: string;
  created_at: string;
}
