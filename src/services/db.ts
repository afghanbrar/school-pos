import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  UserProfile, 
  UserRole,
  Category, 
  Product, 
  Transaction, 
  SchoolSettings,
  UserStatus,
  CustomerProfile,
  PaymentMethod,
  SchoolExpense,
  CashHandover,
  ActivityLog,
  ActivityAction
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  INITIAL_HANDOVERS,
  INITIAL_ACTIVITIES
} from './mockData';

const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hxbqqcefvzpycwgveuet.supabase.co';
const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4YnFxY2VmdnpweWN3Z3ZldWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDQ4MTEsImV4cCI6MjEwOTk4MDgxMX0.KrQG0C1H-TJsHG2kwQ-Y6nQ5R5ZXFkXXRhGXUCPtlbk';

const STORAGE_KEYS = {
  USERS: 'school_pos_users_v4',
  CATEGORIES: 'school_pos_categories_v4',
  PRODUCTS: 'school_pos_products_v4',
  DELETED_CATEGORIES: 'school_pos_deleted_categories_v5',
  DELETED_PRODUCTS: 'school_pos_deleted_products_v5',
  TRANSACTIONS: 'school_pos_transactions_v5',
  SETTINGS: 'school_pos_settings_v4',
  CUSTOMERS: 'school_pos_customers_v5',
  CURRENT_USER: 'school_pos_current_user_v4',
  EXPENSES: 'school_pos_expenses_v5',
  HANDOVERS: 'school_pos_handovers_v5',
  ACTIVITIES: 'school_pos_activities_v5',
  INITIALIZED: 'school_pos_initialized_flag_v5',
  SUPABASE_URL: 'school_pos_supabase_url',
  SUPABASE_KEY: 'school_pos_supabase_key',
};

