import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProducts } from './pages/AdminProducts';
import { AdminInventory } from './pages/AdminInventory';
import { AdminOrders } from './pages/AdminOrders';
import { TodayReport } from './pages/TodayReport';
import { Setting } from './pages/Setting';
import { Billing } from './pages/Billing';
import { PendingPayments } from './pages/PendingPayments';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { OrderSuccess } from './pages/OrderSuccess';
import { AdminMaster } from './pages/AdminMaster';
import { ReturnPolicy } from './pages/ReturnPolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ShippingPolicy } from './pages/ShippingPolicy';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminSidebar } from './components/AdminSidebar';
import { CategoryBar } from './components/CategoryBar';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-indigo-400 rounded-full animate-spin-reverse opacity-30" />
      </div>
      <div className="mt-8 flex flex-col items-center">
        <h2 className="text-slate-900 text-lg font-black tracking-[0.2em] uppercase animate-pulse">The Boys Zone</h2>
        <div className="h-1 w-32 bg-slate-200 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-indigo-600 animate-shimmer-progress" />
        </div>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  
  return <>{children}</>;
};

const AppContent = () => {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/billing');

  useEffect(() => {
    if (isAdmin) {
      const channel = supabase
        .channel('admin-order-notifications')
        .on(
          'postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'orders' }, 
          (payload) => {
            toast.success(`New order received! Order ID: #${payload.new.order_id}`, {
              duration: 8000,
              icon: '🛍️',
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-indigo-400 rounded-full animate-spin-reverse opacity-30" />
      </div>
      <div className="mt-8 flex flex-col items-center">
        <h2 className="text-slate-900 text-lg font-black tracking-[0.2em] uppercase animate-pulse">The Boys Zone</h2>
        <div className="h-1 w-32 bg-slate-200 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-indigo-600 animate-shimmer-progress" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {!isAdminPath && (
        <>
          <Navbar />
          {location.pathname === '/products' && <CategoryBar />}
        </>
      )}
      {isAdminPath && <AdminSidebar />}
      <main className={isAdminPath ? 'md:pl-[260px] transition-all duration-300' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route path="/order-success" element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          } />
          
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute adminOnly>
              <AdminProducts />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventory" element={
            <ProtectedRoute adminOnly>
              <AdminInventory />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute adminOnly>
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/admin/today-report" element={
            <ProtectedRoute adminOnly>
              <TodayReport />
            </ProtectedRoute>
          } />
          <Route path="/admin/setting" element={
            <ProtectedRoute adminOnly>
              <Setting />
            </ProtectedRoute>
          } />
          <Route path="/admin/master" element={
            <ProtectedRoute adminOnly>
              <AdminMaster />
            </ProtectedRoute>
          } />
          
          <Route path="/billing" element={
            <ProtectedRoute adminOnly>
              <Billing />
            </ProtectedRoute>
          } />

          <Route path="/billing/pending-payments" element={
            <ProtectedRoute adminOnly>
              <PendingPayments />
            </ProtectedRoute>
          } />

          {/* Policy Pages */}
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
        </Routes>
        <footer className="bg-black text-white py-20 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src="https://i.ibb.co/Pvj8V4T7/Whats-App-Image-2026-02-26-at-2-40-25-PM.jpg" 
                    alt="The Boys Zone Logo" 
                    className="h-16 w-auto object-contain rounded-xl shadow-md"
                  />
                  <h2 className="text-3xl font-black tracking-tighter">THE BOYS ZONE</h2>
                </div>
                <p className="text-white/40 max-w-sm mb-8">
                  Your choice here. Premium menswear located in Suhela, in front of Bharat Petroleum.
                </p>
                <div className="space-y-4 text-sm text-white/60 mt-8">
                  <p className="flex items-start gap-3 group">
                    <MapPin className="w-5 h-5 text-white/40 group-hover:text-white transition-colors shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Suhela, In front of Bharat Petroleum,<br />
                      Main Road Suhela to Hathbandh,<br />
                      Baloda Bazar, Chhattisgarh 493195
                    </span>
                  </p>
                  <p className="flex items-center gap-3 group">
                    <Phone className="w-5 h-5 text-white/40 group-hover:text-white transition-colors shrink-0" />
                    <a href="tel:+919617628157" className="hover:text-white transition-colors">+91 9617628157</a>
                  </p>
                  <p className="flex items-center gap-3 group">
                    <Mail className="w-5 h-5 text-white/40 group-hover:text-white transition-colors shrink-0" />
                    <a href="mailto:theboyszone8@gmail.com" className="hover:text-white transition-colors">theboyszone8@gmail.com</a>
                  </p>
                  <p className="flex items-center gap-3 group">
                    <Instagram className="w-5 h-5 text-white/40 group-hover:text-pink-500 transition-colors shrink-0" />
                    <a href="https://instagram.com/theboyszone_suhela" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">@theboyszone_suhela</a>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Shop</h3>
                <ul className="space-y-4 text-white/40 text-sm">
                  <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
                  <li><Link to="/products?category=Shirts" className="hover:text-white transition-colors">Shirts</Link></li>
                  <li><Link to="/products?category=Pants" className="hover:text-white transition-colors">Pants</Link></li>
                  <li><Link to="/products?category=Accessories" className="hover:text-white transition-colors">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Support</h3>
                <ul className="space-y-4 text-white/40 text-sm">
                  <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link></li>
                  <li><Link to="/return-policy" className="hover:text-white transition-colors">Returns &amp; Exchanges</Link></li>
                  <li><Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/20 uppercase tracking-widest font-bold">
              <p>© 2026 THE BOYS ZONE. ALL RIGHTS RESERVED.</p>
              <div className="flex items-center gap-2">
                <span className="text-white/20">Powered By</span>
                <a 
                  href="https://zentrixs.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-white/5 hover:bg-white text-white hover:text-black px-4 py-1.5 rounded-full transition-all duration-500 border border-white/10 hover:shadow-glow-soft"
                >
                  zentrixs.in
                </a>
              </div>
              <div className="flex gap-8">
                <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
      
      <Toaster position="bottom-right" />
    </div>
  );
};

import { ScrollToTop } from './components/ScrollToTop';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
