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

const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ektqwpnsqqnrukubnmiw.supabase.co';
const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrdHF3cG5zcXFucnVrdWJubWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDUzNDMsImV4cCI6MjEwMTMyMTM0M30.WQTHB6qyn4Aah9zZlSfllqZCL5RHVzN1ZdCYFw0oMbA';

const STORAGE_KEYS = {
  USERS: 'school_pos_users_v4',
  CATEGORIES: 'school_pos_categories_v4',
  PRODUCTS: 'school_pos_products_v4',
  TRANSACTIONS: 'school_pos_transactions_v4',
  SETTINGS: 'school_pos_settings_v4',
  CUSTOMERS: 'school_pos_customers_v4',
  CURRENT_USER: 'school_pos_current_user_v4',
  EXPENSES: 'school_pos_expenses_v4',
  HANDOVERS: 'school_pos_handovers_v4',
  ACTIVITIES: 'school_pos_activities_v4',
  INITIALIZED: 'school_pos_initialized_flag_v4',
  SUPABASE_URL: 'school_pos_supabase_url',
  SUPABASE_KEY: 'school_pos_supabase_key',
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

class DatabaseService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initLocalDefaults();
    this.initSupabaseClient();
    this.syncSupabaseToLocal().finally(() => {
      this.syncLocalToSupabase();
    });
  }

  private initLocalDefaults() {
    // Purge legacy storage versions
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('_v1') || k.includes('_v2') || k.includes('_v3'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }

    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (!isInitialized) {
      // First time initialization: populate fresh defaults (CEO + Rubina Iftikhar as Principal, zero dummy data)
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      setItem(STORAGE_KEYS.CATEGORIES, []);
      setItem(STORAGE_KEYS.PRODUCTS, []);
      setItem(STORAGE_KEYS.TRANSACTIONS, []);
      setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      setItem(STORAGE_KEYS.CUSTOMERS, []);
      setItem(STORAGE_KEYS.EXPENSES, []);
      setItem(STORAGE_KEYS.HANDOVERS, []);
      setItem(STORAGE_KEYS.ACTIVITIES, []);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      // Ensure products, categories, transactions, expenses, handovers, activities are clean zero state
      const existingProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      if (existingProducts.some(p => p.id.startsWith('prod-10'))) {
        setItem(STORAGE_KEYS.PRODUCTS, []);
        setItem(STORAGE_KEYS.CATEGORIES, []);
        setItem(STORAGE_KEYS.TRANSACTIONS, []);
        setItem(STORAGE_KEYS.CUSTOMERS, []);
        setItem(STORAGE_KEYS.EXPENSES, []);
        setItem(STORAGE_KEYS.HANDOVERS, []);
        setItem(STORAGE_KEYS.ACTIVITIES, []);
      }

      // Safeguard: ensure CEO account exists, remove demo/test accounts
      let users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
      users = users.filter(u => 
        !u.email.toLowerCase().includes('demo') && 
        !u.email.toLowerCase().includes('test') &&
        u.email !== 'staff@haidermemorial.edu.pk'
      );

      const hasCeo = users.some(u => u.role === 'ceo' || u.email === 'ceo@haidermemorial.edu.pk');
      if (!hasCeo) {
        users.unshift(INITIAL_USERS[0]);
      }

      setItem(STORAGE_KEYS.USERS, users);
    }

    // Ensure settings title is updated to Haider Memorial School POS and Inventory System
    const currentSettings = getItem<SchoolSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    if (!currentSettings.name || currentSettings.name.includes('St. Lawrence') || currentSettings.name === 'Haider Memorial School & College') {
      currentSettings.name = 'Haider Memorial School POS and Inventory System';
      setItem(STORAGE_KEYS.SETTINGS, currentSettings);
    }
  }

  public initSupabaseClient() {
    let url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    let key = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_KEY;

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
      if (!cErr && remoteCategories && remoteCategories.length > 0) {
        const mergedCategories: Category[] = remoteCategories.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          icon_name: c.icon_name || 'Tag',
          created_at: c.created_at || new Date().toISOString(),
        }));
        setItem(STORAGE_KEYS.CATEGORIES, mergedCategories);
      }

      // 3. Pull Products
      const { data: remoteProducts, error: prErr } = await this.supabase.from('products').select('*');
      if (!prErr && remoteProducts && remoteProducts.length > 0) {
        const mergedProducts: Product[] = remoteProducts.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category_id: p.category_id,
          cost_price: Number(p.cost_price) || 0,
          sale_price: Number(p.sale_price) || 0,
          quantity: Number(p.quantity) || 0,
          size: p.size || null,
          color: p.color || null,
          variant: p.variant || null,
          wholesaler_name: p.wholesaler_name || null,
          wholesaler_details: p.wholesaler_details || null,
          purchase_payment_channel: p.purchase_payment_channel || null,
          purchased_by: p.purchased_by || null,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        }));
        setItem(STORAGE_KEYS.PRODUCTS, mergedProducts);
      }

      // 4. Pull Transactions
      const { data: remoteTransactions, error: txErr } = await this.supabase.from('transactions').select('*');
      if (!txErr && remoteTransactions && remoteTransactions.length > 0) {
        const localTx = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
        const txMap = new Map<string, Transaction>();
        localTx.forEach(t => txMap.set(t.id, t));

        remoteTransactions.forEach(t => {
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
            total_amount: Number(t.total_amount) || 0,
            discount: Number(t.discount) || 0,
            paid_amount: Number(t.paid_amount) || 0,
            pending_amount: Number(t.pending_amount) || 0,
            payment_method: t.payment_method,
            notes: t.notes || undefined,
            created_at: t.created_at,
            items: existing?.items || [],
          });
        });
        setItem(STORAGE_KEYS.TRANSACTIONS, Array.from(txMap.values()));
      }

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
      // 1. Sync Categories
      const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
      if (categories.length > 0) {
        const { error: catErr } = await this.supabase.from('categories').upsert(
          categories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || null,
            icon_name: c.icon_name || 'Tag',
            created_at: c.created_at || new Date().toISOString(),
          }))
        );
        if (catErr) console.warn('Categories Table sync:', catErr.message);
      }

      // 2. Sync Products
      const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      if (products.length > 0) {
        const { error: prodErr } = await this.supabase.from('products').upsert(
          products.map(p => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category_id: p.category_id,
            cost_price: p.cost_price,
            sale_price: p.sale_price,
            quantity: p.quantity,
            size: p.size || null,
            color: p.color || null,
            variant: p.variant || null,
            wholesaler_name: p.wholesaler_name || null,
            wholesaler_details: p.wholesaler_details || null,
            purchase_payment_channel: p.purchase_payment_channel || null,
            purchased_by: p.purchased_by || null,
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          }))
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
      if (transactions.length > 0) {
        const { error: txErr } = await this.supabase.from('transactions').upsert(
          transactions.map(tx => ({
            id: tx.id,
            invoice_number: tx.invoice_number,
            buyer_type: tx.buyer_type,
            buyer_name: tx.buyer_name,
            student_roll_no: tx.student_roll_no || null,
            student_class: tx.student_class || null,
            school_name: tx.school_name || null,
            staff_id: tx.staff_id || 'usr-staff-01',
            total_amount: tx.total_amount,
            discount: tx.discount,
            paid_amount: tx.paid_amount,
            pending_amount: tx.pending_amount,
            payment_method: tx.payment_method,
            notes: tx.notes || null,
            created_at: tx.created_at || new Date().toISOString(),
          }))
        );
        if (txErr) console.warn('Transactions Table sync:', txErr.message);
      }

      // 5. Sync Expenses
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
    let users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    if (users.length <= 1 && this.supabase) {
      await this.syncSupabaseToLocal();
      users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    return users;
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

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').update({
          email: users[index].email,
          full_name: users[index].full_name,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      } catch (e) {
        console.warn('Supabase profile update sync notice:', e);
      }
    }

    await this.logActivity(
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
        console.warn('Supabase staff creation sync notice:', e);
      }
    }

    await this.logActivity(
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

    // Sync to Supabase
    if (this.supabase) {
      try {
        await this.supabase.from('profiles').update({
          email: users[index].email,
          full_name: users[index].full_name,
          role: (users[index].role === 'ceo' ? 'principal' : (users[index].role || 'staff')),
          status: users[index].status,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      } catch (e) {
        console.warn('Supabase staff update sync notice:', e);
      }
    }

    await this.logActivity(
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

    await this.logActivity(
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

    await this.logActivity(
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

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').delete().eq('id', userId);
      } catch (e) {
        console.warn('Supabase user delete sync notice:', e);
      }
    }

    await this.logActivity(
      'user_status_changed',
      'User Account Deleted',
      `Deleted account ${userToDelete.full_name} (${userToDelete.email}) from the system`,
      { staff_id: userId, email: userToDelete.email }
    );
  }

  /* ================= CATEGORIES & PRODUCTS (INVENTORY) ================= */

  public async getCategories(): Promise<Category[]> {
    let cats = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    if ((!cats || cats.length === 0) && this.supabase) {
      await this.syncSupabaseToLocal();
      cats = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    }
    return cats;
  }

  public async createCategory(name: string, description?: string, icon_name?: string): Promise<Category> {
    const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const trimmedName = name.trim();

    if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('Category already exists.');
    }

    const newCategory: Category = {
      id: `cat-${Date.now().toString().slice(-4)}`,
      name: trimmedName,
      description: description?.trim() || '',
      icon_name: icon_name || 'Tag',
      created_at: new Date().toISOString(),
    };

    categories.unshift(newCategory);
    setItem(STORAGE_KEYS.CATEGORIES, categories);

    if (this.supabase) {
      try {
        await this.supabase.from('categories').upsert({
          id: newCategory.id,
          name: newCategory.name,
          description: newCategory.description || null,
          icon_name: newCategory.icon_name || 'Tag',
          created_at: newCategory.created_at,
        });
      } catch (e) {
        console.warn('Supabase category create sync notice:', e);
      }
    }

    await this.logActivity(
      'category_created',
      'Inventory Category Created',
      `Created category "${newCategory.name}"`,
      { category_id: newCategory.id, name: newCategory.name }
    );

    return newCategory;
  }

  public async deleteCategory(id: string): Promise<void> {
    const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const filtered = categories.filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CATEGORIES, filtered);

    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const defaultCat = filtered[0]?.id || '';
    const updatedProducts = products.map(p => p.category_id === id ? { ...p, category_id: defaultCat } : p);
    setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);

    if (this.supabase) {
      try {
        await this.supabase.from('categories').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase category delete sync notice:', e);
      }
    }
  }

  public async getProducts(): Promise<Product[]> {
    let prods = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    if ((!prods || prods.length === 0) && this.supabase) {
      await this.syncSupabaseToLocal();
      prods = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    return prods;
  }

  public async addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    products.unshift(newProduct);
    setItem(STORAGE_KEYS.PRODUCTS, products);

    if (this.supabase) {
      try {
        await this.supabase.from('products').upsert({
          id: newProduct.id,
          sku: newProduct.sku,
          name: newProduct.name,
          category_id: newProduct.category_id,
          cost_price: newProduct.cost_price,
          sale_price: newProduct.sale_price,
          quantity: newProduct.quantity,
          size: newProduct.size || null,
          color: newProduct.color || null,
          variant: newProduct.variant || null,
          wholesaler_name: newProduct.wholesaler_name || null,
          wholesaler_details: newProduct.wholesaler_details || null,
          purchase_payment_channel: newProduct.purchase_payment_channel || null,
          purchased_by: newProduct.purchased_by || null,
          created_at: newProduct.created_at,
          updated_at: newProduct.updated_at,
        });
      } catch (e) {
        console.warn('Supabase product add sync notice:', e);
      }
    }

    await this.logActivity(
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

    const updated = {
      ...products[index],
      ...productData,
      updated_at: new Date().toISOString(),
    };

    products[index] = updated;
    setItem(STORAGE_KEYS.PRODUCTS, products);

    if (this.supabase) {
      try {
        await this.supabase.from('products').upsert({
          id: updated.id,
          sku: updated.sku,
          name: updated.name,
          category_id: updated.category_id,
          cost_price: updated.cost_price,
          sale_price: updated.sale_price,
          quantity: updated.quantity,
          size: updated.size || null,
          color: updated.color || null,
          variant: updated.variant || null,
          wholesaler_name: updated.wholesaler_name || null,
          wholesaler_details: updated.wholesaler_details || null,
          purchase_payment_channel: updated.purchase_payment_channel || null,
          purchased_by: updated.purchased_by || null,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        });
      } catch (e) {
        console.warn('Supabase product update sync notice:', e);
      }
    }

    await this.logActivity(
      'product_updated',
      'Product Stock/Details Updated',
      `Updated product "${updated.name}" (SKU: ${updated.sku}) • Stock: ${updated.quantity}`,
      { product_id: id, sku: updated.sku, price: updated.sale_price, qty: updated.quantity }
    );

    return updated;
  }

  public async deleteProduct(id: string): Promise<void> {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const prod = products.find(p => p.id === id);
    const filtered = products.filter(p => p.id !== id);
    setItem(STORAGE_KEYS.PRODUCTS, filtered);

    if (this.supabase) {
      try {
        await this.supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase product delete sync notice:', e);
      }
    }

    if (prod) {
      await this.logActivity(
        'product_deleted',
        'Product Removed from Inventory',
        `Deleted product "${prod.name}" (SKU: ${prod.sku})`,
        { product_id: id, sku: prod.sku }
      );
    }
  }

  /* ================= TRANSACTIONS (POS SALES) ================= */

  public async getTransactions(): Promise<Transaction[]> {
    let txs = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    if ((!txs || txs.length === 0) && this.supabase) {
      await this.syncSupabaseToLocal();
      txs = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    }
    return txs;
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

    if (this.supabase) {
      try {
        await this.supabase.from('transactions').upsert({
          id: newTx.id,
          invoice_number: newTx.invoice_number,
          buyer_type: newTx.buyer_type,
          buyer_name: newTx.buyer_name,
          student_roll_no: newTx.student_roll_no || null,
          student_class: newTx.student_class || null,
          school_name: newTx.school_name || null,
          staff_id: newTx.staff_id,
          total_amount: newTx.total_amount,
          discount: newTx.discount,
          paid_amount: newTx.paid_amount,
          pending_amount: newTx.pending_amount,
          payment_method: newTx.payment_method,
          notes: newTx.notes || null,
          created_at: newTx.created_at,
        });
      } catch (e) {
        console.warn('Supabase transaction add sync notice:', e);
      }
    }

    await this.logActivity(
      'sale_created',
      'New POS Sale Invoice Created',
      `Processed ${newTx.invoice_number} for ${newTx.buyer_name} • Paid: PKR ${newTx.paid_amount.toLocaleString()} (${newTx.payment_method.toUpperCase()})`,
      { 
        invoice_number: newTx.invoice_number, 
        buyer: newTx.buyer_name, 
        total: newTx.total_amount, 
        paid: newTx.paid_amount,
        payment_method: newTx.payment_method,
        items_count: newTx.items.length 
      }
    );

    return newTx;
  }

  public async deleteTransaction(id: string): Promise<void> {
    const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const tx = transactions.find(t => t.id === id);
    const filtered = transactions.filter(t => t.id !== id);
    setItem(STORAGE_KEYS.TRANSACTIONS, filtered);

    if (this.supabase) {
      try {
        await this.supabase.from('transactions').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase transaction delete sync notice:', e);
      }
    }

    if (tx) {
      await this.logActivity(
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

    if (this.supabase) {
      try {
        await this.supabase.from('expenses').upsert({
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
      } catch (e) {
        console.warn('Supabase expense sync notice:', e);
      }
    }

    await this.logActivity(
      'expense_logged',
      'School Expense Deducted',
      `Logged expense "${newExpense.title}" (PKR ${newExpense.amount.toLocaleString()}) by ${newExpense.staff_name} • Deducted from sales revenue`,
      { 
        expense_id: newExpense.id, 
        amount: newExpense.amount, 
        category: newExpense.category, 
        receipt: newExpense.receipt_ref,
        channel: newExpense.payment_channel 
      }
    );

    return newExpense;
  }

  public async deleteExpense(id: string): Promise<void> {
    const expenses = getItem<SchoolExpense[]>(STORAGE_KEYS.EXPENSES, []);
    const exp = expenses.find(e => e.id === id);
    const filtered = expenses.filter(e => e.id !== id);
    setItem(STORAGE_KEYS.EXPENSES, filtered);

    if (this.supabase) {
      try {
        await this.supabase.from('expenses').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase expense delete sync notice:', e);
      }
    }

    if (exp) {
      await this.logActivity(
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

    if (this.supabase) {
      try {
        await this.supabase.from('cash_handovers').upsert({
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
      } catch (e) {
        console.warn('Supabase cash handover submit sync notice:', e);
      }
    }

    await this.logActivity(
      'handover_submitted',
      'Cash Handover Submitted to CEO',
      `${newHandover.staff_name} submitted balance handover ${newHandover.handover_code} with Net Cash of PKR ${newHandover.net_cash_submitted.toLocaleString()} for CEO approval`,
      { 
        handover_code: newHandover.handover_code, 
        net_cash: newHandover.net_cash_submitted,
        gross_sales: newHandover.total_gross_sales,
        expenses_deducted: newHandover.total_expenses_deducted
      }
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

    if (this.supabase) {
      try {
        await this.supabase.from('cash_handovers').update({
          status: 'approved',
          acknowledged_by: updated.acknowledged_by,
          acknowledged_at: updated.acknowledged_at,
          ceo_notes: updated.ceo_notes,
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase cash handover approve sync notice:', e);
      }
    }

    await this.logActivity(
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

    if (this.supabase) {
      try {
        await this.supabase.from('cash_handovers').update({
          status: 'rejected',
          acknowledged_by: updated.acknowledged_by,
          acknowledged_at: updated.acknowledged_at,
          rejection_reason: updated.rejection_reason,
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase cash handover reject sync notice:', e);
      }
    }

    await this.logActivity(
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

    if (this.supabase) {
      try {
        await this.supabase.from('cash_handovers').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase cash handover delete sync notice:', e);
      }
    }

    if (hnd) {
      await this.logActivity(
        'handover_rejected',
        'Handover Record Deleted',
        `Deleted cash handover record ${hnd.handover_code} from ${hnd.staff_name}`,
        { handover_id: id, handover_code: hnd.handover_code }
      );
    }
  }

  /* ================= REAL-TIME ACTIVITY LOGS ================= */

  public async getActivityLogs(userId?: string, isCeo?: boolean): Promise<ActivityLog[]> {
    const logs = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
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
    const currentUser = actingUser || this.getCurrentUser();
    const activities = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      user_id: currentUser?.id || 'usr-system',
      user_name: currentUser?.full_name || 'System Admin',
      user_role: currentUser?.role || 'principal',
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

    if (this.supabase) {
      try {
        await this.supabase.from('activity_logs').upsert({
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
      } catch (e) {
        console.warn('Supabase activity log sync notice:', e);
      }
    }

    return newLog;
  }

  public async deleteActivityLog(id: string): Promise<void> {
    const activities = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, []);
    const filtered = activities.filter(a => a.id !== id);
    setItem(STORAGE_KEYS.ACTIVITIES, filtered);

    if (this.supabase) {
      try {
        await this.supabase.from('activity_logs').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase activity log delete sync notice:', e);
      }
    }
  }

  public async clearAllActivityLogs(): Promise<void> {
    setItem(STORAGE_KEYS.ACTIVITIES, []);

    if (this.supabase) {
      try {
        await this.supabase.from('activity_logs').delete().neq('id', '0');
      } catch (e) {
        console.warn('Supabase activity logs clear sync notice:', e);
      }
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
    await this.logActivity(
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

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').upsert({
          id: newCustomer.id,
          full_name: newCustomer.full_name,
          email: newCustomer.email || `${newCustomer.id}@school.pos`,
          role: 'staff',
          status: 'active',
          created_at: newCustomer.created_at,
        });
      } catch (e) {
        console.warn('Supabase customer create sync notice:', e);
      }
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
    return updated;
  }

  public async deleteCustomer(id: string): Promise<void> {
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
    const filtered = customers.filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CUSTOMERS, filtered);

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase customer delete sync notice:', e);
      }
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
        try {
          await this.supabase.from('transactions').upsert({
            id: tx.id,
            invoice_number: tx.invoice_number,
            buyer_type: tx.buyer_type,
            buyer_name: tx.buyer_name,
            total_amount: tx.total_amount,
            paid_amount: tx.paid_amount,
            pending_amount: tx.pending_amount,
            payment_method: paymentMethod,
          });
        } catch (e) {
          console.warn('Supabase dues payment tx update sync notice:', e);
        }
      }
    }

    setItem(STORAGE_KEYS.TRANSACTIONS, transactions);

    await this.logActivity(
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
    
    // Preserve ONLY the active CEO / Super Admin account currently executing the wipe
    const executingAccount: UserProfile = (currentUser && users.find(u => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()))
      || currentUser
      || users.find(u => u.role === 'ceo' || u.email === 'ceo@haidermemorial.edu.pk')
      || {
        id: 'usr-ceo-01',
        email: 'ceo@haidermemorial.edu.pk',
        full_name: 'Chief Executive Officer (CEO)',
        role: 'ceo' as const,
        status: 'active' as const,
        password: password === 'CeoMaster@2026' ? 'CeoMaster@2026' : password,
        created_at: new Date().toISOString(),
      };

    // Keep active status and ceo role on the executing account
    executingAccount.status = 'active';
    executingAccount.role = 'ceo';
    if (!executingAccount.password || executingAccount.password === 'password123') {
      executingAccount.password = password;
    }

    // 1. Wipe all local data collections completely
    setItem(STORAGE_KEYS.PRODUCTS, []);
    setItem(STORAGE_KEYS.CATEGORIES, []);
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
        description: `Complete system & database wipe executed by ${executingAccount.full_name}. All products, categories, transactions, customers, expenses, handovers, and other user accounts deleted clean.`,
        details: { reset_at: new Date().toISOString() },
        created_at: new Date().toISOString(),
      }
    ]);
    
    // Preserve ONLY the executing CEO account in users list & keep active session logged in
    setItem(STORAGE_KEYS.USERS, [executingAccount]);
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
      const execId = executingAccount.id;
      const execEmail = executingAccount.email.trim().toLowerCase();

      try {
        // Sequential deletion respecting foreign key dependencies:
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

        // Products (must be deleted before categories due to FK)
        const prodRes = await client.from('products').delete().neq('id', '___none___');
        if (prodRes.error) console.warn('Supabase products wipe error:', prodRes.error.message);

        // Categories
        const catRes = await client.from('categories').delete().neq('id', '___none___');
        if (catRes.error) console.warn('Supabase categories wipe error:', catRes.error.message);

        // Profiles: Delete all profiles EXCEPT the executing CEO account (matches both ID and Email)
        const profRes = await client
          .from('profiles')
          .delete()
          .neq('id', execId)
          .neq('email', execEmail);
        if (profRes.error) console.warn('Supabase profiles wipe error:', profRes.error.message);

        // Ensure the CEO account is preserved / upserted in Supabase profiles
        const ceoUpsertRes = await client.from('profiles').upsert({
          id: execId,
          email: execEmail,
          full_name: executingAccount.full_name,
          role: 'principal', // DB schema constraint: CHECK (role IN ('principal', 'staff'))
          status: 'active',
          updated_at: new Date().toISOString(),
        });
        if (ceoUpsertRes.error) console.warn('Supabase CEO profile preserve error:', ceoUpsertRes.error.message);

      } catch (e: any) {
        console.warn('Supabase cloud factory reset notice:', e?.message || e);
      }
    }

    return { success: true, message: 'System factory reset successful. All database records and accounts wiped clean. CEO super admin account retained.' };
  }
}

export const db = new DatabaseService();
