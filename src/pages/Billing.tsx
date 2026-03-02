import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Search, Loader2, Save, User as UserIcon, Phone, MapPin, ChevronDown, UserPlus } from 'lucide-react';
import { formatPrice, formatDate } from '../lib/utils';
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
  const [address, setAddress] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customers, setCustomers] = useState<{id: string, name: string, mobile: string, address: string}[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  
  const [items, setItems] = useState<BillItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayLogs, setTodayLogs] = useState<{ id: string, customer: string, mobile: string, time: string, total: number, itemsCount: number }[]>([]);

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

  const handleDropdownSelect = (id: string) => {
    setSelectedCustomerId(id);
    setIsDropdownOpen(false);
    
    if (id === 'walk-in') {
      setCustomerName('');
      setMobile('');
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

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
    c.mobile.includes(customerSearchQuery)
  );

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
      if (isCreatingCustomer) {
        if (!customerName || !mobile || !address) {
          toast.error('Please fill all customer details (Name, Mobile, Address) to create a new customer');
          setIsProcessing(false);
          return;
        }
        
        // Create customer in DB
        const newCustomer = await api.request('createCustomer', {
           name: customerName,
           mobile,
           address
        });
        
        setCustomers(prev => [...prev, newCustomer]);
        setSelectedCustomerId(newCustomer.id);
        setIsCreatingCustomer(false);
      }

      // Save sale to database (API handles expanding into multiple rows)
      await api.request('createStoreSale', {
        customer_name: customerName || 'Walk-in',
        customer_mobile: mobile || 'N/A',
        items: items
      });
      
      const newLog = {
        id: Date.now().toString(),
        customer: customerName || 'Walk-in',
        mobile: mobile || 'N/A',
        time: new Date().toLocaleTimeString(),
        total: total,
        itemsCount: items.length
      };
      setTodayLogs(prev => [newLog, ...prev]);

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
      setAddress('');
      setSelectedCustomerId('');
      setIsCreatingCustomer(false);
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
              <div className="flex justify-end gap-4"><span className="text-black/40">Date:</span><span>{formatDate(new Date())}</span></div>
              <div className="flex justify-end gap-4"><span className="text-black/40">Time:</span><span>{new Date().toLocaleTimeString()}</span></div>
            </div>
          </div>
        </div>

        {/* Billed To Section */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Billed To:</p>
          <div className="font-bold text-lg">{customerName || 'Walk-in Customer'}</div>
          {mobile && <div className="text-sm font-bold text-black/60 mt-1">Ph: {mobile}</div>}
          {address && <div className="text-sm font-bold text-black/60 mt-1">{address}</div>}
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
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black/5 pb-6">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                 <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Client Details</h2>
                <p className="text-sm font-bold text-blue-500">Customer Information</p>
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

      {/* Today's Log Section */}
      <div className="mt-12 bg-white p-6 rounded-3xl border border-black/5 shadow-sm print:hidden">
        <h2 className="text-xl font-bold mb-6">Today's Bills Log</h2>
        {todayLogs.length === 0 ? (
          <div className="text-center py-8 text-black/40 font-bold">No bills generated today yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black/10 text-xs font-bold uppercase tracking-widest text-black/40">
                  <th className="py-4 px-4">Time</th>
                  <th className="py-4 px-4">Customer</th>
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
                    <td className="py-4 px-4 text-center font-bold bg-black/5 rounded-xl">{log.itemsCount}</td>
                    <td className="py-4 px-4 text-right font-black text-emerald-600">{formatPrice(log.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