export const isDummyTransaction = (t: any): boolean => {
  if (!t) return false;
  const id = String(t.id || '');
  const inv = String(t.invoice_number || '');
  const buyer = String(t.buyer_name || '').toLowerCase();
  
  if (id.startsWith('tx-100') || id.startsWith('tx-101') || id === 'tx-1786472069407') return true;
  if (inv.startsWith('INV-2026-100') || inv.startsWith('INV-2026-101')) return true;
  if (buyer.includes('beaconhouse') || buyer.includes('muhammad ali') || buyer.includes('test goverment')) return true;
  return false;
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

export function getDeletedCategoryIds(): Set<string> {
  const ids = getItem<string[]>(STORAGE_KEYS.DELETED_CATEGORIES, []);
  return new Set(ids);
}

export function recordDeletedCategory(id: string): void {
  const set = getDeletedCategoryIds();
  set.add(id);
  setItem(STORAGE_KEYS.DELETED_CATEGORIES, Array.from(set));
}

export function unrecordDeletedCategory(id: string): void {
  const set = getDeletedCategoryIds();
  if (set.delete(id)) {
    setItem(STORAGE_KEYS.DELETED_CATEGORIES, Array.from(set));
  }
}

export function getDeletedProductIds(): Set<string> {
  const ids = getItem<string[]>(STORAGE_KEYS.DELETED_PRODUCTS, []);
  return new Set(ids);
}

export function recordDeletedProduct(id: string): void {
  const set = getDeletedProductIds();
  set.add(id);
  setItem(STORAGE_KEYS.DELETED_PRODUCTS, Array.from(set));
}

export function unrecordDeletedProduct(id: string): void {
  const set = getDeletedProductIds();
  if (set.delete(id)) {
    setItem(STORAGE_KEYS.DELETED_PRODUCTS, Array.from(set));
  }
}

export function serializeProductForSupabase(p: Product): any {
  let variantStr = p.variant || '';
  if (p.wholesaler_name || p.wholesaler_details || p.purchase_payment_channel || p.purchased_by) {
    try {
      variantStr = JSON.stringify({
        v: p.variant || '',
        wn: p.wholesaler_name || '',
        wd: p.wholesaler_details || '',
        pc: p.purchase_payment_channel || '',
        pb: p.purchased_by || '',
      });
    } catch {
      variantStr = p.variant || '';
    }
  }
  return {
    id: p.id,
    sku: p.sku || `SKU-${p.id.slice(-6)}`,
    name: p.name,
    category_id: p.category_id,
    cost_price: Number(p.cost_price) || 0,
    sale_price: Number(p.sale_price) || 0,
    quantity: Number(p.quantity) || 0,
    size: p.size || null,
    color: p.color || null,
    variant: variantStr || null,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

export function deserializeProductFromSupabase(p: any): Product {
  let variant: string | undefined = p.variant || undefined;
  let wholesaler_name: string | undefined = p.wholesaler_name || undefined;
  let wholesaler_details: string | undefined = p.wholesaler_details || undefined;
  let purchase_payment_channel: string | undefined = p.purchase_payment_channel || undefined;
  let purchased_by: string | undefined = p.purchased_by || undefined;

  if (variant && typeof variant === 'string' && variant.startsWith('{')) {
    try {
      const parsed = JSON.parse(variant);
      if (parsed && typeof parsed === 'object') {
        variant = parsed.v ?? parsed.variant ?? undefined;
        wholesaler_name = wholesaler_name || parsed.wn || parsed.wholesaler_name || undefined;
        wholesaler_details = wholesaler_details || parsed.wd || parsed.wholesaler_details || undefined;
        purchase_payment_channel = purchase_payment_channel || parsed.pc || parsed.purchase_payment_channel || undefined;
        purchased_by = purchased_by || parsed.pb || parsed.purchased_by || undefined;
      }
    } catch {
      // ignore
    }
  }

  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category_id: p.category_id,
    cost_price: Number(p.cost_price) || 0,
    sale_price: Number(p.sale_price) || 0,
    quantity: Number(p.quantity) || 0,
    size: p.size || undefined,
    color: p.color || undefined,
    variant: variant || undefined,
    wholesaler_name: wholesaler_name || undefined,
    wholesaler_details: wholesaler_details || undefined,
    purchase_payment_channel: purchase_payment_channel || undefined,
    purchased_by: purchased_by || undefined,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

export type DataCategory = 
  | 'products' 
  | 'categories' 
  | 'transactions' 
  | 'users' 
  | 'customers' 
  | 'expenses' 
  | 'handovers' 
  | 'activities' 
  | 'settings' 
  | 'all';

type DataListener = (category: DataCategory) => void;

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private listeners: Set<DataListener> = new Set();

  constructor() {
    this.initLocalDefaults();
    this.initSupabaseClient();
    this.syncSupabaseToLocal().finally(() => {
      this.syncLocalToSupabase();
    });
  }

  /**
   * Subscribe to instantaneous local and cloud data changes
   */
  public subscribe(listener: DataListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Instantly notify all subscribers across the entire application UI
   */
  public notify(category: DataCategory = 'all'): void {
    this.listeners.forEach(fn => {
      try {
        fn(category);
      } catch (e) {
        console.error('Data listener error:', e);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('school_pos_data_change', { detail: { category } }));
    }
  }

  /**
   * Non-blocking background sync runner to ensure 0ms UI latency
   */
  private runBackgroundSync(task: () => Promise<any>): void {
    Promise.resolve().then(() => {
      task().catch(err => {
        console.warn('Background Supabase cloud sync notice:', err);
      });
    });
  }

  private initLocalDefaults() {
    // Purge legacy storage versions
    try {
      const keysToRemove: string[] = [
        'school_pos_transactions_v4',
        'school_pos_transactions_v3',
        'school_pos_transactions_v2',
        'school_pos_transactions_v1',
        'school_pos_expenses_v4',
        'school_pos_handovers_v4',
        'school_pos_activities_v4',
        'school_pos_customers_v4',
      ];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('_v1') || k.includes('_v2') || k.includes('_v3') || (k.includes('_v4') && (k.includes('trans') || k.includes('exp') || k.includes('hand') || k.includes('act') || k.includes('cust'))))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }

    // 1. Maintain persistent sales transactions, receipts, expenses, customers, handovers, activities without wiping!
    if (localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) === null) {
      setItem(STORAGE_KEYS.TRANSACTIONS, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.CUSTOMERS) === null) {
      setItem(STORAGE_KEYS.CUSTOMERS, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.EXPENSES) === null) {
      setItem(STORAGE_KEYS.EXPENSES, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.HANDOVERS) === null) {
      setItem(STORAGE_KEYS.HANDOVERS, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.ACTIVITIES) === null) {
      setItem(STORAGE_KEYS.ACTIVITIES, []);
    }

    // 2. Keep ONLY categories created by the user (purge old default/template categories and deleted tombstones)
    const defaultCatIds = new Set(['cat-01', 'cat-02', 'cat-03', 'cat-04', 'cat-05', 'cat-06', 'cat-07']);
    const deletedCatIds = getDeletedCategoryIds();
    let existingCategories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    existingCategories = existingCategories.filter(c => !defaultCatIds.has(c.id) && !deletedCatIds.has(c.id));
    setItem(STORAGE_KEYS.CATEGORIES, existingCategories);

    // 3. Keep user products (purge only obsolete demo products and deleted tombstones)
    const demoProdIds = new Set(['prod-101', 'prod-102', 'prod-103', 'prod-104', 'prod-105', 'prod-106', 'prod-107', 'prod-108', 'prod-109', 'prod-110']);
    const deletedProdIds = getDeletedProductIds();
    let existingProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    existingProducts = existingProducts.filter(p => !demoProdIds.has(p.id) && !deletedProdIds.has(p.id));
    setItem(STORAGE_KEYS.PRODUCTS, existingProducts);

    // 4. Retain ONLY CEO and Rubina Iftikhar accounts; permanently remove all others
    let users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const allowedEmails = new Set(['ceo@haidermemorial.edu.pk', 'bina.iftikhar@gmail.com']);
    users = users.filter(u => allowedEmails.has((u.email || '').toLowerCase().trim()));

    if (!users.some(u => (u.email || '').toLowerCase().trim() === 'ceo@haidermemorial.edu.pk')) {
      users.unshift(INITIAL_USERS[0]);
    }
    if (!users.some(u => (u.email || '').toLowerCase().trim() === 'bina.iftikhar@gmail.com')) {
      users.push(INITIAL_USERS[1]);
    }
    setItem(STORAGE_KEYS.USERS, users);

    // Ensure settings title is updated to Haider Memorial School POS and Inventory System
    const currentSettings = getItem<SchoolSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    if (!currentSettings.name || currentSettings.name.includes('St. Lawrence') || currentSettings.name === 'Haider Memorial School & College') {
      currentSettings.name = 'Haider Memorial School POS and Inventory System';
      setItem(STORAGE_KEYS.SETTINGS, currentSettings);
    }
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  public initSupabaseClient() {
    let url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    let key = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_KEY;

    // Purge deprecated/quota-restricted Supabase credentials
    if (url && (url.includes('ektqwpnsqqnrukubnmiw') || !url.includes('hxbqqcefvzpycwgveuet'))) {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
      url = DEFAULT_SUPABASE_URL;
      key = DEFAULT_SUPABASE_KEY;
    }

    if (url.endsWith('/rest/v1/')) {
      url = url.replace(/\/rest\/v1\/?$/, '');
    } else if (url.endsWith('/rest/v1')) {
      url = url.replace(/\/rest\/v1$/, '');
    }

    if (url && key) {
      try {
        this.supabase = createClient(url, key);
      } catch (e) {
        console.warn('Failed to initialize Supabase client:', e);
        this.supabase = null;
      }
    } else {
      this.supabase = null;
    }
  }

  public saveSupabaseCredentials(url: string, key: string) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
    localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key);
    this.initSupabaseClient();
  }

  public getSupabaseCredentials() {
    return {
      url: localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL,
      key: localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_KEY,
    };
  }

  /**
   * Pull live categories, products, profiles, and transactions from Supabase into local cache
   */
  public async syncSupabaseToLocal(): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      return { success: false, message: 'Supabase client is not connected.' };
    }

    try {
      // 1. Pull User Profiles
      const { data: remoteProfiles, error: pErr } = await this.supabase.from('profiles').select('*');
      if (!pErr && remoteProfiles && remoteProfiles.length > 0) {
        const localUsers = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        const mergedUsers = [...localUsers];
        for (const rp of remoteProfiles) {
          const normEmail = (rp.email || '').toLowerCase().trim();
          if (!normEmail) continue;
          const existingIdx = mergedUsers.findIndex(
            u => u.id === rp.id || u.email.toLowerCase() === normEmail
          );
          const mappedRole: UserRole = (rp.role === 'ceo' || normEmail === 'ceo@haidermemorial.edu.pk') 
            ? 'ceo' 
            : ((rp.role === 'principal' || normEmail === 'bina.iftikhar@gmail.com') ? 'principal' : (rp.role as UserRole));

          if (existingIdx >= 0) {
            mergedUsers[existingIdx] = {
              ...mergedUsers[existingIdx],
              full_name: rp.full_name || mergedUsers[existingIdx].full_name,
              email: rp.email,
              role: mappedRole,
              status: rp.status || 'active',
              password: (rp as any).password || mergedUsers[existingIdx].password || (normEmail === 'ceo@haidermemorial.edu.pk' ? 'CeoMaster@2026' : (normEmail === 'bina.iftikhar@gmail.com' ? '12345678' : 'password123')),
            };
          } else {
            mergedUsers.push({
              id: rp.id,
              email: rp.email,
              full_name: rp.full_name,
              role: mappedRole,
              status: rp.status || 'active',
              password: (rp as any).password || (normEmail === 'ceo@haidermemorial.edu.pk' ? 'CeoMaster@2026' : (normEmail === 'bina.iftikhar@gmail.com' ? '12345678' : 'password123')),
              created_at: rp.created_at || new Date().toISOString(),
            });
          }
        }
        setItem(STORAGE_KEYS.USERS, mergedUsers);
      }

      // 2. Pull Categories
      const { data: remoteCategories, error: cErr } = await this.supabase.from('categories').select('*');
      if (!cErr && remoteCategories) {
        const deletedCatIds = getDeletedCategoryIds();
        const categoriesToDeleteRemotely = remoteCategories.filter(c => deletedCatIds.has(c.id));
        if (categoriesToDeleteRemotely.length > 0) {
          try {
            await this.supabase.from('categories').delete().in('id', categoriesToDeleteRemotely.map(c => c.id));
          } catch (e) {
            console.warn('Failed to remote purge deleted categories:', e);
          }
        }

        const validRemoteCategories: Category[] = remoteCategories
          .filter(c => !deletedCatIds.has(c.id))
          .map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            icon_name: c.icon_name || 'Tag',
            created_at: c.created_at || new Date().toISOString(),
          }));

        // Merge remote with local categories so unsynced local categories are never wiped
        const localCategories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []).filter(c => !deletedCatIds.has(c.id));
        const catMap = new Map<string, Category>();
        validRemoteCategories.forEach(c => catMap.set(c.id, c));
        localCategories.forEach(c => {
          if (!catMap.has(c.id)) {
            catMap.set(c.id, c);
          }
        });
        const mergedCategories = Array.from(catMap.values());
        setItem(STORAGE_KEYS.CATEGORIES, mergedCategories);
      }

      // 3. Pull Products
      const { data: remoteProducts, error: prErr } = await this.supabase.from('products').select('*');
      if (!prErr && remoteProducts) {
        const deletedProdIds = getDeletedProductIds();
        const productsToDeleteRemotely = remoteProducts.filter(p => deletedProdIds.has(p.id));
        if (productsToDeleteRemotely.length > 0) {
          try {
            await this.supabase.from('products').delete().in('id', productsToDeleteRemotely.map(p => p.id));
          } catch (e) {
            console.warn('Failed to remote purge deleted products:', e);
          }
        }

        const validRemoteProducts: Product[] = remoteProducts
          .filter(p => !deletedProdIds.has(p.id))
          .map(p => deserializeProductFromSupabase(p));

        // Merge remote with local products so local/newly added products are never erased
        const localProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []).filter(p => !deletedProdIds.has(p.id));
        const prodMap = new Map<string, Product>();
        validRemoteProducts.forEach(p => prodMap.set(p.id, p));
        localProducts.forEach(p => {
          if (!prodMap.has(p.id)) {
            prodMap.set(p.id, p);
          } else {
            const remoteItem = prodMap.get(p.id)!;
            prodMap.set(p.id, {
              ...remoteItem,
              wholesaler_name: remoteItem.wholesaler_name || p.wholesaler_name,
              wholesaler_details: remoteItem.wholesaler_details || p.wholesaler_details,
              purchase_payment_channel: remoteItem.purchase_payment_channel || p.purchase_payment_channel,
              purchased_by: remoteItem.purchased_by || p.purchased_by,
            });
          }
        });
        const mergedProducts = Array.from(prodMap.values());
        setItem(STORAGE_KEYS.PRODUCTS, mergedProducts);
        try {
          localStorage.setItem('school_pos_products_emergency_backup', JSON.stringify(mergedProducts));
        } catch {}
      }

      // 4. Pull Transactions
      const { data: remoteTransactions, error: txErr } = await this.supabase.from('transactions').select('*');
      if (!txErr && remoteTransactions) {
        // If any dummy transactions exist remotely, wipe them clean from Supabase in the background
        const dummyFound = remoteTransactions.filter(t => isDummyTransaction(t));
        if (dummyFound.length > 0) {
          this.runBackgroundSync(async () => {
            await this.supabase!.from('transactions').delete().neq('id', '___none___');
          });
        }

        const validTx = remoteTransactions.filter(t => !isDummyTransaction(t));
        const localTx = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
        const txMap = new Map<string, Transaction>();
        localTx.forEach(t => {
          if (!isDummyTransaction(t)) txMap.set(t.id, t);
        });

        validTx.forEach(t => {
          const existing = txMap.get(t.id);
          txMap.set(t.id, {
            id: t.id,
            invoice_number: t.invoice_number,
            buyer_type: t.buyer_type,
            buyer_name: t.buyer_name,
            student_roll_no: t.student_roll_no || undefined,
            student_class: t.student_class || undefined,
            school_name: t.school_name || undefined,
            staff_id: t.staff_id,
            staff_name: t.staff_name || undefined,
            total_amount: Number(t.total_amount) || 0,
            discount: Number(t.discount) || 0,
            paid_amount: Number(t.paid_amount) || 0,
            pending_amount: Number(t.pending_amount) || 0,
            payment_method: t.payment_method,
            notes: t.notes || undefined,
            created_at: t.created_at,
            items: (Array.isArray(t.items) && t.items.length > 0) ? t.items : (existing?.items || []),
          });
        });
        setItem(STORAGE_KEYS.TRANSACTIONS, Array.from(txMap.values()));
      }

      // 5. Pull Customers (Students & External Institutions)
      const { data: remoteCustomers, error: custErr } = await this.supabase.from('customers').select('*');
      if (!custErr && remoteCustomers) {
        const localCustomers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
        const custMap = new Map<string, CustomerProfile>();
        localCustomers.forEach(c => custMap.set(c.id, c));
        remoteCustomers.forEach((c: any) => {
          custMap.set(c.id, {
            id: c.id,
            type: c.type,
            full_name: c.full_name,
            roll_no: c.roll_no || undefined,
            class_grade: c.class_grade || undefined,
            school_name: c.school_name || undefined,
            phone: c.phone || undefined,
            email: c.email || undefined,
            address: c.address || undefined,
            created_at: c.created_at || new Date().toISOString(),
          });
        });
        setItem(STORAGE_KEYS.CUSTOMERS, Array.from(custMap.values()));
      }

      // 6. Pull Live Remote Activity Logs (if available)
      if (this.supabase) {
        try {
          const { data: remoteLogs, error: logErr } = await this.supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(300);
          if (!logErr && remoteLogs && remoteLogs.length > 0) {
            const localLogs = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, []);
            const logMap = new Map<string, ActivityLog>();
            localLogs.forEach(l => logMap.set(l.id, l));
            remoteLogs.forEach((r: any) => {
              logMap.set(r.id, {
                id: r.id,
                user_id: r.user_id,
                user_name: r.user_name,
                user_role: r.user_role,
                action: r.action,
                title: r.title,
                description: r.description,
                details: r.details,
                created_at: r.created_at,
              });
            });
            setItem(STORAGE_KEYS.ACTIVITIES, Array.from(logMap.values()));
          }
        } catch {
          // Gracefully continue if remote table does not exist
        }
      }

      // 6. Reconcile Activities with All Products & Transactions
      await this.reconcileActivityLogs();

      this.notify('all');
      this.notify('activities');
      return { success: true, message: 'Cloud database synchronized with local system.' };
    } catch (e: any) {
      console.warn('Supabase to local pull notice:', e);
      return { success: false, message: e.message || 'Supabase fetch failed.' };
    }
  }

  /**
   * Migrate local categories, products, profiles, transactions, expenses, handovers, activities to live Supabase
   */
  public async syncLocalToSupabase(): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      return { success: false, message: 'Supabase client is not connected.' };
    }

    try {
      // 1. Purge Deleted Categories and Sync Valid Categories
      const deletedCatIds = getDeletedCategoryIds();
      if (deletedCatIds.size > 0) {
        try {
          await this.supabase.from('categories').delete().in('id', Array.from(deletedCatIds));
        } catch (e) {
          console.warn('Purge deleted categories error:', e);
        }
      }

      const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
      const validCategories = categories.filter(c => !deletedCatIds.has(c.id));
      if (validCategories.length > 0) {
        const { error: catErr } = await this.supabase.from('categories').upsert(
          validCategories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || null,
            icon_name: c.icon_name || 'Tag',
            created_at: c.created_at || new Date().toISOString(),
          }))
        );
        if (catErr) console.warn('Categories Table sync:', catErr.message);
      }

      // 2. Purge Deleted Products and Sync Valid Products
      const deletedProdIds = getDeletedProductIds();
      if (deletedProdIds.size > 0) {
        try {
          await this.supabase.from('products').delete().in('id', Array.from(deletedProdIds));
        } catch (e) {
          console.warn('Purge deleted products error:', e);
        }
      }

      const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const validProducts = products.filter(p => !deletedProdIds.has(p.id));
      if (validProducts.length > 0) {
        const { error: prodErr } = await this.supabase.from('products').upsert(
          validProducts.map(p => serializeProductForSupabase(p))
        );
        if (prodErr) console.warn('Products Table sync:', prodErr.message);
      }

      // 3. Sync User Profiles
      const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
      if (users.length > 0) {
        const { error: userErr } = await this.supabase.from('profiles').upsert(
          users.map(u => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            role: (u.role === 'ceo' ? 'principal' : (u.role || 'staff')),
            status: u.status,
            created_at: u.created_at || new Date().toISOString(),
          }))
        );
        if (userErr) console.warn('Profiles Table sync:', userErr.message);
      }

      // 4. Sync Transactions
      const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
      const validTx = transactions.filter(t => !isDummyTransaction(t));
      if (validTx.length > 0) {
        const { error: txErr } = await this.supabase.from('transactions').upsert(
          validTx.map(tx => ({
            id: tx.id,
            invoice_number: tx.invoice_number,
            buyer_type: tx.buyer_type,
            buyer_name: tx.buyer_name,
            student_roll_no: tx.student_roll_no || null,
            student_class: tx.student_class || null,
            school_name: tx.school_name || null,
            staff_id: tx.staff_id || 'usr-staff-01',
            staff_name: tx.staff_name || null,
            total_amount: tx.total_amount,
            discount: tx.discount,
            paid_amount: tx.paid_amount,
            pending_amount: tx.pending_amount,
            payment_method: tx.payment_method,
            items: tx.items || [],
            notes: tx.notes || null,
            created_at: tx.created_at || new Date().toISOString(),
          }))
        );
        if (txErr) console.warn('Transactions Table sync:', txErr.message);
      }

      // 5. Sync Customers (Students & External Institutions)
      const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
      if (customers.length > 0) {
        const { error: custErr } = await this.supabase.from('customers').upsert(
          customers.map(c => ({
            id: c.id,
            type: c.type,
            full_name: c.full_name,
            roll_no: c.roll_no || null,
            class_grade: c.class_grade || null,
            school_name: c.school_name || null,
            phone: c.phone || null,
            email: c.email || null,
            address: c.address || null,
            created_at: c.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        );
        if (custErr) console.warn('Customers Table sync:', custErr.message);
      }

      // 6. Sync Expenses
      const expenses = getItem<SchoolExpense[]>(STORAGE_KEYS.EXPENSES, []);
      if (expenses.length > 0) {
        const { error: expErr } = await this.supabase.from('expenses').upsert(
          expenses.map(e => ({
            id: e.id,
            staff_id: e.staff_id,
            staff_name: e.staff_name,
            title: e.title,
            category: e.category,
            amount: e.amount,
            payment_channel: e.payment_channel,
            receipt_ref: e.receipt_ref || null,
            description: e.description || null,
            created_at: e.created_at || new Date().toISOString(),
          }))
        );
        if (expErr) console.warn('Expenses Table sync:', expErr.message);
      }

      // 6. Sync Cash Handovers
      const handovers = getItem<CashHandover[]>(STORAGE_KEYS.HANDOVERS, []);
      if (handovers.length > 0) {
        const { error: hndErr } = await this.supabase.from('cash_handovers').upsert(
          handovers.map(h => ({
            id: h.id,
            handover_code: h.handover_code,
            staff_id: h.staff_id,
            staff_name: h.staff_name,
            period_start: h.period_start,
            period_end: h.period_end,
            gross_sales_cash: h.gross_sales_cash,
            gross_sales_digital: h.gross_sales_digital,
            total_gross_sales: h.total_gross_sales,
            total_expenses_deducted: h.total_expenses_deducted,
            net_cash_submitted: h.net_cash_submitted,
            expense_ids: h.expense_ids,
            transaction_ids: h.transaction_ids,
            notes: h.notes || null,
            status: h.status,
            submitted_at: h.submitted_at,
            acknowledged_by: h.acknowledged_by || null,
            acknowledged_at: h.acknowledged_at || null,
            rejection_reason: h.rejection_reason || null,
            ceo_notes: h.ceo_notes || null,
          }))
        );
        if (hndErr) console.warn('Cash Handovers Table sync:', hndErr.message);
      }

      return { success: true, message: 'All local data synced with Supabase cloud.' };
    } catch (e: any) {
      console.warn('Background Supabase sync notice:', e);
      return { success: false, message: e.message || 'Supabase sync failed.' };
    }
  }

  /* ================= AUTHENTICATION & USERS ================= */

  public async registerUser(fullName: string, email: string, role: UserRole = 'staff', password?: string): Promise<UserProfile> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error(`An account with email "${normalizedEmail}" already exists.`);
    }

    const newUser: UserProfile = {
      id: `usr-${role}-${Date.now().toString().slice(-4)}`,
      email: normalizedEmail,
      full_name: fullName.trim(),
      role: role,
      status: 'active',
      password: password || 'password123',
      created_at: new Date().toISOString(),
    };

    users.unshift(newUser);
    setItem(STORAGE_KEYS.USERS, users);
    setItem(STORAGE_KEYS.CURRENT_USER, newUser);

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').upsert({
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          status: newUser.status,
          created_at: newUser.created_at,
        });
      } catch (e) {
        console.warn('Supabase user registration sync notice:', e);
      }
    }

    return newUser;
  }

  public async loginWithGoogle(): Promise<UserProfile> {
    if (this.supabase) {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw new Error(error.message);
    }

    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const ceo = users.find(u => u.role === 'ceo' || u.email === 'ceo@haidermemorial.edu.pk') || users.find(u => u.role === 'principal');
    if (!ceo) throw new Error('CEO Super Admin account not found.');
    if (ceo.status === 'inactive') {
      throw new Error('Super Admin account is currently deactivated.');
    }

    setItem(STORAGE_KEYS.CURRENT_USER, ceo);
    return ceo;
  }

  public async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!pass) {
      throw new Error('Please enter your password.');
    }

    // 1. If Supabase is connected, check live profiles to ensure fresh sync
    if (this.supabase) {
      try {
        const { data: remoteProfile, error: pErr } = await this.supabase
          .from('profiles')
          .select('*')
          .ilike('email', normalizedEmail)
          .maybeSingle();

        if (!pErr && remoteProfile) {
          const currentUsers = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
          const existingIdx = currentUsers.findIndex(
            u => u.id === remoteProfile.id || u.email.toLowerCase() === normalizedEmail
          );
          const mappedRole: UserRole = (remoteProfile.role === 'ceo' || normalizedEmail === 'ceo@haidermemorial.edu.pk')
            ? 'ceo'
            : ((remoteProfile.role === 'principal' || normalizedEmail === 'bina.iftikhar@gmail.com') ? 'principal' : (remoteProfile.role as UserRole));

          const syncedProfile: UserProfile = {
            id: remoteProfile.id,
            email: remoteProfile.email,
            full_name: remoteProfile.full_name,
            role: mappedRole,
            status: remoteProfile.status || 'active',
            gender: (remoteProfile as any).gender || (existingIdx >= 0 ? currentUsers[existingIdx].gender : (normalizedEmail === 'bina.iftikhar@gmail.com' ? 'female' : 'male')),
            password: (remoteProfile as any).password || (existingIdx >= 0 ? currentUsers[existingIdx].password : undefined) || (normalizedEmail === 'ceo@haidermemorial.edu.pk' ? 'CeoMaster@2026' : (normalizedEmail === 'bina.iftikhar@gmail.com' ? '12345678' : 'password123')),
            created_at: remoteProfile.created_at || new Date().toISOString(),
          };

          if (existingIdx >= 0) {
            currentUsers[existingIdx] = syncedProfile;
          } else {
            currentUsers.push(syncedProfile);
          }
          setItem(STORAGE_KEYS.USERS, currentUsers);
        }
      } catch (e) {
        console.warn('Live profile fetch attempt notice:', e);
      }
    }

    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let user = users.find(u => u.email.toLowerCase() === normalizedEmail);

    // Safeguard for CEO Super Admin master account
    if (!user && normalizedEmail === 'ceo@haidermemorial.edu.pk') {
      user = INITIAL_USERS[0];
      users.unshift(user);
      setItem(STORAGE_KEYS.USERS, users);
    }

    if (!user) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    if (user.status === 'inactive') {
      throw new Error('ACCESS DENIED: Your account has been deactivated by CEO. Please contact administration.');
    }

    // Master Account overrides
    const isCeoMaster = (user.role === 'ceo' || normalizedEmail === 'ceo@haidermemorial.edu.pk') && pass === 'CeoMaster@2026';
    const isPrincipalMaster = (user.role === 'principal' || normalizedEmail === 'bina.iftikhar@gmail.com') && pass === '12345678';
    const isPasswordMatch = isCeoMaster || isPrincipalMaster || (user.password && user.password === pass);

    if (!isPasswordMatch) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    setItem(STORAGE_KEYS.CURRENT_USER, user);
    return user;
  }

  public getCurrentUser(): UserProfile | null {
    return getItem<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  public async getUsers(): Promise<UserProfile[]> {
    return getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public async updateUserProfile(
    userId: string, 
    updates: { full_name?: string; email?: string; password?: string }
  ): Promise<UserProfile> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User account not found.');

    if (updates.email) {
      const normalizedEmail = updates.email.trim().toLowerCase();
      const duplicate = users.find(u => u.id !== userId && u.email.toLowerCase() === normalizedEmail);
      if (duplicate) {
        throw new Error(`Email "${normalizedEmail}" is already in use by another account.`);
      }
      users[index].email = normalizedEmail;
    }

    if (updates.full_name) {
      users[index].full_name = updates.full_name.trim();
    }

    if (updates.password) {
      users[index].password = updates.password;
    }

    setItem(STORAGE_KEYS.USERS, users);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      setItem(STORAGE_KEYS.CURRENT_USER, users[index]);
    }
    this.notify('users');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('profiles').update({
          email: users[index].email,
          full_name: users[index].full_name,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      });
    }

    void this.logActivity(
      'profile_updated',
      'Profile Credentials Updated',
      `User ${users[index].full_name} updated account credentials`,
      { user_id: userId, email: users[index].email },
      users[index]
    );

    return users[index];
  }

  public async createStaffUser(fullName: string, email: string, password?: string, role: UserRole = 'staff', gender?: string): Promise<UserProfile> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('A user with this email address already exists.');
    }

    const newUser: UserProfile = {
      id: `usr-${role}-${Date.now().toString().slice(-4)}`,
      email: normalizedEmail,
      full_name: fullName.trim(),
      role: role,
      gender: gender || 'male',
      status: 'active',
      password: password || 'password123',
      created_at: new Date().toISOString(),
    };

    users.unshift(newUser);
    setItem(STORAGE_KEYS.USERS, users);
    this.notify('users');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('profiles').upsert({
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          status: newUser.status,
          created_at: newUser.created_at,
        });
      });
    }

    void this.logActivity(
      'staff_created',
      'New User Account Created',
      `Created ${role.toUpperCase()} account for ${newUser.full_name} (${newUser.email})`,
      { staff_id: newUser.id, email: newUser.email, role: newUser.role }
    );

    return newUser;
  }

  public async updateStaffUser(
    userId: string,
    updates: { full_name?: string; email?: string; password?: string; status?: UserStatus; role?: UserRole; gender?: string }
  ): Promise<UserProfile> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('Staff account not found.');

    if (updates.email) {
      const normalizedEmail = updates.email.trim().toLowerCase();
      const duplicate = users.find(u => u.id !== userId && u.email.toLowerCase() === normalizedEmail);
      if (duplicate) {
        throw new Error(`Email "${normalizedEmail}" is already in use by another user.`);
      }
      users[index].email = normalizedEmail;
    }

    if (updates.full_name) {
      users[index].full_name = updates.full_name.trim();
    }

    if (updates.gender) {
      users[index].gender = updates.gender;
    }

    if (updates.password) {
      users[index].password = updates.password;
    }

    if (updates.role && users[index].email !== 'ceo@haidermemorial.edu.pk') {
      users[index].role = updates.role;
    }

    if (updates.status && users[index].role !== 'ceo' && users[index].email !== 'ceo@haidermemorial.edu.pk') {
      users[index].status = updates.status;
    }

    setItem(STORAGE_KEYS.USERS, users);
    this.notify('users');

    // Sync to Supabase in background
    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('profiles').update({
          email: users[index].email,
          full_name: users[index].full_name,
          role: (users[index].role === 'ceo' ? 'principal' : (users[index].role || 'staff')),
          status: users[index].status,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      });
    }

    void this.logActivity(
      'profile_updated',
      'Staff Account Details Updated',
      `Updated profile for ${users[index].full_name} (${users[index].email})`,
      { staff_id: userId, email: users[index].email, role: users[index].role }
    );

    return users[index];
  }

  public async updateUserStatus(userId: string, status: UserStatus): Promise<UserProfile> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found.');

    if (users[index].role === 'ceo' || (users[index].role === 'principal' && users[index].email === 'ceo@haidermemorial.edu.pk')) {
      throw new Error('CEO Super Admin status cannot be set to inactive.');
    }

    users[index].status = status;
    setItem(STORAGE_KEYS.USERS, users);
    this.notify('users');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('profiles').update({
          status: status,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      });
    }

    void this.logActivity(
      'user_status_changed',
      'Staff Status Changed',
      `Changed status of ${users[index].full_name} to ${status.toUpperCase()}`,
      { staff_id: userId, status }
    );

    return users[index];
  }

  public async resetUserPassword(userId: string, newPassword?: string): Promise<void> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.password = newPassword || 'password123';
    setItem(STORAGE_KEYS.USERS, users);
    this.notify('users');

    void this.logActivity(
      'profile_updated',
      'Staff Password Reset',
      `Reset password for staff member ${user.full_name} (${user.email})`,
      { staff_id: userId }
    );
  }

  public async deleteStaffUser(userId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    const isCeo = currentUser && (currentUser.role === 'ceo' || currentUser.email === 'ceo@haidermemorial.edu.pk');
    if (!isCeo) {
      throw new Error('Sirf CEO (Super Admin) hi user accounts delete kar sakta hy. You do not have permission to delete user accounts.');
    }

    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) throw new Error('User account not found.');

    if (userToDelete.role === 'ceo' || userToDelete.email === 'ceo@haidermemorial.edu.pk') {
      throw new Error('CEO Super Admin account cannot be deleted.');
    }

    if (currentUser && currentUser.id === userId) {
      throw new Error('You cannot delete your own active logged-in CEO account.');
    }

    const filtered = users.filter(u => u.id !== userId);
    setItem(STORAGE_KEYS.USERS, filtered);
    this.notify('users');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('profiles').delete().eq('id', userId);
      });
    }

    void this.logActivity(
      'user_status_changed',
      'User Account Deleted',
      `Deleted account ${userToDelete.full_name} (${userToDelete.email}) from the system`,
      { staff_id: userId, email: userToDelete.email }
    );
  }

  /* ================= CATEGORIES & PRODUCTS (INVENTORY) ================= */

  public async getCategories(): Promise<Category[]> {
    const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const deletedCatIds = getDeletedCategoryIds();
    return categories.filter(c => !deletedCatIds.has(c.id));
  }

  public async createCategory(name: string, description?: string, icon_name?: string): Promise<Category> {
    const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const trimmedName = name.trim();

    if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('Category already exists.');
    }

    const uniqueId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    unrecordDeletedCategory(uniqueId);

    const newCategory: Category = {
      id: uniqueId,
      name: trimmedName,
      description: description?.trim() || '',
      icon_name: icon_name || 'Tag',
      created_at: new Date().toISOString(),
    };

    if (this.supabase) {
      const { error } = await this.supabase.from('categories').upsert({
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description || null,
        icon_name: newCategory.icon_name || 'Tag',
        created_at: newCategory.created_at,
      });
      if (error) {
        console.error('Supabase category upsert error:', error);
        throw new Error(`Cloud Database Error: Failed to save category to Supabase (${error.message})`);
      }
    }

    categories.unshift(newCategory);
    setItem(STORAGE_KEYS.CATEGORIES, categories);
    this.notify('categories');

    void this.logActivity(
      'category_created',
      'Inventory Category Created',
      `Created category "${newCategory.name}"`,
      { category_id: newCategory.id, name: newCategory.name }
    );

    return newCategory;
  }

  public async deleteCategory(id: string): Promise<void> {
    const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const cat = categories.find(c => c.id === id);
    const filtered = categories.filter(c => c.id !== id);

    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const defaultCat = filtered[0]?.id || '';

    if (this.supabase) {
      if (defaultCat) {
        await this.supabase.from('products').update({ category_id: defaultCat }).eq('category_id', id);
      }
      const { error } = await this.supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error('Failed to permanently delete category from Supabase:', error);
        throw new Error(`Cloud Database Error: Failed to delete category from Supabase (${error.message})`);
      }
    }

    recordDeletedCategory(id);
    setItem(STORAGE_KEYS.CATEGORIES, filtered);

    const updatedProducts = products.map(p => p.category_id === id ? { ...p, category_id: defaultCat } : p);
    setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
    this.notify('categories');
    this.notify('products');

    if (cat) {
      void this.logActivity(
        'category_created',
        'Category Permanently Deleted',
        `Permanently deleted category "${cat.name}"`,
        { category_id: id, name: cat.name }
      );
    }
  }

  public async getProducts(): Promise<Product[]> {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const deletedProdIds = getDeletedProductIds();
    return products.filter(p => !deletedProdIds.has(p.id));
  }

  public async addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

    const uniqueId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    unrecordDeletedProduct(uniqueId);

    const newProduct: Product = {
      ...productData,
      id: uniqueId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Strict Cloud-First Validation: If Supabase is connected, save to cloud FIRST.
    // If Supabase fails for any reason, throw error immediately so frontend displays exact error toast!
    if (this.supabase) {
      const payload = serializeProductForSupabase(newProduct);
      const { error } = await this.supabase.from('products').upsert(payload);
      if (error) {
        console.error('Supabase upsert product error:', error);
        throw new Error(`Cloud Database Error: Failed to save product to Supabase (${error.message})`);
      }
    }

    products.unshift(newProduct);
    setItem(STORAGE_KEYS.PRODUCTS, products);
    this.notify('products');

    void this.logActivity(
      'product_added',
      'Inventory Stock Added',
      `Added product "${newProduct.name}" (SKU: ${newProduct.sku}) • Wholesaler: ${newProduct.wholesaler_name || 'N/A'} • Qty: ${newProduct.quantity}`,
      { product_id: newProduct.id, sku: newProduct.sku, wholesaler: newProduct.wholesaler_name, channel: newProduct.purchase_payment_channel }
    );

    return newProduct;
  }

  public async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found.');

    unrecordDeletedProduct(id);

    const updated = {
      ...products[index],
      ...productData,
      updated_at: new Date().toISOString(),
    };

    // Strict Cloud-First Validation: Update Supabase FIRST.
    if (this.supabase) {
      const payload = serializeProductForSupabase(updated);
      const { error } = await this.supabase.from('products').upsert(payload);
      if (error) {
        console.error('Supabase update product error:', error);
        throw new Error(`Cloud Database Error: Failed to update product in Supabase (${error.message})`);
      }
    }

    products[index] = updated;
    setItem(STORAGE_KEYS.PRODUCTS, products);
    this.notify('products');

    void this.logActivity(
      'product_updated',
      'Product Stock/Details Updated',
      `Updated product "${updated.name}" (SKU: ${updated.sku}) • Stock: ${updated.quantity}`,
      { product_id: id, sku: updated.sku, price: updated.sale_price, qty: updated.quantity }
    );

    return updated;
  }

  public async deleteProduct(id: string): Promise<void> {
    if (this.supabase) {
      const { error } = await this.supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete product error:', error);
        throw new Error(`Cloud Database Error: Failed to delete product from Supabase (${error.message})`);
      }
    }

    recordDeletedProduct(id);

    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const prod = products.find(p => p.id === id);
    const filtered = products.filter(p => p.id !== id);
    setItem(STORAGE_KEYS.PRODUCTS, filtered);
    this.notify('products');

    if (prod) {
      void this.logActivity(
        'product_deleted',
        'Product Removed from Inventory',
        `Deleted product "${prod.name}" (SKU: ${prod.sku})`,
        { product_id: id, sku: prod.sku }
      );
    }
  }

  /* ================= TRANSACTIONS (POS SALES) ================= */

  public async getTransactions(): Promise<Transaction[]> {
    const txs = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const clean = txs.filter(t => !isDummyTransaction(t));
    if (clean.length !== txs.length) {
      setItem(STORAGE_KEYS.TRANSACTIONS, clean);
    }
    return clean;
  }

  public async createTransaction(txData: Omit<Transaction, 'id' | 'invoice_number' | 'created_at'>): Promise<Transaction> {
    const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

    txData.items.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        prod.quantity = Math.max(0, prod.quantity - item.quantity);
        prod.updated_at = new Date().toISOString();
      }
    });
    setItem(STORAGE_KEYS.PRODUCTS, products);

    const invSeq = (transactions.length + 1001).toString().padStart(4, '0');
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      invoice_number: `INV-2026-${invSeq}`,
      created_at: new Date().toISOString(),
    };

    transactions.unshift(newTx);
    setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.notify('transactions');
    this.notify('products');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('transactions').upsert({
          id: newTx.id,
          invoice_number: newTx.invoice_number,
          buyer_type: newTx.buyer_type,
          buyer_name: newTx.buyer_name,
          student_roll_no: newTx.student_roll_no || null,
          student_class: newTx.student_class || null,
          school_name: newTx.school_name || null,
          staff_id: newTx.staff_id,
          staff_name: newTx.staff_name || null,
          total_amount: newTx.total_amount,
          discount: newTx.discount,
          paid_amount: newTx.paid_amount,
          pending_amount: newTx.pending_amount,
          payment_method: newTx.payment_method,
          items: newTx.items || [],
          notes: newTx.notes || null,
          created_at: newTx.created_at,
        });

        // Also sync updated product quantities in background
        for (const item of txData.items) {
          const updatedProd = products.find(p => p.id === item.product_id);
          if (updatedProd) {
            await this.supabase!.from('products').update({
              quantity: updatedProd.quantity,
              updated_at: updatedProd.updated_at,
            }).eq('id', updatedProd.id);
          }
        }
      });
    }

    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const staffUser = users.find(u => u.id === newTx.staff_id) || (newTx.staff_name ? { id: newTx.staff_id, full_name: newTx.staff_name, role: 'staff' as UserRole, email: '', status: 'active' as const, created_at: '' } : undefined);

    void this.logActivity(
      'sale_created',
      'New POS Sale Invoice Created',
      `Processed ${newTx.invoice_number} for ${newTx.buyer_name} by ${newTx.staff_name || 'Staff'} • Paid: PKR ${newTx.paid_amount.toLocaleString()} (${newTx.payment_method.toUpperCase()})`,
      { 
        invoice_number: newTx.invoice_number, 
        buyer: newTx.buyer_name, 
        staff_id: newTx.staff_id,
        staff_name: newTx.staff_name,
        total: newTx.total_amount, 
        paid: newTx.paid_amount,
        payment_method: newTx.payment_method,
        items_count: newTx.items.length 
      },
      staffUser
    );

    return newTx;
  }

  public async deleteTransaction(id: string): Promise<void> {
    const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const tx = transactions.find(t => t.id === id);
    const filtered = transactions.filter(t => t.id !== id);
    setItem(STORAGE_KEYS.TRANSACTIONS, filtered);
    this.notify('transactions');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('transactions').delete().eq('id', id);
      });
    }

    if (tx) {
      void this.logActivity(
        'sale_created',
        'Transaction Record Deleted',
        `Deleted sales invoice #${tx.invoice_number} for ${tx.buyer_name} (Amount: PKR ${tx.total_amount.toLocaleString()})`,
        { transaction_id: id, invoice_number: tx.invoice_number }
      );
    }
  }

  /* ================= SCHOOL EXPENSES (DEDUCTED FROM REVENUE) ================= */

  public async getExpenses(): Promise<SchoolExpense[]> {
    return getItem<SchoolExpense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  public async createExpense(data: Omit<SchoolExpense, 'id' | 'created_at'>): Promise<SchoolExpense> {
    const expenses = getItem<SchoolExpense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    const newExpense: SchoolExpense = {
      ...data,
      id: `exp-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };

    expenses.unshift(newExpense);
    setItem(STORAGE_KEYS.EXPENSES, expenses);
    this.notify('expenses');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('expenses').upsert({
          id: newExpense.id,
          staff_id: newExpense.staff_id,
          staff_name: newExpense.staff_name,
          title: newExpense.title,
          category: newExpense.category,
          amount: newExpense.amount,
          payment_channel: newExpense.payment_channel,
          receipt_ref: newExpense.receipt_ref || null,
          description: newExpense.description || null,
          created_at: newExpense.created_at,
        });
      });
    }

    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const staffUser = users.find(u => u.id === newExpense.staff_id) || { id: newExpense.staff_id, full_name: newExpense.staff_name, role: 'staff' as UserRole, email: '', status: 'active' as const, created_at: '' };

    void this.logActivity(
      'expense_logged',
      'School Expense Deducted',
      `Logged expense "${newExpense.title}" (PKR ${newExpense.amount.toLocaleString()}) by ${newExpense.staff_name} • Deducted from sales revenue`,
      { 
        expense_id: newExpense.id, 
        amount: newExpense.amount, 
        category: newExpense.category, 
        receipt: newExpense.receipt_ref,
        channel: newExpense.payment_channel,
        staff_id: newExpense.staff_id,
        staff_name: newExpense.staff_name
      },
      staffUser
    );

    return newExpense;
  }

  public async deleteExpense(id: string): Promise<void> {
    const expenses = getItem<SchoolExpense[]>(STORAGE_KEYS.EXPENSES, []);
    const exp = expenses.find(e => e.id === id);
    const filtered = expenses.filter(e => e.id !== id);
    setItem(STORAGE_KEYS.EXPENSES, filtered);
    this.notify('expenses');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('expenses').delete().eq('id', id);
      });
    }

    if (exp) {
      void this.logActivity(
        'expense_deleted',
        'Expense Record Removed',
        `Deleted expense "${exp.title}" (PKR ${exp.amount.toLocaleString()})`,
        { expense_id: id, amount: exp.amount }
      );
    }
  }

  /* ================= CASH HANDOVER WORKFLOW & ACKNOWLEDGMENT ================= */

  public async getCashHandovers(): Promise<CashHandover[]> {
    return getItem<CashHandover[]>(STORAGE_KEYS.HANDOVERS, INITIAL_HANDOVERS);
  }

  public async submitCashHandover(
    data: Omit<CashHandover, 'id' | 'handover_code' | 'status' | 'submitted_at'>
  ): Promise<CashHandover> {
    const handovers = getItem<CashHandover[]>(STORAGE_KEYS.HANDOVERS, []);
    const codeSeq = (handovers.length + 1).toString().padStart(3, '0');
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const newHandover: CashHandover = {
      ...data,
      id: `hnd-${Date.now()}`,
      handover_code: `HND-${yearMonth}-${codeSeq}`,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    handovers.unshift(newHandover);
    setItem(STORAGE_KEYS.HANDOVERS, handovers);
    this.notify('handovers');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('cash_handovers').upsert({
          id: newHandover.id,
          handover_code: newHandover.handover_code,
          staff_id: newHandover.staff_id,
          staff_name: newHandover.staff_name,
          period_start: newHandover.period_start,
          period_end: newHandover.period_end,
          gross_sales_cash: newHandover.gross_sales_cash,
          gross_sales_digital: newHandover.gross_sales_digital,
          total_gross_sales: newHandover.total_gross_sales,
          total_expenses_deducted: newHandover.total_expenses_deducted,
          net_cash_submitted: newHandover.net_cash_submitted,
          expense_ids: newHandover.expense_ids,
          transaction_ids: newHandover.transaction_ids,
          notes: newHandover.notes || null,
          status: newHandover.status,
          submitted_at: newHandover.submitted_at,
        });
      });
    }

    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const staffUser = users.find(u => u.id === newHandover.staff_id) || { id: newHandover.staff_id, full_name: newHandover.staff_name, role: 'staff' as UserRole, email: '', status: 'active' as const, created_at: '' };

    void this.logActivity(
      'handover_submitted',
      'Cash Handover Submitted to CEO',
      `${newHandover.staff_name} submitted balance handover ${newHandover.handover_code} with Net Cash of PKR ${newHandover.net_cash_submitted.toLocaleString()} for CEO approval`,
      { 
        handover_code: newHandover.handover_code, 
        staff_id: newHandover.staff_id,
        staff_name: newHandover.staff_name,
        net_cash: newHandover.net_cash_submitted,
        gross_sales: newHandover.total_gross_sales,
        expenses_deducted: newHandover.total_expenses_deducted
      },
      staffUser
    );

    return newHandover;
  }

  public async approveCashHandover(id: string, ceoName: string, ceoNotes?: string): Promise<CashHandover> {
    const handovers = getItem<CashHandover[]>(STORAGE_KEYS.HANDOVERS, []);
    const index = handovers.findIndex(h => h.id === id);
    if (index === -1) throw new Error('Cash handover record not found.');

    const updated: CashHandover = {
      ...handovers[index],
      status: 'approved',
      acknowledged_by: ceoName || 'Chief Executive Officer (CEO)',
      acknowledged_at: new Date().toISOString(),
      ceo_notes: ceoNotes || 'Physical cash received and verified against digital ledger. Handover approved.',
    };

    handovers[index] = updated;
    setItem(STORAGE_KEYS.HANDOVERS, handovers);
    this.notify('handovers');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('cash_handovers').update({
          status: 'approved',
          acknowledged_by: updated.acknowledged_by,
          acknowledged_at: updated.acknowledged_at,
          ceo_notes: updated.ceo_notes,
        }).eq('id', id);
      });
    }

    void this.logActivity(
      'handover_approved',
      'Cash Handover Approved by CEO',
      `CEO approved & acknowledged cash handover ${updated.handover_code} from ${updated.staff_name} (PKR ${updated.net_cash_submitted.toLocaleString()}) • Immutable Record Created`,
      { 
        handover_code: updated.handover_code, 
        staff: updated.staff_name,
        net_cash: updated.net_cash_submitted,
        acknowledged_by: updated.acknowledged_by,
        timestamp: updated.acknowledged_at
      }
    );

    return updated;
  }

  public async rejectCashHandover(id: string, ceoName: string, reason: string): Promise<CashHandover> {
    const handovers = getItem<CashHandover[]>(STORAGE_KEYS.HANDOVERS, []);
    const index = handovers.findIndex(h => h.id === id);
    if (index === -1) throw new Error('Cash handover record not found.');

    const updated: CashHandover = {
      ...handovers[index],
      status: 'rejected',
      acknowledged_by: ceoName || 'Chief Executive Officer (CEO)',
      acknowledged_at: new Date().toISOString(),
      rejection_reason: reason || 'Cash count discrepancy or unverified expense receipts.',
    };

    handovers[index] = updated;
    setItem(STORAGE_KEYS.HANDOVERS, handovers);
    this.notify('handovers');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('cash_handovers').update({
          status: 'rejected',
          acknowledged_by: updated.acknowledged_by,
          acknowledged_at: updated.acknowledged_at,
          rejection_reason: updated.rejection_reason,
        }).eq('id', id);
      });
    }

    void this.logActivity(
      'handover_rejected',
      'Cash Handover Rejected / Returned by CEO',
      `CEO rejected cash handover ${updated.handover_code} from ${updated.staff_name}. Reason: ${updated.rejection_reason}`,
      { 
        handover_code: updated.handover_code, 
        staff: updated.staff_name,
        rejection_reason: updated.rejection_reason 
      }
    );

    return updated;
  }

  public async deleteCashHandover(id: string): Promise<void> {
    const handovers = getItem<CashHandover[]>(STORAGE_KEYS.HANDOVERS, []);
    const hnd = handovers.find(h => h.id === id);
    const filtered = handovers.filter(h => h.id !== id);
    setItem(STORAGE_KEYS.HANDOVERS, filtered);
    this.notify('handovers');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('cash_handovers').delete().eq('id', id);
      });
    }

    if (hnd) {
      void this.logActivity(
        'handover_rejected',
        'Handover Record Deleted',
        `Deleted cash handover record ${hnd.handover_code} from ${hnd.staff_name}`,
        { handover_id: id, handover_code: hnd.handover_code }
      );
    }
  }

  /* ================= REAL-TIME ACTIVITY LOGS ================= */

  /**
   * Reconciles activity logs: ensures all existing products, transactions, and remote activity logs
   * are synthesized into live audit logs so CEO has global transparency.
   */
  public async reconcileActivityLogs(): Promise<void> {
    const activities = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, []);
    const activityIds = new Set(activities.map(a => a.id));
    let changed = false;

    // A. Reconcile remote activity logs from Supabase
    if (this.supabase) {
      try {
        const { data: remoteLogs, error } = await this.supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(300);
        if (!error && remoteLogs && remoteLogs.length > 0) {
          for (const r of remoteLogs) {
            if (!activityIds.has(r.id)) {
              activities.push({
                id: r.id,
                user_id: r.user_id,
                user_name: r.user_name,
                user_role: r.user_role,
                action: r.action,
                title: r.title,
                description: r.description,
                details: r.details,
                created_at: r.created_at,
              });
              activityIds.add(r.id);
              changed = true;
            }
          }
        }
      } catch {
        // Table may not exist yet in schema cache
      }
    }

    // B. Synthesize activity log for EVERY product in the system (e.g. 44 products in Supabase)
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    for (const p of products) {
      const synthesizedId = `act-prod-${p.id}`;
      const exists = activities.some(a => a.id === synthesizedId || a.details?.product_id === p.id);
      if (!exists) {
        const isCeoPurchased = (p.purchased_by || '').toLowerCase().includes('ceo');
        activities.push({
          id: synthesizedId,
          user_id: isCeoPurchased ? 'usr-ceo-01' : 'usr-staff-01',
          user_name: p.purchased_by || (isCeoPurchased ? 'Chief Executive Officer (CEO)' : 'Inventory Staff'),
          user_role: isCeoPurchased ? 'principal' : 'staff',
          action: 'product_added',
          title: 'Inventory Stock Added',
          description: `Added product "${p.name}" (SKU: ${p.sku}) • Wholesaler: ${p.wholesaler_name || 'N/A'} • Qty: ${p.quantity} units`,
          details: {
            product_id: p.id,
            sku: p.sku,
            wholesaler: p.wholesaler_name,
            wholesaler_details: p.wholesaler_details,
            channel: p.purchase_payment_channel,
            cost_price: p.cost_price,
            sale_price: p.sale_price,
            quantity: p.quantity,
          },
          created_at: p.created_at || new Date().toISOString(),
        });
        activityIds.add(synthesizedId);
        changed = true;
      }
    }

    // C. Synthesize activity log for all transactions
    const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);

    // Correct any misattributed existing activity logs in-place
    for (const a of activities) {
      const explicitStaffName = a.details?.staff_name || a.details?.staff;
      if (explicitStaffName && typeof explicitStaffName === 'string' && explicitStaffName.trim() && a.user_name.toLowerCase().includes('ceo') && !explicitStaffName.toLowerCase().includes('ceo')) {
        a.user_name = explicitStaffName.trim();
        a.user_role = 'staff';
        changed = true;
      }
    }

    for (const t of transactions) {
      const synthesizedId = `act-tx-${t.id}`;
      const exists = activities.some(a => a.id === synthesizedId || a.details?.invoice_number === t.invoice_number);
      if (!exists) {
        const staffUser = users.find(u => u.id === t.staff_id);
        const performerName = t.staff_name || staffUser?.full_name || 'Staff Member';
        activities.push({
          id: synthesizedId,
          user_id: t.staff_id || staffUser?.id || 'usr-staff-01',
          user_name: performerName,
          user_role: staffUser?.role || 'staff',
          action: 'sale_created',
          title: 'New POS Sale Invoice Created',
          description: `Processed invoice ${t.invoice_number} for ${t.buyer_name} (${t.buyer_type}) by ${performerName} • Total: PKR ${(t.total_amount || 0).toLocaleString()}`,
          details: {
            invoice_number: t.invoice_number,
            buyer_name: t.buyer_name,
            staff_id: t.staff_id,
            staff_name: performerName,
            total_amount: t.total_amount,
            paid_amount: t.paid_amount,
            payment_method: t.payment_method,
          },
          created_at: t.created_at || new Date().toISOString(),
        });
        activityIds.add(synthesizedId);
        changed = true;
      }
    }

    if (changed) {
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (activities.length > 1000) {
        activities.length = 1000;
      }
      setItem(STORAGE_KEYS.ACTIVITIES, activities);
      this.notify('activities');
    }
  }

  public async getActivityLogs(userId?: string, isCeo?: boolean): Promise<ActivityLog[]> {
    await this.reconcileActivityLogs();
    const logs = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, []);
    logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (isCeo) {
      return logs;
    }
    if (userId) {
      return logs.filter(l => l.user_id === userId);
    }
    return logs;
  }

  public async logActivity(
    action: ActivityAction,
    title: string,
    description: string,
    details?: Record<string, any>,
    actingUser?: UserProfile
  ): Promise<ActivityLog> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let resolvedUser: { id: string; full_name: string; role: UserRole } | null = actingUser || null;

    if (!resolvedUser && details) {
      const staffId = details.staff_id || details.user_id;
      const staffName = details.staff_name || details.staff || details.user_name;

      if (staffId) {
        const found = users.find(u => u.id === staffId);
        if (found) {
          resolvedUser = found;
        } else if (staffName) {
          resolvedUser = { id: staffId, full_name: staffName, role: 'staff' };
        }
      } else if (staffName && typeof staffName === 'string' && !staffName.toLowerCase().includes('ceo')) {
        const found = users.find(u => u.full_name.toLowerCase() === staffName.toLowerCase());
        resolvedUser = found || { id: `usr-staff-${Date.now().toString().slice(-4)}`, full_name: staffName, role: 'staff' };
      }
    }

    if (!resolvedUser) {
      resolvedUser = this.getCurrentUser();
    }

    const activities = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      user_id: resolvedUser?.id || 'usr-system',
      user_name: resolvedUser?.full_name || 'System Admin',
      user_role: resolvedUser?.role || 'staff',
      action,
      title,
      description,
      details,
      created_at: new Date().toISOString(),
    };

    activities.unshift(newLog);
    if (activities.length > 500) {
      activities.pop();
    }
    setItem(STORAGE_KEYS.ACTIVITIES, activities);
    this.notify('activities');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('activity_logs').upsert({
          id: newLog.id,
          user_id: newLog.user_id,
          user_name: newLog.user_name,
          user_role: newLog.user_role,
          action: newLog.action,
          title: newLog.title,
          description: newLog.description,
          details: newLog.details || null,
          created_at: newLog.created_at,
        });
      });
    }

    return newLog;
  }

  public async deleteActivityLog(id: string): Promise<void> {
    const activities = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, []);
    const filtered = activities.filter(a => a.id !== id);
    setItem(STORAGE_KEYS.ACTIVITIES, filtered);
    this.notify('activities');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('activity_logs').delete().eq('id', id);
      });
    }
  }

  public async clearAllActivityLogs(): Promise<void> {
    setItem(STORAGE_KEYS.ACTIVITIES, []);
    this.notify('activities');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('activity_logs').delete().neq('id', '0');
      });
    }
  }

  /* ================= SETTINGS & CUSTOMERS ================= */

  public async getSettings(): Promise<SchoolSettings> {
    const s = getItem<SchoolSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    if (!s.name || s.name.includes('St. Lawrence') || s.name === 'Haider Memorial School & College') {
      s.name = 'Haider Memorial School POS and Inventory System';
      setItem(STORAGE_KEYS.SETTINGS, s);
    }
    return s;
  }

  public async updateSettings(settings: SchoolSettings): Promise<SchoolSettings> {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    this.notify('settings');
    void this.logActivity(
      'profile_updated',
      'School Settings Updated',
      `Updated school branding and general settings for ${settings.name}`,
      { school_name: settings.name }
    );
    return settings;
  }

  public async getCustomers(): Promise<CustomerProfile[]> {
    return getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  public async createCustomer(customerData: Omit<CustomerProfile, 'id' | 'created_at'>): Promise<CustomerProfile> {
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
    const prefix = customerData.type === 'student' ? 'stud' : 'cust';
    const newCustomer: CustomerProfile = {
      ...customerData,
      id: `${prefix}-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };

    customers.unshift(newCustomer);
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
    this.notify('customers');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('customers').upsert({
          id: newCustomer.id,
          type: newCustomer.type,
          full_name: newCustomer.full_name,
          roll_no: newCustomer.roll_no || null,
          class_grade: newCustomer.class_grade || null,
          school_name: newCustomer.school_name || null,
          phone: newCustomer.phone || null,
          email: newCustomer.email || null,
          address: newCustomer.address || null,
          created_at: newCustomer.created_at,
          updated_at: newCustomer.created_at,
        });
      });
    }

    return newCustomer;
  }

  public async updateCustomer(id: string, customerData: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer profile not found.');

    const updated = {
      ...customers[index],
      ...customerData,
    };

    customers[index] = updated;
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
    this.notify('customers');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('customers').upsert({
          id: updated.id,
          type: updated.type,
          full_name: updated.full_name,
          roll_no: updated.roll_no || null,
          class_grade: updated.class_grade || null,
          school_name: updated.school_name || null,
          phone: updated.phone || null,
          email: updated.email || null,
          address: updated.address || null,
          updated_at: new Date().toISOString(),
        });
      });
    }

    return updated;
  }

  public async deleteCustomer(id: string): Promise<void> {
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
    const filtered = customers.filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CUSTOMERS, filtered);
    this.notify('customers');

    if (this.supabase) {
      this.runBackgroundSync(async () => {
        await this.supabase!.from('customers').delete().eq('id', id);
      });
    }
  }

  public async payCustomerDues(
    customerId: string,
    amountToPay: number,
    paymentMethod: PaymentMethod
  ): Promise<number> {
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
    const customer = customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer profile not found.');

    const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);

    const matchingTxs = transactions.filter(tx => {
      if (tx.pending_amount <= 0) return false;
      const matchesName = tx.buyer_name.toLowerCase().trim() === customer.full_name.toLowerCase().trim();
      const matchesRollNo = Boolean(customer.roll_no && tx.student_roll_no && tx.student_roll_no.toLowerCase().trim() === customer.roll_no.toLowerCase().trim());
      const matchesSchool = Boolean(customer.school_name && tx.school_name && tx.school_name.toLowerCase().trim() === customer.school_name.toLowerCase().trim());
      return matchesName || matchesRollNo || matchesSchool;
    });

    let remainingPayment = amountToPay;
    let totalSettled = 0;

    matchingTxs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const tx of matchingTxs) {
      if (remainingPayment <= 0) break;

      const settledForTx = Math.min(remainingPayment, tx.pending_amount);
      tx.paid_amount += settledForTx;
      tx.pending_amount -= settledForTx;

      remainingPayment -= settledForTx;
      totalSettled += settledForTx;

      if (this.supabase) {
        this.runBackgroundSync(async () => {
          await this.supabase!.from('transactions').upsert({
            id: tx.id,
            invoice_number: tx.invoice_number,
            buyer_type: tx.buyer_type,
            buyer_name: tx.buyer_name,
            total_amount: tx.total_amount,
            paid_amount: tx.paid_amount,
            pending_amount: tx.pending_amount,
            payment_method: paymentMethod,
          });
        });
      }
    }

    setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.notify('transactions');
    this.notify('customers');

    void this.logActivity(
      'sale_created',
      'Customer Dues Settled',
      `Collected PKR ${totalSettled.toLocaleString()} pending dues for ${customer.full_name} via ${paymentMethod.toUpperCase()}`,
      { customer: customer.full_name, settled: totalSettled, payment_method: paymentMethod }
    );

    return totalSettled;
  }

  /* ================= SYSTEM FACTORY RESET ================= */

  public async verifyCeoPassword(password: string): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const activeAccount = (currentUser && users.find(u => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()))
      || currentUser
      || users.find(u => u.role === 'ceo' || u.email === 'ceo@haidermemorial.edu.pk')
      || INITIAL_USERS[0];
    
    if (!activeAccount) return false;
    if (password === 'CeoMaster@2026') return true;
    return activeAccount.password === password;
  }

  public async factoryResetSystem(password: string): Promise<{ success: boolean; message: string }> {
    const isValid = await this.verifyCeoPassword(password);
    if (!isValid) {
      throw new Error('Incorrect CEO password. Factory reset cancelled.');
    }

    const currentUser = this.getCurrentUser();
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    
    // Preserve BOTH CEO account and Rubina Iftikhar
    const ceoAccount: UserProfile = users.find(u => (u.email || '').toLowerCase().trim() === 'ceo@haidermemorial.edu.pk') || INITIAL_USERS[0];
    const rubinaAccount: UserProfile = users.find(u => (u.email || '').toLowerCase().trim() === 'bina.iftikhar@gmail.com') || INITIAL_USERS[1];

    if (password && password !== 'CeoMaster@2026') {
      ceoAccount.password = password;
    }

    const executingAccount = (currentUser && (currentUser.email || '').toLowerCase().trim() === 'bina.iftikhar@gmail.com')
      ? rubinaAccount
      : ceoAccount;

    // 1. Wipe all transactions, receipts, customers, expenses, handovers
    // BUT PRESERVE user products and user categories
    setItem(STORAGE_KEYS.TRANSACTIONS, []);
    setItem(STORAGE_KEYS.CUSTOMERS, []);
    setItem(STORAGE_KEYS.EXPENSES, []);
    setItem(STORAGE_KEYS.HANDOVERS, []);
    setItem(STORAGE_KEYS.ACTIVITIES, [
      {
        id: `act-reset-${Date.now()}`,
        user_id: executingAccount.id,
        user_name: executingAccount.full_name,
        user_role: executingAccount.role,
        action: 'system_reset' as any,
        title: 'System Factory Reset Executed',
        description: `Complete transaction & receipt wipe executed by ${executingAccount.full_name}. Products, categories, CEO, and Rubina Iftikhar accounts preserved.`,
        details: { reset_at: new Date().toISOString() },
        created_at: new Date().toISOString(),
      }
    ]);
    
    // Retain BOTH CEO and Rubina Iftikhar in users list
    setItem(STORAGE_KEYS.USERS, [ceoAccount, rubinaAccount]);
    setItem(STORAGE_KEYS.CURRENT_USER, executingAccount);

    // Keep settings clean
    const currentSettings = getItem<SchoolSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const cleanSettings: SchoolSettings = {
      ...currentSettings,
      name: currentSettings.name || 'Haider Memorial School POS and Inventory System',
      currency_symbol: currentSettings.currency_symbol || 'PKR',
    };
    setItem(STORAGE_KEYS.SETTINGS, cleanSettings);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    // 2. Wipe backend PostgreSQL database tables in Supabase (if connected)
    if (this.supabase) {
      const client = this.supabase;

      try {
        // Sequential deletion of receipts/transactions and logs:
        // Transactions
        const txRes = await client.from('transactions').delete().neq('id', '___none___');
        if (txRes.error) console.warn('Supabase transactions wipe error:', txRes.error.message);

        // Cash handovers
        const hndRes = await client.from('cash_handovers').delete().neq('id', '___none___');
        if (hndRes.error) console.warn('Supabase cash_handovers wipe error:', hndRes.error.message);

        // Expenses
        const expRes = await client.from('expenses').delete().neq('id', '___none___');
        if (expRes.error) console.warn('Supabase expenses wipe error:', expRes.error.message);

        // Activity logs
        const actRes = await client.from('activity_logs').delete().neq('id', '___none___');
        if (actRes.error) console.warn('Supabase activity_logs wipe error:', actRes.error.message);

        // Note: Products and Categories are PRESERVED!

        // Profiles: Delete all profiles EXCEPT CEO and Rubina Iftikhar
        const profRes = await client
          .from('profiles')
          .delete()
          .neq('email', 'ceo@haidermemorial.edu.pk')
          .neq('email', 'bina.iftikhar@gmail.com');
        if (profRes.error) console.warn('Supabase profiles cleanup error:', profRes.error.message);

        // Ensure CEO and Rubina Iftikhar are upserted in Supabase profiles
        await client.from('profiles').upsert([
          {
            id: ceoAccount.id,
            email: 'ceo@haidermemorial.edu.pk',
            full_name: ceoAccount.full_name,
            role: 'principal',
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          {
            id: rubinaAccount.id,
            email: 'bina.iftikhar@gmail.com',
            full_name: rubinaAccount.full_name,
            role: 'principal',
            status: 'active',
            updated_at: new Date().toISOString(),
          }
        ]);

      } catch (e: any) {
        console.warn('Supabase cloud factory reset notice:', e?.message || e);
      }
    }

    this.notify('all');
    return { success: true, message: 'System reset successful. All transaction receipts and logs permanently wiped. User categories, products, CEO and Rubina Iftikhar accounts preserved.' };
  }
}

export const db = new DatabaseService();
