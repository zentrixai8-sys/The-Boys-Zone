export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
}

export interface Product {
  product_id: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  price: number;
  discount_price: number;
  stock: number;
  image_url: string;
  created_at: string;
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
}

export interface Review {
  review_id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  date: string;
}
