import React, { useState, useEffect } from 'react';
import type { Product, Category, SchoolSettings } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, 
  Plus, 
  Tag, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  DollarSign, 
  Layers, 
  X,
  LayoutGrid,
  List,
  Building,
  CreditCard
} from 'lucide-react';

import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { useToast } from '../../context/ToastContext';

interface InventoryManagerProps {
  settings: SchoolSettings;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ settings }) => {
  const { user, isPrincipal } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  // Deletion Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'Product' | 'Category' } | null>(null);
  
  // Grid vs List view toggle
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodCostPrice, setProdCostPrice] = useState<number | ''>('');
  const [prodSalePrice, setProdSalePrice] = useState<number | ''>('');
  const [prodQty, setProdQty] = useState<number | ''>('');
  const [prodSize, setProdSize] = useState('');
  const [prodColor, setProdColor] = useState('');
  const [prodVariant, setProdVariant] = useState('');

  // Wholesaler & Purchase Payment Channel States
  const [wholesalerName, setWholesalerName] = useState('');
  const [wholesalerDetails, setWholesalerDetails] = useState('');
  const [purchasePaymentChannel, setPurchasePaymentChannel] = useState('Cash');
  const [purchasedBy, setPurchasedBy] = useState('');

  const [prodError, setProdError] = useState<string | null>(null);

  const currency = settings.currency_symbol || 'PKR';

  useEffect(() => {
    loadInventory();
    const unsub = db.subscribe(category => {
      if (category === 'products' || category === 'categories' || category === 'all') {
        loadInventory();
      }
    });
    return () => unsub();
  }, []);

  const loadInventory = async () => {
    const prods = await db.getProducts();
    const cats = await db.getCategories();
    setProducts(prods);
    setCategories(cats);
    if (cats.length > 0 && !prodCatId) {
      setProdCatId(cats[0].id);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    if (!newCatName.trim()) {
      setCatError('Category name is required.');
      return;
    }
    const targetName = newCatName.trim();
    const targetDesc = newCatDesc.trim();
    setNewCatName('');
    setNewCatDesc('');
    setIsCategoryModalOpen(false);

    try {
      const createdCat = await db.createCategory(targetName, targetDesc);
      setCategories(prev => [createdCat, ...prev]);
      showToast('success', 'Category Created', `Created category "${createdCat.name}".`);
      await loadInventory();
    } catch (err: any) {
      setCatError(err.message || 'Failed to create category.');
      showToast('error', 'Category Failed', err.message || 'Failed to create category.');
      await loadInventory();
    }
  };

  const openProductModal = (productToEdit?: Product) => {
    setProdError(null);
    if (productToEdit) {
      setEditingProductId(productToEdit.id);
      setProdName(productToEdit.name);
      setProdSku(productToEdit.sku);
      setProdCatId(productToEdit.category_id);
      setProdCostPrice(productToEdit.cost_price);
      setProdSalePrice(productToEdit.sale_price);
      setProdQty(productToEdit.quantity);
      setProdSize(productToEdit.size || '');
      setProdColor(productToEdit.color || '');
      setProdVariant(productToEdit.variant || '');
      setWholesalerName(productToEdit.wholesaler_name || '');
      setWholesalerDetails(productToEdit.wholesaler_details || '');
      setPurchasePaymentChannel(productToEdit.purchase_payment_channel || 'Cash');
      setPurchasedBy(productToEdit.purchased_by || (isPrincipal ? 'CEO Office' : (user?.full_name || 'Staff')));
    } else {
      setEditingProductId(null);
      setProdName('');
      setProdSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setProdCatId((selectedCategory && selectedCategory !== 'all') ? selectedCategory : (categories[0]?.id || ''));
      setProdCostPrice('');
      setProdSalePrice('');
      setProdQty('');
      setProdSize('');
      setProdColor('');
      setProdVariant('');
      setWholesalerName('');
      setWholesalerDetails('');
      setPurchasePaymentChannel('Cash');
      setPurchasedBy(isPrincipal ? 'CEO Office' : (user?.full_name || 'Staff'));
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError(null);

    if (!prodName.trim()) {
      setProdError('Product Name is required.');
      return;
    }
    if (prodCostPrice === '' || prodSalePrice === '' || prodQty === '') {
      setProdError('Cost price, sale price, and quantity are required.');
      return;
    }

    try {
      const productPayload = {
        name: prodName.trim(),
        sku: prodSku.trim(),
        category_id: prodCatId,
        cost_price: Number(prodCostPrice),
        sale_price: Number(prodSalePrice),
        quantity: Number(prodQty),
        size: prodSize.trim() || undefined,
        color: prodColor.trim() || undefined,
        variant: prodVariant.trim() || undefined,
        wholesaler_name: wholesalerName.trim() || undefined,
        wholesaler_details: wholesalerDetails.trim() || undefined,
        purchase_payment_channel: purchasePaymentChannel.trim() || 'Cash',
        purchased_by: purchasedBy.trim() || (isPrincipal ? 'CEO Office' : (user?.full_name || 'Staff')),
      };

      setIsProductModalOpen(false);

      if (editingProductId) {
        const updated = await db.updateProduct(editingProductId, productPayload);
        setProducts(prev => prev.map(p => p.id === editingProductId ? updated : p));
        showToast('success', 'Product Updated', `Updated product "${productPayload.name}".`);
      } else {
        const created = await db.addProduct(productPayload);
        setProducts(prev => [created, ...prev]);
        showToast('success', 'Product Stored', `Stored "${productPayload.name}" from ${productPayload.wholesaler_name || 'Wholesaler'}.`);
      }

      await loadInventory();
    } catch (err: any) {
      setProdError(err.message || 'Failed to save product.');
      showToast('error', 'Product Error', err.message || 'Failed to save product.');
      await loadInventory();
    }
  };

  const handlePromptDeleteProduct = (id: string, name: string) => {
    setDeleteTarget({ id, name, type: 'Product' });
  };

  const handlePromptDeleteCategory = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ id, name, type: 'Category' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    if (target.type === 'Product') {
      setProducts(prev => prev.filter(p => p.id !== target.id));
      await db.deleteProduct(target.id);
      showToast('delete', 'Product Deleted', `Removed product "${target.name}".`);
    } else if (target.type === 'Category') {
      setCategories(prev => prev.filter(c => c.id !== target.id));
      await db.deleteCategory(target.id);
      showToast('delete', 'Category Deleted', `Removed category "${target.name}".`);
      if (selectedCategory === target.id) {
        setSelectedCategory('all');
      }
    }
    await loadInventory();
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(searchLower) || 
      p.sku.toLowerCase().includes(searchLower) ||
      (p.wholesaler_name && p.wholesaler_name.toLowerCase().includes(searchLower));
    const matchesLowStock = !showLowStockOnly || p.quantity <= 5;
    return matchesCat && matchesSearch && matchesLowStock;
  });

  const totalStockUnits = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalCostAssetValue = products.reduce((acc, p) => acc + p.cost_price * p.quantity, 0);
  const lowStockCount = products.filter(p => p.quantity <= 5).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Inventory & Wholesale Stock Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track books, uniforms, shoes & accessories with wholesaler invoices & procurement payment channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCatError(null); setIsCategoryModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Tag className="w-4 h-4 text-emerald-400" /> Create Category
          </button>

          <button
            onClick={() => openProductModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Store New Product
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Unique SKUs</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{products.length}</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Stock Quantity</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{totalStockUnits.toLocaleString()} units</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Inventory Cost Value</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{currency} {totalCostAssetValue.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Low Stock Alerts</div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{lowStockCount} items</div>
          </div>
        </div>
      </div>

      {/* Categories & Search Controls - Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, SKU or wholesaler..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                showLowStockOnly
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              Low Stock Only
            </button>

            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
            </div>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer whitespace-nowrap"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-500" /> + Category
            </button>

            <button
              onClick={() => openProductModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-900/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> + Store New Product
            </button>
          </div>
        </div>

        {/* Categories Bar (Wrapped to fit screen width without horizontal scrolling) */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Categories ({categories.length})
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Categories ({products.length})
            </button>
            {categories.map(c => {
              const count = products.filter(p => p.category_id === c.id).length;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{c.name} ({count})</span>
                  <button
                    onClick={(e) => handlePromptDeleteCategory(c.id, c.name, e)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                    title={`Delete category ${c.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRODUCTS DISPLAY - LIST OR GRID */}
      {viewMode === 'grid' ? (
        /* GRID VIEW DISPLAY */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Package className="w-8 h-8 mb-2 stroke-1" />
              <p>No inventory items match selected category or search.</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const category = categories.find(c => c.id === product.category_id);
              const isLow = product.quantity <= 5;
              const isOut = product.quantity <= 0;

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {product.sku}
                      </span>
                      {isOut ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          LOW ({product.quantity})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">
                          Stock: {product.quantity}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                      {product.name}
                    </h4>

                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        {category?.name || 'General'}
                      </span>
                      {product.size && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{product.size}</span>}
                      {product.color && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{product.color}</span>}
                    </div>

                    {/* Wholesaler & Payment Details */}
                    {product.wholesaler_name && (
                      <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-[10px] space-y-1">
                        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          <Building className="w-3 h-3 text-emerald-600" />
                          <span className="truncate">{product.wholesaler_name}</span>
                        </div>
                        {product.purchase_payment_channel && (
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <CreditCard className="w-3 h-3 text-indigo-500" />
                            <span>Paid via: <strong>{product.purchase_payment_channel}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Cost: {currency} {product.cost_price.toLocaleString()}</div>
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {currency} {product.sale_price.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openProductModal(product)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePromptDeleteProduct(product.id, product.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* LIST VIEW TABLE DISPLAY WITH WHOLESALER & PAYMENT INFO */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Item SKU / Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Wholesaler & Contact</th>
                  <th className="py-3.5 px-4">Procurement Channel</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Sale Price</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No products found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const category = categories.find(c => c.id === product.category_id);
                    const isLow = product.quantity <= 5;
                    const isOut = product.quantity <= 0;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Name & SKU */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{product.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                              {product.sku}
                            </span>
                            {product.size && <span className="text-[10px] text-slate-400">• Size: {product.size}</span>}
                            {product.color && <span className="text-[10px] text-slate-400">• {product.color}</span>}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {category?.name || 'Uncategorized'}
                          </span>
                        </td>

                        {/* Wholesaler Details */}
                        <td className="py-3 px-4 max-w-[200px]">
                          {product.wholesaler_name ? (
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                                <Building className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{product.wholesaler_name}</span>
                              </div>
                              {product.wholesaler_details && (
                                <div className="text-[10px] text-slate-400 truncate" title={product.wholesaler_details}>
                                  {product.wholesaler_details}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Not specified</span>
                          )}
                        </td>

                        {/* Procurement Payment Channel */}
                        <td className="py-3 px-4">
                          {product.purchase_payment_channel ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <CreditCard className="w-3 h-3" />
                              {product.purchase_payment_channel}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Cash</span>
                          )}
                          {product.purchased_by && (
                            <div className="text-[9px] text-slate-400 mt-0.5">By: {product.purchased_by}</div>
                          )}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300 font-mono">
                          {currency} {product.cost_price.toLocaleString()}
                        </td>

                        {/* Sale Price */}
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {currency} {product.sale_price.toLocaleString()}
                        </td>

                        {/* Stock Quantity Status */}
                        <td className="py-3 px-4 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              OUT (0)
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              LOW ({product.quantity})
                            </span>
                          ) : (
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {product.quantity}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openProductModal(product)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePromptDeleteProduct(product.id, product.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCT ADD / EDIT MODAL WITH WHOLESALER & PAYMENT FIELDS */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88vh] overflow-hidden">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" /> 
                {editingProductId ? 'Edit Product & Wholesaler Info' : 'Store New Inventory Stock & Wholesaler Details'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form id="product-form" onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {prodError && (
                <div className="mb-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <div>{prodError}</div>
                </div>
              )}
              {/* Product Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oxford English Literature Grade 9"
                    value={prodName}
                    onChange={e => setProdName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">SKU / Barcode *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK-ENG-09"
                    value={prodSku}
                    onChange={e => setProdSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Category, Quantity, Cost & Sale Price */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={prodCatId}
                    onChange={e => setProdCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="50"
                    value={prodQty}
                    onChange={e => setProdQty(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold text-indigo-600 dark:text-indigo-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cost Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="500"
                    value={prodCostPrice}
                    onChange={e => setProdCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sale Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="850"
                    value={prodSalePrice}
                    onChange={e => setProdSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-extrabold text-emerald-600 dark:text-emerald-400 font-mono"
                  />
                </div>
              </div>

              {/* WHOLESALER & PURCHASE TRANSACTION DETAILS SECTION */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Wholesaler Procurement & Payment Channel Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Wholesaler / Vendor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Al-Madina School Uniform Wholesale"
                      value={wholesalerName}
                      onChange={e => setWholesalerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Purchase Payment Channel
                    </label>
                    <select
                      value={purchasePaymentChannel}
                      onChange={e => setPurchasePaymentChannel(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs dark:text-white font-semibold"
                    >
                      <option value="Cash">Cash on Delivery / Direct Cash</option>
                      <option value="Bank Transfer (Meezan Bank)">Bank Transfer (Meezan Bank)</option>
                      <option value="Bank Transfer (Habib Bank Ltd)">Bank Transfer (Habib Bank Ltd)</option>
                      <option value="Bank Transfer (Other)">Bank Transfer (Other Commercial Bank)</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="Company Cheque">Company Cheque</option>
                      <option value="Company Account (Credit)">Company Account (Credit / Pay Later)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Wholesaler Contact / Address / Invoice Ref
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Urdu Bazaar Lahore • Inv #OUP-9821 • Ph: 0300-1234567"
                      value={wholesalerDetails}
                      onChange={e => setWholesalerDetails(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Purchased / Stocked By
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CEO Office / Ahmed Hassan"
                      value={purchasedBy}
                      onChange={e => setPurchasedBy(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Optional Item Variants</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Size (e.g. L, 38EU)"
                      value={prodSize}
                      onChange={e => setProdSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Color (e.g. Navy Blue)"
                      value={prodColor}
                      onChange={e => setProdColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Variant (e.g. Edition 2026)"
                      value={prodVariant}
                      onChange={e => setProdVariant(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>
                </div>
              </div>

            </form>

            {/* Modal Footer - Fixed Action Buttons (Never pushed down or hidden) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {editingProductId ? 'Update Product' : 'Store Product in Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" /> Create New Inventory Category
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {catError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{catError}</div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Supplies"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Short description of items in this category"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETION CONFIRMATION DIALOG MODAL */}
      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.name}
          itemType={deleteTarget.type}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
