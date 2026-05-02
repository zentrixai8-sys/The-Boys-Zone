import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Search, Loader2, Save, User as UserIcon, Phone, MapPin, ChevronDown, UserPlus, Download, X, Package, Clock } from 'lucide-react';
import { formatPrice, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { api } from '../services/api';

import jsPDF from 'jspdf';

const subCategoryMap: Record<string, string[]> = {
  'Shirt':       ['Casual', 'Formal', 'Denim', 'Checkered', 'Printed', 'Party Wear'],
  'T-Shirt':     ['Round Neck', 'Polo', 'Oversized', 'Graphic', 'Full Sleeve'],
  'Jeans':       ['Skinny', 'Slim', 'Straight', 'Relaxed', 'Baggy', 'Distressed'],
  'Pant':        ['Chinos', 'Formal', 'Cargo', 'Joggers', 'Cotton Pants'],
  'Pants':       ['Chinos', 'Formal', 'Cargo', 'Joggers', 'Cotton Pants'],
  'Accessories': ['Belts', 'Wallets', 'Watches', 'Sunglasses', 'Perfumes', 'Caps', 'Undergarments', 'Socks', 'Bracelets', 'Key Rings'],
  'Footwear':    ['Sneakers', 'Formal Shoes', 'Sandals', 'Loafers', 'Boots', 'Flip-Flops'],
  'Shoes':       ['Sneakers', 'Formal Shoes', 'Sandals', 'Loafers', 'Boots', 'Flip-Flops'],
};

const categorySizeMap: Record<string, string[]> = {
  'Shirt':       ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
  'T-Shirt':     ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
  'Jeans':       ['28', '30', '32', '34', '36', '38', '40'],
  'Pant':        ['28', '30', '32', '34', '36', '38', '40'],
  'Pants':       ['28', '30', '32', '34', '36', '38', '40'],
  'Footwear':    ['6', '7', '8', '9', '10', '11'],
  'Shoes':       ['6', '7', '8', '9', '10', '11'],
  'Accessories': ['Free Size'],
};

interface BillItem {
  id: string;
  productId?: string;
  category: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
}

export const Billing = () => {
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customers, setCustomers] = useState<{id: string, name: string, mobile: string, address: string}[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedSize, setSelectedSize] = useState('');
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  
  const [items, setItems] = useState<BillItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Mixed' | 'Pending'>('Cash');
  const [cashPart, setCashPart] = useState('');
  const [upiPart, setUpiPart] = useState('');
  const [salesChannel, setSalesChannel] = useState<'Store' | 'Online'>('Store');
  const [todayLogs, setTodayLogs] = useState<{ id: string, customer: string, mobile: string, time: string, total: number, itemsCount: number, pdf_url: string | null, payment_method?: string }[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [customerDue, setCustomerDue] = useState<number>(0);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await api.request('getCustomers');
        setCustomers(data || []);
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    const loadTodaysSales = async () => {
      try {
        const logs = await api.request('getTodaysSales');
        if (logs && logs.length > 0) {
          setTodayLogs(logs);
        }
      } catch (err) {
        console.error('Failed to load today\'s sales:', err);
      }
    };
    loadTodaysSales();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      // Instant Hydration
      try {
        const cached = sessionStorage.getItem('tbz_shop_cache');
        if (cached) {
          const { products } = JSON.parse(cached);
          if (products) setAllProducts(products);
        }
      } catch (e) {}

      try {
        const res = await api.request('getProducts');
        setAllProducts(res.products || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    };
    loadProducts();
  }, []); // Only load on mount, or after a specific trigger

  const handleDropdownSelect = (id: string) => {
    setSelectedCustomerId(id);
    setIsDropdownOpen(false);
    
    if (id === 'walk-in') {
      setAddress('');
      setIsCreatingCustomer(false);
      setCustomerSearchQuery('Walk-in Customer');
    } else if (id === 'create-new') {
      setCustomerName(customerSearchQuery);
      setMobile('');
      setAddress('');
      setIsCreatingCustomer(true);
    } else {
      const customer = customers.find(c => c.id === id);
      if (customer) {
        setCustomerName(customer.name);
        setMobile(customer.mobile);
        setAddress(customer.address || '');
        setIsCreatingCustomer(false);
        setCustomerSearchQuery(customer.name);
      }
    }
  };

  useEffect(() => {
    const loadDue = async () => {
      if (mobile && mobile.length >= 10) {
        try {
          const allPending = await api.request('getPendingPayments');
          const due = (allPending || []).reduce((sum: number, p: any) => {
            if (p.customer_mobile === mobile && p.status === 'pending') {
              return sum + (Number(p.total_amount) || 0);
            }
            return sum;
          }, 0);
          setCustomerDue(due);
        } catch (err) {
          console.error('Failed to load due amount:', err);
          setCustomerDue(0);
        }
      } else {
        setCustomerDue(0);
      }
    };
    loadDue();
  }, [mobile]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
    c.mobile.includes(customerSearchQuery)
  );

  useEffect(() => {
    if (category && productName) {
      const match = allProducts.filter(p => 
        (p.category || '').trim().toLowerCase() === category.trim().toLowerCase() && 
        (p.sub_category || '').trim().toLowerCase() === productName.trim().toLowerCase()
      );
      
      // Priority 1: Sizes from database variants
      const dbSizes = new Set<string>();
      match.forEach(p => {
        (p.variants || []).forEach((v: any) => {
          (v.sizes || []).forEach((s: any) => {
            if (s.size) dbSizes.add(String(s.size));
          });
        });
      });

      // Priority 2: Fallback to category map if no DB sizes found
      if (dbSizes.size > 0) {
        setAvailableSizes(Array.from(dbSizes).sort());
      } else if (category && categorySizeMap[category]) {
        setAvailableSizes(categorySizeMap[category]);
      } else {
        setAvailableSizes([]);
      }

      if (match.length > 0) {
        // Sum stock across ALL matching products
        const totalMatchingStock = match.reduce((acc, product) => {
          const variants = product.variants || [];
          const hasSizes = variants.some((v: any) => v.sizes && v.sizes.length > 0);
          
          if (variants.length === 0 || !hasSizes) {
            return acc + (Number(product.stock) || 0);
          } else {
            const productStock = variants.reduce((vSum: number, v: any) => {
              const sizeSum = (v.sizes || []).reduce((sSum: number, s: any) => {
                // Case-insensitive & trimmed size comparison
                if (selectedSize && String(s.size).trim().toLowerCase() !== String(selectedSize).trim().toLowerCase()) {
                  return sSum;
                }
                const val = salesChannel === 'Store' 
                  ? (s.store_stock ?? (s.online_stock !== undefined ? 0 : s.stock ?? 0)) 
                  : (s.online_stock ?? (s.store_stock !== undefined ? 0 : s.stock ?? 0));
                return sSum + Number(val || 0);
              }, 0);
              return vSum + sizeSum;
            }, 0);
            return acc + productStock;
          }
        }, 0);

        setCurrentStock(totalMatchingStock);
      } else {
        setCurrentStock(0);
      }
    } else {
      setCurrentStock(null);
      setAvailableSizes([]);
      setSelectedSize('');
    }
  }, [category, productName, allProducts, salesChannel, selectedSize]);

  const handleAddItem = () => {
    if (!category || !productName || !price || !quantity) {
      toast.error('Please fill all item details');
      return;
    }

    // Find the first matching product to get its ID for accurate stock deduction
    const targetProduct = allProducts.find(p => 
      (p.category || '').toLowerCase() === category.toLowerCase() && 
      (p.sub_category || '').toLowerCase() === productName.toLowerCase()
    );

    const newItem: BillItem = {
      id: Date.now().toString(),
      productId: targetProduct?.product_id,
      category,
      productName: selectedSize ? `${productName} (Size: ${selectedSize})` : productName,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      size: selectedSize
    };

    setItems([...items, newItem]);
    setProductName('');
    setPrice('');
    setQuantity('1');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(5);

  useEffect(() => {
    const loadGstSettings = async () => {
      // 1. Try local storage first for instant load
      const enabled = localStorage.getItem('gstEnabled') === 'true';
      const percent = localStorage.getItem('gstPercentage');
      setGstEnabled(enabled);
      if (percent) setGstPercentage(Number(percent));

      // 2. Fetch from Supabase Auth metadata for cross-device sync
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          if (user.user_metadata.gstEnabled !== undefined) {
            setGstEnabled(user.user_metadata.gstEnabled);
            localStorage.setItem('gstEnabled', String(user.user_metadata.gstEnabled));
          }
          if (user.user_metadata.gstPercentage !== undefined) {
            setGstPercentage(user.user_metadata.gstPercentage);
            localStorage.setItem('gstPercentage', String(user.user_metadata.gstPercentage));
          }
        }
      } catch (err) {
        console.error('Failed to sync GST settings from cloud', err);
      }
    };
    loadGstSettings();
  }, []);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = gstEnabled ? (subtotal * (gstPercentage / 100)) : 0;
  const total = subtotal + tax;

  const handleSave = async () => {
    if (isProcessing) return;
    if (items.length === 0) {
      toast.error('Please add items to bill first');
      return;
    }

    if (isCreatingCustomer) {
      if (!customerName || !mobile || !address) {
        toast.error('Please fill all customer details (Name, Mobile, Address) to create a new customer');
        return;
      }
    }

    setIsProcessing(true);

    // Make it feel instant by clearing the form immediately
    toast.success('Sale logged successfully');
    setItems([]);
    setCustomerName('');
    setMobile('');
    setAddress('');
    setSelectedCustomerId('');
    setIsCreatingCustomer(false);
    setCategory('');
    setProductName('');
    setPrice('');
    setQuantity('1');
    setCashPart('');
    setUpiPart('');
    setShowInvoiceModal(false);

    // Process heavy tasks (PDF generation, stock check, upload) in background
    (async () => {
      try {
        // ── Stock check: warn if any item is 0-stock in store inventory ──
        try {
          const prodRes = await api.request('getProducts');
          const allProducts: any[] = prodRes.products || [];
          const outOfStockWarnings: string[] = [];
          items.forEach(item => {
            const match = allProducts.find(
              p => p.title?.toLowerCase() === item.productName?.toLowerCase() ||
                   p.title?.toLowerCase().includes(item.productName?.toLowerCase())
            );
            if (match && (match.stock === 0 || match.stock === null || match.stock === undefined)) {
              outOfStockWarnings.push(item.productName);
            }
          });
          if (outOfStockWarnings.length > 0) {
            toast(
              `⚠️ Low/Zero stock for: ${outOfStockWarnings.join(', ')}. Billing will still proceed.`,
              { duration: 5000, icon: '⚠️', style: { background: '#7c2d12', color: '#fef3c7', fontWeight: 'bold' } }
            );
          }
        } catch (_) { /* non-blocking */ }

        if (isCreatingCustomer) {
          // Create customer in DB
          const newCustomer = await api.request('createCustomer', {
             name: customerName,
             mobile,
             address
          });
          
          setCustomers(prev => [...prev, newCustomer]);
        }

      // 1. Generate PDF programmatically (avoids html2canvas oklab CSS parsing errors)
      let pdfUrl = null;
      
      {
        // ── Load logo ────────────────────────────────────────────────
        let logoDataUrl: string | null = null;
        try {
          const resp = await fetch('https://i.ibb.co/Pvj8V4T7/Whats-App-Image-2026-02-26-at-2-40-25-PM.jpg');
          const blob = await resp.blob();
          logoDataUrl = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (_) { /* logo optional */ }

        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const W = 210;
        const margin = 14;
        let y = 0;

        // ── Colour Palette ────────────────────────────────────────────
        const BRAND   = [30, 80, 160]  as [number,number,number]; // medium navy blue
        const ACCENT  = [59, 130, 246] as [number,number,number]; // blue
        const WHITE   = [255,255,255]  as [number,number,number];
        const GRAY    = [100,116,139]  as [number,number,number];
        const LIGHT   = [241,245,249]  as [number,number,number];
        const BLACK   = [15, 23, 42]   as [number,number,number];
        const GREEN   = [5, 150, 105]  as [number,number,number];

        // ── Header Band ───────────────────────────────────────────────
        doc.setFillColor(...BRAND);
        doc.rect(0, 0, W, 42, 'F');

        // Logo
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'JPEG', margin, 6, 24, 24);
        }

        // Store name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(...WHITE);
        doc.text("BOY'S ZONE", margin + (logoDataUrl ? 28 : 0), 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(180, 200, 240);
        doc.text('Near Ripusudan Petrol Pump Suhela, Baloda Bazar CG', margin + (logoDataUrl ? 28 : 0), 25);
        doc.text('Contact us on WhatsApp or call +91 9617628157 within 2 days of receiving your order.', margin + (logoDataUrl ? 28 : 0), 31);

        // INVOICE label + date (top-right of band)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246);
        doc.text('INVOICE', W - margin, 16, { align: 'right' });

        const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = new Date().toLocaleTimeString();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(180, 200, 240);
        doc.text(`Date: ${dateStr}`, W - margin, 25, { align: 'right' });
        doc.text(`Time: ${timeStr}`, W - margin, 31, { align: 'right' });

        y = 50;

        // ── Billed To card ────────────────────────────────────────────
        doc.setFillColor(...LIGHT);
        doc.roundedRect(margin, y, 90, 28, 3, 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...ACCENT);
        doc.text('BILLED TO', margin + 4, y + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...BLACK);
        doc.text(customerName || 'Walk-in Customer', margin + 4, y + 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...GRAY);
        if (mobile) doc.text(`Ph: ${mobile}`, margin + 4, y + 20);
        if (address) doc.text(address, margin + 4, y + 26);

        y += 36;

        // ── Items Table ───────────────────────────────────────────────
        // Header row
        doc.setFillColor(...BRAND);
        doc.rect(margin, y, W - margin * 2, 9, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...WHITE);
        const col = { item: margin + 3, cat: 80, qty: 130, unit: 155, total: W - margin - 2 };
        doc.text('ITEM DESCRIPTION', col.item, y + 6);
        doc.text('CATEGORY',         col.cat,  y + 6);
        doc.text('QTY',  col.qty,  y + 6, { align: 'center' });
        doc.text('UNIT PRICE', col.unit,  y + 6, { align: 'right' });
        doc.text('TOTAL',      col.total, y + 6, { align: 'right' });
        y += 10;

        // Item rows
        items.forEach((item, idx) => {
          // Calculate height needed for this row (text wrapping)
          const productName = item.productName || '';
          const splitTitle = doc.splitTextToSize(productName, 60); // Wrap within 60mm
          const rowHeight = Math.max(8, splitTitle.length * 5);

          if (idx % 2 === 0) {
            doc.setFillColor(...LIGHT);
            doc.rect(margin, y - 1, W - margin * 2, rowHeight, 'F');
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...BLACK);
          doc.text(splitTitle, col.item, y + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...GRAY);
          doc.text(item.category || '', col.cat, y + 4.5);
          doc.text(String(item.quantity || 0), col.qty, y + 4.5, { align: 'center' });
          doc.text(`Rs.${(item.price || 0).toFixed(2)}`, col.unit, y + 4.5, { align: 'right' });

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...BLACK);
          doc.text(`Rs.${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`, col.total, y + 4.5, { align: 'right' });
          
          y += rowHeight;

          // Check for page break
          if (y > 260) {
            doc.addPage();
            y = 20;
            // Redraw header if needed or just continue
          }
        });

        y += 6;

        // ── Totals ────────────────────────────────────────────────────
        const totW = 82;
        const totX = W - margin - totW;

        // Subtotal + Tax rows
        doc.setFillColor(...LIGHT);
        doc.roundedRect(totX, y, totW, 18, 2, 2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        doc.text('Subtotal',      totX + 4,  y + 6);
        doc.text(`Tax / GST (${gstEnabled ? gstPercentage : 0}%)`, totX + 4, y + 13);
        doc.setTextColor(...BLACK);
        doc.text(`Rs.${subtotal.toFixed(2)}`, W - margin - 2, y + 6,  { align: 'right' });
        doc.text(`Rs.${tax.toFixed(2)}`,      W - margin - 2, y + 13, { align: 'right' });
        y += 20;

        // Grand Total band
        doc.setFillColor(...GREEN);
        doc.roundedRect(totX, y, totW, 12, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...WHITE);
        doc.text('TOTAL',                      totX + 4,       y + 8);
        doc.text(`Rs.${total.toFixed(2)}`, W - margin - 2, y + 8, { align: 'right' });
        y += 20;

        // ── Footer ────────────────────────────────────────────────────
        doc.setFillColor(...BRAND);
        doc.rect(0, y, W, 22, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...WHITE);
        doc.text('Thank you for shopping with us!', W / 2, y + 8, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(180, 200, 240);
        doc.text('Exchange within 2 Days with original tags & invoice. | Developed & Powered by Zentrix (zentrix-dv.vercel.app)', W / 2, y + 15, { align: 'center' });

        const pdfBlob = doc.output('blob');

        // 2. Create an in-memory blob URL immediately (works even if upload fails)
        const blobUrl = window.URL.createObjectURL(pdfBlob);
        pdfUrl = blobUrl; // use as fallback

        // 3. Try uploading to Supabase Storage for persistence
        const fileName = `invoices/INV-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        try {
          const uploadedUrl = await api.request('uploadFile', { 
            file, 
            bucket: 'products', 
            path: fileName 
          });
          if (uploadedUrl) {
            pdfUrl = uploadedUrl; // prefer the permanent Supabase URL
            window.URL.revokeObjectURL(blobUrl); // free memory since we have the real URL
          }
          console.log("PDF uploaded:", pdfUrl);
        } catch (uploadError) {
          console.error("Supabase upload failed, using blob URL:", uploadError);
          // pdfUrl stays as blobUrl – View/Download will still work this session
        }
      }

      // Save sale to database
      await api.request('createStoreSale', {
        customer_name: customerName || 'Walk-in',
        customer_mobile: mobile || 'N/A',
        items: items,
        total: total,
        pdf_url: pdfUrl,
        sales_channel: salesChannel,
        payment_method: paymentMethod,
        cash_part: paymentMethod === 'Mixed' ? (parseFloat(cashPart) || 0) : null,
        upi_part: paymentMethod === 'Mixed' ? (parseFloat(upiPart) || 0) : null,
      });

      // If payment is Pending → also store in pending_payments table for follow-up
      if (paymentMethod === 'Pending') {
        const invoiceId = `INV-${Date.now()}`;
        const itemsSummary = items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
        await api.request('createPendingPayment', {
          invoice_id: invoiceId,
          customer_name: customerName || 'Walk-in',
          customer_mobile: mobile || 'N/A',
          total_amount: total,
          items_summary: itemsSummary,
        });
        toast('⏳ Pending payment recorded for follow-up!', { duration: 4000 });
      }
      
      // ── Stock deduction is now handled automatically by the API ──
      // This ensures better performance and consistency.

      const newLog = {
        id: Date.now().toString(),
        customer: customerName || 'Walk-in',
        mobile: mobile || 'N/A',
        time: new Date().toLocaleTimeString(),
        total: total,
        itemsCount: items.length,
        pdf_url: pdfUrl,
        payment_method: paymentMethod
      };
      setTodayLogs(prev => [newLog, ...prev]);

      // 4. Force immediate download if save was successful (DISABLED BY USER REQUEST)
      /*
      if (pdfUrl) {
         const link = document.createElement('a');
         link.href = pdfUrl;
         link.download = `Invoice_${customerName || 'Customer'}_${Date.now()}.pdf`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
      }
      */

      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to log sale in database. (Check internet)');
      setIsProcessing(false);
    }
  })();
  };

  const handlePrint = () => {
    if (items.length === 0) {
      toast.error('Please add items to bill first');
      return;
    }
    window.print();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the current bill?')) {
      setItems([]);
      setCustomerName('');
      setMobile('');
      setAddress('');
      setSelectedCustomerId('');
      setIsCreatingCustomer(false);
      setCategory('');
      setProductName('');
      setPrice('');
      setQuantity('1');
      setCashPart('');
      setUpiPart('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 print:hidden">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black mb-2">Store Billing</h1>
          <p className="text-black/40">Point of sale for walk-in customers</p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4 w-full sm:w-auto">
          <button onClick={handleClear} disabled={isProcessing} className="px-4 sm:px-6 py-3 rounded-2xl font-bold border-2 border-black/10 hover:bg-black/5 transition-all text-sm disabled:opacity-50">
            Clear Bill
          </button>
          <button onClick={handleSave} disabled={isProcessing || items.length === 0} className="bg-emerald-600 text-white px-4 sm:px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isProcessing ? 'Saving...' : 'Save Bill'}
          </button>
        </div>
      </div>

      {/* Invoice Print Layout (Visible inside Modal but always in DOM for PDF generation) */}
      <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:block ${showInvoiceModal ? '' : 'hidden'}`}>
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl print:shadow-none print:max-h-none print:w-full print:rounded-none">
            
            <div className="sticky top-0 bg-white border-b border-black/10 p-4 flex justify-between items-center z-10 print:hidden">
              <h3 className="font-bold text-lg">Invoice Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-colors">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isProcessing ? 'Generating...' : 'Save & Download PDF'}
                </button>
                <button onClick={() => setShowInvoiceModal(false)} className="p-2 ml-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="print-area" className="flex flex-col bg-white text-black p-5 w-full print:w-full print:p-0">
              {/* ── Blue Header Band ── */}
              <div className="rounded-xl overflow-hidden mb-5" style={{background:'linear-gradient(135deg,#1e50a0,#2563eb)'}}>
                <div className="flex justify-between items-center px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src="https://i.ibb.co/Pvj8V4T7/Whats-App-Image-2026-02-26-at-2-40-25-PM.jpg"
                      alt="logo" className="w-11 h-11 rounded-lg object-cover border-2 border-white/30"
                      onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <div>
                      <h1 className="text-lg font-black text-white tracking-wide">BOY'S ZONE</h1>
                      <p className="text-blue-200 text-[10px]">Near Ripusudan Petrol Pump Suhela, Baloda Bazar CG</p>
                      <p className="text-blue-200 text-[10px]">Ph: +91 9617628157</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-300 text-[9px] font-bold uppercase tracking-widest">Tax Invoice</div>
                    <div className="text-white font-bold text-sm mt-1">{formatDate(new Date())}</div>
                    <div className="text-blue-200 text-[10px]">{new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>

              {/* ── Billed To + Total Due ── */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500 mb-1">Billed To</p>
                  <p className="font-black text-slate-800 text-sm">{customerName || 'Walk-in Customer'}</p>
                  {mobile && <p className="text-xs text-slate-500 mt-0.5">📞 {mobile}</p>}
                  {address && <p className="text-xs text-slate-500">{address}</p>}
                </div>
                <div className="rounded-xl px-4 py-3 flex flex-col justify-center text-center min-w-[110px]" style={{background:'#2563eb'}}>
                  <p className="text-blue-200 text-[9px] font-bold uppercase tracking-widest">Total Due</p>
                  <p className="text-white font-black text-xl mt-0.5">{formatPrice(total)}</p>
                </div>
              </div>

              {/* ── Items Table ── */}
              <table className="w-full text-left border-collapse mb-4">
                <thead>
                  <tr style={{background:'#1e293b'}}>
                    <th className="py-2.5 px-3 text-white text-[10px] font-bold uppercase tracking-widest rounded-tl-lg">Item</th>
                    <th className="py-2.5 px-3 text-white text-[10px] font-bold uppercase text-center">Qty</th>
                    <th className="py-2.5 px-3 text-white text-[10px] font-bold uppercase text-right">Price</th>
                    <th className="py-2.5 px-3 text-white text-[10px] font-bold uppercase text-right rounded-tr-lg">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2.5 px-3 border-b border-slate-100">
                        <div className="font-bold text-slate-800 text-sm">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">{item.category}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center border-b border-slate-100">
                        <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2 py-0.5 rounded">{item.quantity}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 text-sm border-b border-slate-100">{formatPrice(item.price)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 text-sm border-b border-slate-100">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Totals ── */}
              <div className="flex justify-end mb-5">
                <div className="w-60 rounded-xl overflow-hidden border border-slate-100">
                  <div className="flex justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs text-slate-500">Subtotal</span>
                    <span className="text-xs font-bold text-slate-700">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs text-slate-500">GST / Tax ({gstEnabled ? gstPercentage : 0}%)</span>
                    <span className="text-xs font-bold text-slate-700">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3" style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                    <span className="text-white font-black text-sm">TOTAL</span>
                    <span className="text-white font-black text-sm">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="rounded-xl overflow-hidden" style={{background:'linear-gradient(135deg,#1e50a0,#2563eb)'}}>
                <div className="px-5 py-3 text-center">
                  <p className="text-white font-black text-xs">🙏 Thank you for shopping with us!</p>
                  <p className="text-blue-200 text-[10px] mt-0.5">Exchange within 2 days with original tags & invoice. | Powered by <span className="text-white font-bold">Zentrix</span></p>
                </div>
              </div>

            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          
          {/* Customer Details */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black/5 pb-6">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                 <UserIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Client Details</h2>
                  <p className="text-sm font-bold text-blue-500">Customer Information</p>
                </div>
                {customerDue > 0 && (
                  <div className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl flex flex-col items-end">
                    <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Amount Due</span>
                    <span className="text-sm font-black text-red-600">{formatPrice(customerDue)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <div className="relative z-50">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Client Name *</label>
                
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Client..."
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      setSelectedCustomerId('');
                      if (!e.target.value) {
                        setCustomerName('');
                        setMobile('');
                        setAddress('');
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-black/10 z-50 overflow-hidden flex flex-col max-h-[300px] py-2">
                      {customerSearchQuery.trim() === '' && (
                        <div className="px-2 pb-2 mb-2 border-b border-black/5">
                          <button
                            type="button"
                            onClick={() => handleDropdownSelect('walk-in')}
                            className="w-full text-left px-3 py-3 text-sm rounded-xl hover:bg-slate-50 font-bold transition-colors text-slate-700"
                          >
                            Walk-in Customer
                          </button>
                        </div>
                      )}
                      
                      {filteredCustomers.length > 0 ? (
                        <div className="overflow-y-auto px-2">
                          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Saved Customers</div>
                          {filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleDropdownSelect(c.id)}
                              className="w-full text-left px-3 py-3 text-sm rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center"
                            >
                              <span className="font-bold text-slate-800 truncate pr-2">{c.name}</span>
                              <span className="text-slate-400 text-xs shrink-0">{c.mobile}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center bg-white">
                          <p className="text-sm font-medium text-slate-400 mb-4">No existing match.</p>
                          <button
                            type="button"
                            onClick={() => handleDropdownSelect('create-new')}
                            className="bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto shadow-sm shadow-indigo-200"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add New Client: "{customerSearchQuery}"
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Contact Number</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210" 
                      readOnly={selectedCustomerId !== 'walk-in' && selectedCustomerId !== 'create-new' && selectedCustomerId !== ''}
                      className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all ${selectedCustomerId !== 'walk-in' && selectedCustomerId !== 'create-new' && selectedCustomerId !== '' ? 'opacity-70 bg-slate-50' : ''}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="City/Area" 
                      readOnly={selectedCustomerId !== 'walk-in' && selectedCustomerId !== 'create-new' && selectedCustomerId !== ''}
                      className={`w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all ${selectedCustomerId !== 'walk-in' && selectedCustomerId !== 'create-new' && selectedCustomerId !== '' ? 'opacity-70 bg-slate-50' : ''}`}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Add Item Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Item</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setSalesChannel('Store')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${salesChannel === 'Store' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Store
                </button>
                <button
                  onClick={() => setSalesChannel('Online')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${salesChannel === 'Online' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Online
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Category</label>
                <select 
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setProductName(''); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black font-medium transition-all"
                >
                  <option value="">Select Category...</option>
                  <option value="Shirt">Shirt</option>
                  <option value="T-Shirt">T-Shirt</option>
                  <option value="Pant">Pant</option>
                  <option value="Jeans">Jeans</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Footwear">Footwear</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Product Name / Description</label>
                {category && subCategoryMap[category] ? (
                  <select 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black font-medium transition-all"
                  >
                    <option value="">Select Product Description...</option>
                    {subCategoryMap[category].map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={category ? `Enter ${category} details...` : "Select category first"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black font-medium transition-all"
                  />
                )}
              </div>

              {availableSizes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 block">Select Size</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-5 py-2.5 rounded-xl border-2 font-black text-sm transition-all duration-200 ${
                          selectedSize === s 
                            ? 'bg-black text-white border-black shadow-lg shadow-black/20 scale-105' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-black hover:text-black'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {currentStock !== null && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 ${currentStock > 10 ? (salesChannel === 'Store' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700') : currentStock > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                   <div className="flex items-center gap-2">
                     <Package className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{salesChannel} Stock Available</span>
                   </div>
                   <span className="text-lg font-black">{currentStock} Pcs</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Price (₹)</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Quantity</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black font-medium transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={handleAddItem}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center hover:bg-black transition-all mt-2 shadow-lg shadow-slate-200"
              >
                <Plus className="w-5 h-5 mb-1" /> Add to Bill
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">💳 Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['Cash', 'UPI', 'Mixed', 'Pending'] as const).map((method) => {
                const icons: Record<string, string> = { Cash: '💵', UPI: '📱', Mixed: '🔀', Pending: '⏳' };
                const colors: Record<string, string> = {
                  Cash: paymentMethod === method ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
                  UPI: paymentMethod === method ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-100' : 'border-blue-200 text-blue-700 hover:bg-blue-50',
                  Mixed: paymentMethod === method ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-100' : 'border-violet-200 text-violet-700 hover:bg-violet-50',
                  Pending: paymentMethod === method ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100' : 'border-amber-200 text-amber-700 hover:bg-amber-50',
                };
                return (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200 ${colors[method]}`}
                  >
                    <span>{icons[method]}</span> {method}
                  </button>
                );
              })}
            </div>

            {/* Mixed Split Inputs — shown only when Mixed is selected */}
            {paymentMethod === 'Mixed' && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1.5 block">💵 Cash Part</label>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={cashPart}
                        onChange={(e) => setCashPart(e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-emerald-900 font-black text-lg focus:outline-none border-b-2 border-emerald-300 focus:border-emerald-500 pb-0.5"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-700 mb-1.5 block">📱 UPI Part</label>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={upiPart}
                        onChange={(e) => setUpiPart(e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-blue-900 font-black text-lg focus:outline-none border-b-2 border-blue-300 focus:border-blue-500 pb-0.5"
                      />
                    </div>
                  </div>
                </div>
                {/* Balance indicator */}
                {(() => {
                  const c = parseFloat(cashPart) || 0;
                  const u = parseFloat(upiPart) || 0;
                  const balanced = Math.abs((c + u) - total) < 0.01 && total > 0;
                  const diff = total - (c + u);
                  return (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
                      balanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      (c + u) > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-black/5 text-black/40'
                    }`}>
                      {balanced ? (
                        <><span>✅</span> SPLIT BALANCED CORRECTLY</>
                      ) : (c + u) > 0 ? (
                        <><span>⚠️</span> {diff > 0 ? `₹${diff.toFixed(2)} remaining` : `₹${Math.abs(diff).toFixed(2)} over total`}</>
                      ) : (
                        <><span>ℹ️</span> Enter Cash + UPI amounts above</>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
              <Clock className="w-5 h-5" />
              <h3>Return Window</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We accept return and exchange requests within <strong className="text-black">2 days</strong> of the delivery date for online orders.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              For in-store purchases, exchange requests must be made within <strong className="text-black">2 days</strong> of purchase with the original receipt.
            </p>
          </div>

        </div>

        {/* Right Column: Bill Summary & Print View */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col h-fit">
            <h2 className="text-xl font-bold mb-6 print:hidden">Current Bill Items</h2>
            
            <div className="w-full">
              {items.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-black/40 print:hidden">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-bold text-center">No items added to bill yet.</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-black/10 text-xs font-bold uppercase tracking-widest text-black/40">
                          <th className="py-4">Item</th>
                          <th className="py-4">Category</th>
                          <th className="py-4 text-center">Qty</th>
                          <th className="py-4 text-right">Price</th>
                          <th className="py-4 text-right">Total</th>
                          <th className="py-4 text-center print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {items.map(item => (
                          <tr key={item.id}>
                            <td className="py-4 font-bold">{item.productName}</td>
                            <td className="py-4 text-sm text-black/60">{item.category}</td>
                            <td className="py-4 text-center font-bold">{item.quantity}</td>
                            <td className="py-4 text-right">{formatPrice(item.price)}</td>
                            <td className="py-4 text-right font-bold">{formatPrice(item.price * item.quantity)}</td>
                            <td className="py-4 text-center print:hidden">
                              <button onClick={() => removeItem(item.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors inline-block">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-4 pt-2">
                    {items.map(item => (
                      <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-black/5 space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{item.productName}</p>
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{item.category}</p>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 bg-red-50 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center border-t border-black/5 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-black/5">QTY: {item.quantity}</span>
                            <span className="text-xs font-medium text-slate-400">@ {formatPrice(item.price)}</span>
                          </div>
                          <span className="font-black text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-black/10 space-y-3">
              <div className="flex justify-between text-sm font-bold text-black/60 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-black">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-black/60 uppercase tracking-widest">
                <span>Tax / GST ({gstEnabled ? gstPercentage : 0}%)</span>
                <span className="text-black">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-2xl font-black pt-4 border-t border-black/5">
                <span>Total Amount</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            
          </div>
        </div>
      </div>

      {/* Today's Log Section */}
      <div className="mt-12 bg-white p-6 rounded-3xl border border-black/5 shadow-sm print:hidden">
        <h2 className="text-xl font-bold mb-6">Today's Bills Log</h2>
        {todayLogs.length === 0 ? (
          <div className="text-center py-8 text-black/40 font-bold">No bills generated today yet.</div>
        ) : (
          <div className="w-full">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black/10 text-xs font-bold uppercase tracking-widest text-black/40">
                    <th className="py-4 px-4">Time</th>
                    <th className="py-4 px-4">Customer</th>
                    <th className="py-4 px-4 text-center">Payment</th>
                    <th className="py-4 px-4 text-center">Items</th>
                    <th className="py-4 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {todayLogs.map(log => (
                    <tr key={log.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-4 px-4 font-bold text-sm tracking-widest">{log.time}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold">{log.customer}</div>
                        {log.mobile !== 'N/A' && <div className="text-xs text-black/60 font-medium">{log.mobile}</div>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {(() => {
                          const m = log.payment_method || 'Cash';
                          const badge: Record<string, string> = {
                            Cash: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                            UPI: 'bg-blue-50 text-blue-700 border border-blue-200',
                            Mixed: 'bg-violet-50 text-violet-700 border border-violet-200',
                            Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
                          };
                          const icon: Record<string, string> = { Cash: '💵', UPI: '📱', Mixed: '🔀', Pending: '⏳' };
                          return (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${badge[m] || badge['Cash']}`}>
                              {icon[m]} {m}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-4 text-center font-bold bg-black/5 rounded-xl">{log.itemsCount}</td>
                      <td className="py-4 px-4 min-w-[150px]">
                        <div className="flex flex-col items-end gap-2">
                          <div className="font-black text-emerald-600 text-base">{formatPrice(log.total)}</div>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {todayLogs.map(log => (
                <div key={log.id} className="bg-black/5 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-800 text-sm">{log.customer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{log.time}</span>
                        {log.mobile !== 'N/A' && <span className="text-[10px] font-medium text-black/30">· {log.mobile}</span>}
                      </div>
                    </div>
                    <div className="font-black text-emerald-600 text-base">{formatPrice(log.total)}</div>
                  </div>
                  <div className="flex justify-between items-center border-t border-black/5 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-black/5">Items: {log.itemsCount}</span>
                    </div>
                    {(() => {
                      const m = log.payment_method || 'Cash';
                      const badge: Record<string, string> = {
                        Cash: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                        UPI: 'bg-blue-50 text-blue-700 border border-blue-200',
                        Mixed: 'bg-violet-50 text-violet-700 border border-violet-200',
                        Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
                      };
                      const icon: Record<string, string> = { Cash: '💵', UPI: '📱', Mixed: '🔀', Pending: '⏳' };
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${badge[m] || badge['Cash']}`}>
                          {icon[m]} {m}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
