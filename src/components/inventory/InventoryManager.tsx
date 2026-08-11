import React, { useState, useEffect } from 'react';
import type { Product, Category, SchoolSettings } from '../../types';
import { db } from '../../services/db';
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
  List
} from 'lucide-react';

import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { useToast } from '../../context/ToastContext';

interface InventoryManagerProps {
  settings: SchoolSettings;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ settings }) => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  // Deletion Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'Product' | 'Category' } | null>(null);
  
  // Requirement 8: Grid vs List view toggle
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
  const [prodError, setProdError] = useState<string | null>(null);

  const currency = settings.currency_symbol || 'PKR';

  useEffect(() => {
    loadInventory();
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
    try {
      await db.createCategory(newCatName, newCatDesc);
      showToast('success', 'Category Created', `Created category "${newCatName.trim()}".`);
      setNewCatName('');
      setNewCatDesc('');
      setIsCategoryModalOpen(false);
      await loadInventory();
    } catch (err: any) {
      setCatError(err.message || 'Failed to create category.');
      showToast('error', 'Category Failed', err.message || 'Failed to create category.');
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
    } else {
      setEditingProductId(null);
      setProdName('');
      setProdSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setProdCatId(categories[0]?.id || '');
      setProdCostPrice('');
      setProdSalePrice('');
      setProdQty('');
      setProdSize('');
      setProdColor('');
      setProdVariant('');
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
      };

      if (editingProductId) {
        await db.updateProduct(editingProductId, productPayload);
        showToast('success', 'Product Updated', `Updated product details for "${productPayload.name}".`);
      } else {
        await db.addProduct(productPayload);
        showToast('success', 'Product Created', `Added "${productPayload.name}" to inventory stock.`);
      }

      setIsProductModalOpen(false);
      await loadInventory();
    } catch (err: any) {
      setProdError(err.message || 'Failed to save product.');
      showToast('error', 'Product Error', err.message || 'Failed to save product.');
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
    if (deleteTarget.type === 'Product') {
      await db.deleteProduct(deleteTarget.id);
      showToast('delete', 'Product Deleted', `Removed product "${deleteTarget.name}".`);
    } else if (deleteTarget.type === 'Category') {
      await db.deleteCategory(deleteTarget.id);
      showToast('delete', 'Category Deleted', `Removed category "${deleteTarget.name}".`);
      if (selectedCategory === deleteTarget.id) {
        setSelectedCategory('all');
      }
    }
    setDeleteTarget(null);
    await loadInventory();
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !showLowStockOnly || p.quantity <= 5;
    return matchesCat && matchesSearch && matchesLowStock;
  });

  const totalStockUnits = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalCostAssetValue = products.reduce((acc, p) => acc + p.cost_price * p.quantity, 0);
  const lowStockCount = products.filter(p => p.quantity <= 5).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inventory & Category Control</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage textbooks, uniforms, ties, shoes, caps & sports gear stock levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCatError(null); setIsCategoryModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl text-xs font-semibold shadow-sm transition-all"
          >
            <Tag className="w-4 h-4 text-emerald-400" /> Create Category
          </button>

          <button
            onClick={() => openProductModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
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
            <div className="text-xs font-medium text-slate-500">Total Unique Items</div>
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
            <div className="text-xs font-medium text-slate-500">Total Asset Cost Value</div>
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

      {/* Requirement 8: CATEGORIES VISIBLE IN 2 ROWS & GRID/LIST VIEW TOGGLE */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Top Controls: Search, Low Stock, & Grid/List View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                showLowStockOnly
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              Low Stock Only
            </button>

            {/* Requirement 8: GRID / LIST VIEW TOGGLE BUTTON */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" /> List View
              </button>
            </div>
          </div>
        </div>

        {/* Requirement 8: CATEGORIES ARRANGED IN EXACTLY 2 ROWS */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Categories (Organized in 2 Rows)
          </div>
          <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
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
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
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

      {/* Requirement 8: PRODUCTS DYNAMIC DISPLAY - GRID OR LIST VIEW */}
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
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
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
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Cost: {currency} {product.cost_price.toLocaleString()}</div>
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {currency} {product.sale_price.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openProductModal(product)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePromptDeleteProduct(product.id, product.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
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
        /* LIST / TABLE VIEW DISPLAY */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">SKU / Code</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Variants (Size / Color)</th>
                  <th className="p-4 text-right">Cost Price</th>
                  <th className="p-4 text-right">Sale Price</th>
                  <th className="p-4 text-center">Stock Qty</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                      No inventory items found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const category = categories.find(c => c.id === product.category_id);
                    const isLow = product.quantity <= 5;
                    const isOut = product.quantity <= 0;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {product.sku}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {product.name}
                          {product.variant && <div className="text-[10px] font-normal text-slate-400">{product.variant}</div>}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {category?.name || 'General'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {product.size || product.color ? (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              {product.size && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{product.size}</span>}
                              {product.color && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{product.color}</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                          {currency} {product.cost_price.toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {currency} {product.sale_price.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          {isOut ? (
                            <span className="px-2 py-1 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">
                              0 (Out of Stock)
                            </span>
                          ) : isLow ? (
                            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold rounded-full animate-pulse">
                              {product.quantity} units (Low)
                            </span>
                          ) : (
                            <span className="font-bold text-slate-800 dark:text-white">
                              {product.quantity}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openProductModal(product)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePromptDeleteProduct(product.id, product.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* CREATE CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" /> Create Category
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name * (e.g. Books, Uniforms, Scarves, Shoes, Ties, Caps, Sports gear)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports Equipment"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of items under this category..."
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

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" /> 
                {editingProductId ? 'Edit Product Details' : 'Store New Product in Inventory'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {prodError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{prodError}</div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oxford Mathematics Book 9"
                    value={prodName}
                    onChange={e => setProdName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU / Barcode *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK-MATH-09"
                    value={prodSku}
                    onChange={e => setProdSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={prodCatId}
                    onChange={e => setProdCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity in Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 50"
                    value={prodQty}
                    onChange={e => setProdQty(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="e.g. 500"
                    value={prodCostPrice}
                    onChange={e => setProdCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sale Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="e.g. 850"
                    value={prodSalePrice}
                    onChange={e => setProdSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white font-extrabold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Variants & Specifications</span>
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
                      placeholder="Variant (e.g. Cotton)"
                      value={prodVariant}
                      onChange={e => setProdVariant(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700"
                >
                  {editingProductId ? 'Update Product' : 'Save Product'}
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
