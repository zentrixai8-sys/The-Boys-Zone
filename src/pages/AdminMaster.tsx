import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category, Offer } from '../types';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Image as ImageIcon, Tag, Link as LinkIcon, Edit, Upload, Camera } from 'lucide-react';

export const AdminMaster = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryPreview, setCategoryPreview] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Offer State
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [newOfferLink, setNewOfferLink] = useState('');
  const [offerImage, setOfferImage] = useState<File | null>(null);
  const [offerPreview, setOfferPreview] = useState<string | null>(null);
  const [addingOffer, setAddingOffer] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsData, offersData] = await Promise.all([
        api.request('getCategories'),
        api.request('getOffers')
      ]);
      setCategories(catsData);
      setOffers(offersData);
    } catch (error) {
      console.error('Failed to fetch master data', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || !categoryImage) {
      toast.error('Please provide a name and an image for the category');
      return;
    }

    try {
      setAddingCategory(true);
      const imageUrl = await api.request('uploadFile', {
        file: categoryImage,
        bucket: 'products',
        path: `categories/${Date.now()}_${categoryImage.name}`
      });

      await api.request('addCategory', {
        category_name: newCategoryName,
        image_url: imageUrl
      });

      toast.success('Category added successfully');
      setNewCategoryName('');
      setCategoryImage(null);
      setCategoryPreview(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleUpdateCategoryImage = async (categoryId: string, name: string, file: File) => {
    try {
      setUpdatingId(categoryId);
      const imageUrl = await api.request('uploadFile', {
        file,
        bucket: 'products',
        path: `categories/${Date.now()}_${file.name}`
      });

      await api.request('updateCategory', {
        category_id: categoryId,
        category_name: name,
        image_url: imageUrl
      });

      toast.success('Category banner updated!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update banner');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.request('deleteCategory', { category_id: categoryId });
        toast.success('Category deleted');
        fetchData();
      } catch (error) {
         toast.error('Failed to delete category');
      }
    }
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferTitle || !offerImage) {
      toast.error('Please provide a title and an image for the offer');
      return;
    }

    try {
      setAddingOffer(true);
      const imageUrl = await api.request('uploadFile', {
        file: offerImage,
        bucket: 'products',
        path: `offers/${Date.now()}_${offerImage.name}`
      });

      await api.request('addOffer', {
        title: newOfferTitle,
        description: newOfferDesc,
        link: newOfferLink,
        image_url: imageUrl
      });

      toast.success('Offer added successfully');
      setNewOfferTitle('');
      setNewOfferDesc('');
      setNewOfferLink('');
      setOfferImage(null);
      setOfferPreview(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to add offer');
    } finally {
      setAddingOffer(false);
    }
  };

  const handleUpdateOfferImage = async (offerId: string, offer: any, file: File) => {
    try {
      setUpdatingId(offerId);
      const imageUrl = await api.request('uploadFile', {
        file,
        bucket: 'products',
        path: `offers/${Date.now()}_${file.name}`
      });

      await api.request('updateOffer', {
        id: offerId,
        title: offer.title,
        description: offer.description,
        link: offer.link,
        image_url: imageUrl
      });

      toast.success('Offer banner updated!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update banner');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await api.request('deleteOffer', { id: offerId });
        toast.success('Offer deleted');
        fetchData();
      } catch (error) {
         toast.error('Failed to delete offer');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-indigo-600 pb-2 inline-block">Master Database</h1>
          <p className="mt-2 text-gray-500">Manage your product categories and promotional offers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Categories Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-indigo-50/50 p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" /> Manage Categories
            </h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleAddCategory} className="space-y-6 mb-8 bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/50">
              <h3 className="text-xs font-black text-indigo-900 uppercase tracking-[0.2em] mb-4">Create New Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 ml-1">Category Name</label>
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-5 py-3 bg-white border border-indigo-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-gray-300"
                      placeholder="e.g., Premium Shirts"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingCategory}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex justify-center items-center gap-3 disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-5 h-5" /> Add Category</>}
                  </button>
                </div>

                <div className="relative group/upload">
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 ml-1">Banner Image</label>
                  <label className={`relative flex flex-col items-center justify-center h-full min-h-[140px] bg-white border-2 border-dashed ${categoryPreview ? 'border-indigo-500 bg-indigo-50/10' : 'border-indigo-100 hover:border-indigo-400'} rounded-3xl cursor-pointer transition-all overflow-hidden group/box`}>
                    {categoryPreview ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={categoryPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/box:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                           <Upload className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-500 group-hover/upload:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-indigo-900/60 tracking-tight">Tap to upload banner</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 5 * 1024 * 1024) {
                          toast.error('Image size should be less than 5MB');
                          e.target.value = '';
                          return;
                        }
                        setCategoryImage(file);
                        if (file) setCategoryPreview(URL.createObjectURL(file));
                      }}
                      className="hidden"
                      required
                    />
                  </label>
                </div>
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Live Collections</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">No categories found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map(cat => (
                    <div key={cat.category_id} className="group relative bg-white border border-gray-100 rounded-4xl p-3 flex items-center justify-between hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-indigo-200 transition-colors">
                          <img src={cat.image_url} alt={cat.category_name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-[2px] transition-opacity">
                            {updatingId === cat.category_id ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              disabled={updatingId === cat.category_id}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpdateCategoryImage(cat.category_id, cat.category_name, file);
                              }}
                            />
                          </label>
                        </div>
                        <div>
                          <span className="font-black text-slate-800 text-sm">{cat.category_name}</span>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Quick Edit Enabled</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteCategory(cat.category_id)}
                        className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all p-3 rounded-2xl scale-90 hover:scale-100"
                        title="Remove Category"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Offers Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-rose-50/50 p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-500" /> Manage Home Offers
            </h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleAddOffer} className="space-y-6 mb-8 bg-rose-50/30 p-6 rounded-3xl border border-rose-100/50">
              <h3 className="text-xs font-black text-rose-900 uppercase tracking-[0.2em] mb-4">New Promo Banner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                    <input
                      type="text"
                      required
                      value={newOfferTitle}
                      onChange={(e) => setNewOfferTitle(e.target.value)}
                      className="w-full px-5 py-3 bg-white border border-rose-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
                      placeholder="e.g., Summer Flash Sale"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5 ml-1">Link (Optional)</label>
                    <input
                      type="text"
                      value={newOfferLink}
                      onChange={(e) => setNewOfferLink(e.target.value)}
                      className="w-full px-5 py-3 bg-white border border-rose-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
                      placeholder="/products?cat=shirts"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingOffer}
                    className="w-full bg-rose-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all flex justify-center items-center gap-3 disabled:opacity-50 shadow-lg shadow-rose-600/20 active:scale-95"
                  >
                    {addingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-5 h-5" /> Launch Offer</>}
                  </button>
                </div>

                <div className="relative group/upload">
                  <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5 ml-1">Promo Banner</label>
                  <label className={`relative flex flex-col items-center justify-center h-full min-h-[140px] bg-white border-2 border-dashed ${offerPreview ? 'border-rose-500 bg-rose-50/10' : 'border-rose-100 hover:border-rose-400'} rounded-3xl cursor-pointer transition-all overflow-hidden group/box`}>
                    {offerPreview ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={offerPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/box:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                           <Upload className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 group-hover/upload:scale-110 transition-transform">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-rose-900/60 tracking-tight">Tap to upload promo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 5 * 1024 * 1024) {
                          toast.error('Image size should be less than 5MB');
                          e.target.value = '';
                          return;
                        }
                        setOfferImage(file);
                        if (file) setOfferPreview(URL.createObjectURL(file));
                      }}
                      className="hidden"
                      required
                    />
                  </label>
                </div>
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Live Banners</h3>
              {offers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">No active offers.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {offers.map(offer => (
                    <div key={offer.id} className="relative bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:border-rose-100 transition-all duration-300">
                      <div className="aspect-21/9 w-full bg-gray-100 relative overflow-hidden">
                        <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-sm transition-opacity">
                          {updatingId === offer.id ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            disabled={updatingId === offer.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpdateOfferImage(offer.id, offer, file);
                            }}
                          />
                        </label>
                      </div>
                      <div className="p-6 flex justify-between items-center">
                        <div>
                          <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{offer.title}</h4>
                          {offer.link && (
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                              <LinkIcon className="w-3 h-3" /> {offer.link}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all p-4 rounded-3xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
