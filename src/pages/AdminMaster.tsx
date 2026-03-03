import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category, Offer } from '../types';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Image as ImageIcon, Tag, Link as LinkIcon, Edit, Upload } from 'lucide-react';

export const AdminMaster = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);

  // Offer State
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [newOfferLink, setNewOfferLink] = useState('');
  const [offerImage, setOfferImage] = useState<File | null>(null);
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
      fetchData();
    } catch (error) {
      toast.error('Failed to add category');
    } finally {
      setAddingCategory(false);
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
      fetchData();
    } catch (error) {
      toast.error('Failed to add offer');
    } finally {
      setAddingOffer(false);
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
            <form onSubmit={handleAddCategory} className="space-y-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Add New Category</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g., T-Shirts"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category Image</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                    <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4" /> {categoryImage ? categoryImage.name : 'Choose Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCategoryImage(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                    />
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={addingCategory}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Category</>}
              </button>
            </form>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Existing Categories</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No categories found.</p>
              ) : (
                <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {categories.map(cat => (
                    <li key={cat.category_id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-4">
                        <img src={cat.image_url} alt={cat.category_name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                        <span className="font-bold text-gray-800">{cat.category_name}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteCategory(cat.category_id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
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
            <form onSubmit={handleAddOffer} className="space-y-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Add New Offer Banner</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Offer Title</label>
                <input
                  type="text"
                  required
                  value={newOfferTitle}
                  onChange={(e) => setNewOfferTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="e.g., Summer Sale - Flat 50% Off"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Short Description (Optional)</label>
                <input
                  type="text"
                  value={newOfferDesc}
                  onChange={(e) => setNewOfferDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="e.g., Valid till this weekend only!"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Link URL (Optional)</label>
                <input
                  type="text"
                  value={newOfferLink}
                  onChange={(e) => setNewOfferLink(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="e.g., /products?category=tshirts"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Banner Image (Wide aspect ratio recommended)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-rose-500 hover:bg-rose-50 transition-colors">
                    <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
                       <Upload className="w-4 h-4" /> {offerImage ? offerImage.name : 'Choose Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setOfferImage(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                    />
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={addingOffer}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 disabled:opacity-50 mt-2"
              >
                {addingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Upload Offer</>}
              </button>
            </form>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Active Offers</h3>
              {offers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active offers.</p>
              ) : (
                <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {offers.map(offer => (
                    <li key={offer.id} className="relative bg-white border border-gray-200 rounded-xl overflow-hidden group">
                      <div className="aspect-[21/9] w-full bg-gray-100">
                        <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900">{offer.title}</h4>
                        {offer.description && <p className="text-xs text-gray-500 mt-1">{offer.description}</p>}
                        {offer.link && (
                          <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-rose-600">
                            <LinkIcon className="w-3 h-3" /> {offer.link}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white shadow-sm opacity-0 group-hover:opacity-100"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
