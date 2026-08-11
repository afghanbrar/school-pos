import React, { useState, useEffect } from 'react';
import type { Product, Category, CartItem, BuyerType, PaymentMethod, Transaction, SchoolSettings } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { InvoiceModal } from './InvoiceModal';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Building2, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  AlertCircle,
  Tag,
  Filter,
  Sparkles,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PosTerminalProps {
  settings: SchoolSettings;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ settings }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Requirement: Grid / List View toggle on POS terminal dashboard
  const [posViewMode, setPosViewMode] = useState<'list' | 'grid'>('list');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Cart visibility & resizable width state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartWidth, setCartWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  
  const [buyerType, setBuyerType] = useState<BuyerType>('student');
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [externalSchoolName, setExternalSchoolName] = useState('');
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const currency = settings.currency_symbol || 'PKR';

  useEffect(() => {
    loadData();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Cart Panel Mouse Drag Resize Handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 650) {
        setCartWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const loadData = async () => {
    const prods = await db.getProducts();
    const cats = await db.getCategories();
    setProducts(prods);
    setCategories(cats);
  };

  const filteredProducts = products.filter(product => {
    const matchesCat = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      setErrorMsg(`"${product.name}" is currently out of stock!`);
      showToast('error', 'Out of Stock', `"${product.name}" is out of stock.`);
      return;
    }
    setErrorMsg(null);

    // Auto-Open Cart as soon as product is clicked
    setIsCartOpen(true);

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const existingQty = prev[existingIndex].quantity;
        if (existingQty >= product.quantity) {
          setErrorMsg(`Cannot add more than ${product.quantity} items available in inventory.`);
          showToast('warning', 'Stock Limit Reached', `Available limit is ${product.quantity} units.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        showToast('success', 'Cart Item Updated', `Added another "${product.name}" to cart.`);
        return updated;
      }
      showToast('success', 'Added to Cart', `Added "${product.name}" to cart.`);
      return [...prev, { product, quantity: 1, selected_size: product.size, selected_color: product.color }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.quantity) {
            setErrorMsg(`Available stock limit reached (${item.product.quantity} units).`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setStudentName('');
    setRollNo('');
    setStudentClass('');
    setExternalSchoolName('');
    setNotes('');
    setDiscount(0);
    setReceivedAmount('');
    setErrorMsg(null);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.sale_price * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const numericReceived = parseFloat(receivedAmount) || 0;
  const pendingDues = Math.max(0, grandTotal - numericReceived);

  useEffect(() => {
    if (cart.length > 0 && receivedAmount === '') {
      setReceivedAmount(grandTotal.toString());
    }
  }, [grandTotal]);

  const handleCheckout = async () => {
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Please add items to process sale.');
      return;
    }

    if (buyerType === 'student' && !studentName.trim()) {
      setErrorMsg('Please enter Student Name.');
      return;
    }

    if (buyerType === 'external_school' && !externalSchoolName.trim()) {
      setErrorMsg('Please enter External School / Organization Name.');
      return;
    }

    setProcessing(true);
    try {
      const transactionData: Omit<Transaction, 'id' | 'invoice_number' | 'created_at'> = {
        buyer_type: buyerType,
        buyer_name: buyerType === 'student' ? studentName.trim() : externalSchoolName.trim(),
        student_roll_no: buyerType === 'student' ? rollNo.trim() : undefined,
        student_class: buyerType === 'student' ? studentClass.trim() : undefined,
        school_name: buyerType === 'external_school' ? externalSchoolName.trim() : undefined,
        staff_id: user?.id || 'usr-staff-01',
        staff_name: user?.full_name || 'Staff Member',
        total_amount: subtotal,
        discount: discount,
        paid_amount: numericReceived,
        pending_amount: pendingDues,
        payment_method: paymentMethod,
        notes: notes.trim(),
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          unit_price: item.product.sale_price,
          unit_cost: item.product.cost_price,
          quantity: item.quantity,
          total_price: item.product.sale_price * item.quantity,
          size: item.selected_size || item.product.size,
          color: item.selected_color || item.product.color,
        })),
      };

      const created = await db.createTransaction(transactionData);
      setCompletedTx(created);
      
      await loadData();
      
      setCart([]);
      setStudentName('');
      setRollNo('');
      setStudentClass('');
      setExternalSchoolName('');
      setNotes('');
      setDiscount(0);
      setReceivedAmount('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process transaction.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* LEFT SECTION: PRODUCT CATALOG & CATEGORIES */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-slate-200 dark:border-slate-800">
        {/* Search Bar, View Mode Toggle & Category Filter Header */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white shadow-sm"
              />
            </div>

            {/* List / Grid View Switcher for POS Terminal */}
            <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                type="button"
                onClick={() => setPosViewMode('list')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  posViewMode === 'list'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" /> List View
              </button>
              <button
                type="button"
                onClick={() => setPosViewMode('grid')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  posViewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid View
              </button>
            </div>
          </div>

          {/* Category Pills Arranged in 2 Rows */}
          <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" /> All Items
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-3.5 h-3.5" /> {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Display: List View OR Grid View */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Tag className="w-10 h-10 mb-2 stroke-1" />
              <p>No inventory items match your search.</p>
            </div>
          ) : posViewMode === 'list' ? (
            /* LIST VIEW DISPLAY ON POS TERMINAL DASHBOARD */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3">Variant / Size</th>
                    <th className="p-3 text-center">Stock</th>
                    <th className="p-3 text-right">Sale Price</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredProducts.map(product => {
                    const isOutOfStock = product.quantity <= 0;
                    const isLowStock = product.quantity > 0 && product.quantity <= 5;
                    const inCart = cart.find(i => i.product.id === product.id);

                    return (
                      <tr 
                        key={product.id}
                        onClick={() => !isOutOfStock && addToCart(product)}
                        className={`cursor-pointer transition-colors ${
                          inCart 
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-semibold' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <td className="p-3 font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {product.sku}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {product.name}
                        </td>
                        <td className="p-3 text-slate-500">
                          {product.size || product.color ? `${product.size || ''} ${product.color || ''}` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {isOutOfStock ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              OUT OF STOCK
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              {product.quantity} (LOW)
                            </span>
                          ) : (
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {product.quantity}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {currency} {product.sale_price.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                              inCart
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-emerald-600'
                            }`}
                          >
                            {inCart ? `In Cart (${inCart.quantity})` : '+ Add'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID VIEW DISPLAY ON POS TERMINAL DASHBOARD */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const isOutOfStock = product.quantity <= 0;
                const isLowStock = product.quantity > 0 && product.quantity <= 5;
                const inCart = cart.find(i => i.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`group relative bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      inCart
                        ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md'
                    } ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {product.sku}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                          OUT OF STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                          LOW ({product.quantity})
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-slate-400">
                          Stock: {product.quantity}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {product.name}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {product.size && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{product.size}</span>}
                        {product.color && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{product.color}</span>}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        {currency} {product.sale_price.toLocaleString()}
                      </span>
                      {inCart && (
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* VERTICAL MIDDLE-EDGE TOGGLE BUTTON */}
      <button
        type="button"
        onClick={() => setIsCartOpen(!isCartOpen)}
        style={{ right: isCartOpen ? `${cartWidth}px` : '0px' }}
        className="fixed top-1/2 -translate-y-1/2 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-l-2xl shadow-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-emerald-500"
        title={isCartOpen ? 'Hide Cart Panel' : 'Show Cart Panel'}
      >
        <ShoppingCart className="w-4 h-4" />
        {cart.length > 0 && (
          <span className="bg-white text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
            {cart.length}
          </span>
        )}
        {isCartOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* RIGHT SECTION: SLIDING & RESIZABLE CART & CHECKOUT TERMINAL */}
      {isCartOpen && (
        <div className="flex shrink-0 h-full">
          {/* DRAGGABLE RESIZE HANDLE */}
          <div
            onMouseDown={handleMouseDown}
            className="w-1.5 hover:w-2 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 cursor-col-resize shrink-0 transition-all"
            title="Drag left/right to resize cart width"
          />

          <div
            style={{ width: `${cartWidth}px` }}
            className="bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto shrink-0 transition-all"
          >
        <div className="p-4 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setBuyerType('student')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  buyerType === 'student'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Student Buyer
              </button>
              <button
                type="button"
                onClick={() => setBuyerType('external_school')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  buyerType === 'external_school'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> External Bulk Buyer
              </button>
            </div>

            {buyerType === 'student' ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Student Name *"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Roll Number (e.g. 104)"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Class / Grade (e.g. 9-A)"
                    value={studentClass}
                    onChange={e => setStudentClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="External School / Organization Name *"
                  value={externalSchoolName}
                  onChange={e => setExternalSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Contact Person / Ref Notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" /> Cart ({cart.length} items)
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-medium text-rose-500 hover:text-rose-700 dark:hover:text-rose-400"
              >
                Clear Cart
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {cart.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <ShoppingCart className="w-8 h-8 mb-1 stroke-1 text-slate-300" />
                <p>Click items on the left to add to cart.</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-bold text-slate-800 dark:text-white line-clamp-1">
                      {item.product.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {currency} {item.product.sale_price.toLocaleString()} x {item.quantity}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mr-3">
                    <button
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="p-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="p-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currency} {(item.product.sale_price * item.quantity).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4" /> Cash
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Bank Transfer
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('easypaisa')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'easypaisa'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4" /> EasyPaisa
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{currency} {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Discount ({currency})</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-semibold outline-none dark:text-white"
              />
            </div>

            <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-white pt-1">
              <span>Grand Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">{currency} {grandTotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Received Amount ({currency}) *</span>
              <input
                type="number"
                min="0"
                value={receivedAmount}
                onChange={e => setReceivedAmount(e.target.value)}
                placeholder={grandTotal.toString()}
                className="w-28 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-sm outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            {pendingDues > 0 ? (
              <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-900 flex justify-between font-bold text-xs text-rose-600 dark:text-rose-400">
                <span>Pending Dues Record:</span>
                <span>{currency} {pendingDues.toLocaleString()}</span>
              </div>
            ) : (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 flex justify-between font-bold text-xs text-emerald-600 dark:text-emerald-400">
                <span>Payment Status:</span>
                <span>Paid in Full</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {processing ? 'Processing Sale...' : 'Process Sale & Print PDF Receipt'}
          </button>
        </div>
      </div>
    </div>
  )}

      {completedTx && (
        <InvoiceModal
          transaction={completedTx}
          settings={settings}
          onClose={() => setCompletedTx(null)}
        />
      )}
    </div>
  );
};
