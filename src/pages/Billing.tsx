import React, { useState } from 'react';
import { Plus, Trash2, Printer, Search, Loader2, Save } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface BillItem {
  id: string;
  category: string;
  productName: string;
  price: number;
  quantity: number;
}

export const Billing = () => {
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  
  const [items, setItems] = useState<BillItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddItem = () => {
    if (!category || !productName || !price || !quantity) {
      toast.error('Please fill all item details');
      return;
    }

    const newItem: BillItem = {
      id: Date.now().toString(),
      category,
      productName,
      price: parseFloat(price),
      quantity: parseInt(quantity)
    };

    setItems([...items, newItem]);
    setProductName('');
    setPrice('');
    setQuantity('1');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18; // Assuming 18% GST or similar
  const total = subtotal + tax;

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('Please add items to bill first');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Save sale to database (API handles expanding into multiple rows)
      await api.request('createStoreSale', {
        customer_name: customerName || 'Walk-in',
        customer_mobile: mobile || 'N/A',
        items: items
      });
      
      toast.success('Sale logged successfully');
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to log sale in database.');
      setIsProcessing(false);
    }
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
      setCategory('');
      setProductName('');
      setPrice('');
      setQuantity('1');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 print:hidden">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black mb-2">Store Billing</h1>
          <p className="text-black/40">Point of sale for walk-in customers</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleClear} disabled={isProcessing} className="px-6 py-3 rounded-2xl font-bold border-2 border-black/10 hover:bg-black/5 transition-all text-sm disabled:opacity-50">
            Clear Bill
          </button>
          <button onClick={handleSave} disabled={isProcessing || items.length === 0} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 text-sm disabled:opacity-50">
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isProcessing ? 'Saving...' : 'Save Bill'}
          </button>
          <button onClick={handlePrint} disabled={isProcessing || items.length === 0} className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-black/90 transition-all flex items-center gap-2 text-sm disabled:opacity-50">
            <Printer className="w-5 h-5" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Print Layout (Visible only on print) */}
      <div className="hidden print:flex flex-col min-h-screen bg-white">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-black">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-widest mb-2">Boy's Zone</h1>
            <p className="text-sm font-bold text-black/60 max-w-[200px]">Near Ripusudan Petrol Pump Suhela, Baloda Bazar CG</p>
            <p className="text-sm font-bold text-black/60 mt-1">Ph: +91 9617628157</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase tracking-widest text-black/20 mb-4">INVOICE</h2>
            <div className="space-y-1 text-sm font-bold">
              <div className="flex justify-end gap-4"><span className="text-black/40">Date:</span><span>{new Date().toLocaleDateString()}</span></div>
              <div className="flex justify-end gap-4"><span className="text-black/40">Time:</span><span>{new Date().toLocaleTimeString()}</span></div>
            </div>
          </div>
        </div>

        {/* Billed To Section */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Billed To:</p>
          <div className="font-bold text-lg">{customerName || 'Walk-in Customer'}</div>
          {mobile && <div className="text-sm font-bold text-black/60 mt-1">Ph: {mobile}</div>}
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="border-y-2 border-black/10 text-xs font-bold uppercase tracking-widest text-black/40">
              <th className="py-4 px-2">Item Description</th>
              <th className="py-4 px-2 text-center">Qty</th>
              <th className="py-4 px-2 text-right">Unit Price</th>
              <th className="py-4 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {items.map(item => (
              <tr key={item.id}>
                <td className="py-4 px-2">
                  <div className="font-bold">{item.productName}</div>
                  <div className="text-xs text-black/40 mt-1">{item.category}</div>
                </td>
                <td className="py-4 px-2 text-center font-bold">{item.quantity}</td>
                <td className="py-4 px-2 text-right">{formatPrice(item.price)}</td>
                <td className="py-4 px-2 text-right font-bold">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-16">
          <div className="w-64 space-y-4">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-black/60 uppercase tracking-widest">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-black/60 uppercase tracking-widest">Tax / GST (18%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-black pt-4 border-t-2 border-black">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-auto pt-8 border-t-2 border-black/10 text-center space-y-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest mb-1">Thank you for shopping with us!</p>
            <p className="text-xs font-bold text-black/40 uppercase tracking-widest">No Exchange without Invoice.</p>
          </div>
          <div className="pt-4 space-y-2">
            <p className="text-xs font-bold text-black/40 uppercase tracking-widest bg-black/5 rounded-full px-4 py-2 inline-block">System Generated Invoice</p>
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
              Powered By <span className="text-black">Zentrix</span> (https://zentrix-dv.vercel.app/)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          
          {/* Customer Details */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">Customer Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Customer Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Kumar" 
                  className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Mobile Number</label>
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210" 
                  className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black font-medium"
                />
              </div>
            </div>
          </div>

          {/* Add Item Form */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">Add Item</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black font-medium"
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
                <input 
                  type="text" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Blue Striped Cotton Shirt" 
                  className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Price (₹)</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00" 
                    className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Quantity</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
              </div>
              <button 
                onClick={handleAddItem}
                className="w-full bg-black/5 text-black py-4 rounded-xl font-bold flex flex-col items-center justify-center hover:bg-black/10 transition-colors mt-2"
              >
                <Plus className="w-5 h-5 mb-1" /> Add to Bill
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Bill Summary & Print View */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm h-full flex flex-col min-h-[600px]">
            <h2 className="text-xl font-bold mb-6 print:hidden">Current Bill Items</h2>
            
            <div className="flex-1 overflow-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-black/40 print:hidden">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-bold">No items added to bill yet.</p>
                </div>
              ) : (
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
              )}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-black/10 space-y-3">
              <div className="flex justify-between text-sm font-bold text-black/60 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-black">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-black/60 uppercase tracking-widest">
                <span>Tax / GST (18%)</span>
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
    </div>
  );
};
