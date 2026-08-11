import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  UserProfile, 
  Category, 
  Product, 
  Transaction, 
  SchoolSettings,
  UserStatus,
  CustomerProfile,
  PaymentMethod
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  generateSampleTransactions,
  INITIAL_SETTINGS,
  INITIAL_CUSTOMERS
} from './mockData';

const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ektqwpnsqqnrukubnmiw.supabase.co';
const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrdHF3cG5zcXFucnVrdWJubWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDUzNDMsImV4cCI6MjEwMTMyMTM0M30.WQTHB6qyn4Aah9zZlSfllqZCL5RHVzN1ZdCYFw0oMbA';

const STORAGE_KEYS = {
  USERS: 'school_pos_users_v1',
  CATEGORIES: 'school_pos_categories_v1',
  PRODUCTS: 'school_pos_products_v1',
  TRANSACTIONS: 'school_pos_transactions_v1',
  SETTINGS: 'school_pos_settings_v1',
  CUSTOMERS: 'school_pos_customers_v1',
  CURRENT_USER: 'school_pos_current_user_v1',
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
    this.syncLocalToSupabase();
  }

  private initLocalDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      setItem(STORAGE_KEYS.TRANSACTIONS, generateSampleTransactions());
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
  }

  public initSupabaseClient() {
    let url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    let key = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_KEY;

    // Normalize API URL if user or config included /rest/v1/ suffix
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
  /**
   * Automatically migrate local categories, products, profiles, and transactions to live Supabase database
   */
  public async syncLocalToSupabase(): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      return { success: false, message: 'Supabase client is not connected.' };
    }

    try {
      // 1. Sync Categories
      const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
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
        if (catErr) throw new Error(`Categories Table: ${catErr.message}`);
      }

      // 2. Sync Products
      const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
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
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          }))
        );
        if (prodErr) throw new Error(`Products Table: ${prodErr.message}`);
      }

      // 3. Sync User Profiles
      const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      if (users.length > 0) {
        const { error: userErr } = await this.supabase.from('profiles').upsert(
          users.map(u => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            role: u.role,
            status: u.status,
            created_at: u.created_at || new Date().toISOString(),
          }))
        );
        if (userErr) throw new Error(`Profiles Table: ${userErr.message}`);
      }

      // 4. Sync Transactions
      const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, generateSampleTransactions());
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
        if (txErr) throw new Error(`Transactions Table: ${txErr.message}`);
      }

      return { success: true, message: 'All local categories, products, profiles, and transactions successfully synced to Supabase!' };
    } catch (e: any) {
      console.warn('Background Supabase sync notice:', e);
      return { success: false, message: e.message || 'Supabase sync failed.' };
    }
  }

  public async registerUser(fullName: string, email: string, role: 'principal' | 'staff', password?: string): Promise<UserProfile> {
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
    const principal = users.find(u => u.role === 'principal');
    if (!principal) throw new Error('Principal account not found.');
    if (principal.status === 'inactive') {
      throw new Error('Principal account is currently deactivated.');
    }

    setItem(STORAGE_KEYS.CURRENT_USER, principal);
    return principal;
  }

  public async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const normalizedEmail = email.trim().toLowerCase();

    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.status === 'inactive') {
      throw new Error('ACCESS DENIED: Your account has been deactivated by Super Admin. Please contact Principal.');
    }

    if (!pass) {
      throw new Error('Password is required.');
    }

    // Verify password if user has a password set
    if (user.password && user.password !== pass) {
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

    // Update current user session if it's the active user
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      setItem(STORAGE_KEYS.CURRENT_USER, users[index]);
    }

    // Sync to Supabase Profiles
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

    return users[index];
  }

  public async createStaffUser(fullName: string, email: string, password?: string): Promise<UserProfile> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('A user with this email address already exists.');
    }

    const newUser: UserProfile = {
      id: `usr-staff-${Date.now().toString().slice(-4)}`,
      email: normalizedEmail,
      full_name: fullName.trim(),
      role: 'staff',
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

    return newUser;
  }

  public async updateUserStatus(userId: string, status: UserStatus): Promise<UserProfile> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found.');

    if (users[index].role === 'principal') {
      throw new Error('Principal super admin status cannot be set to inactive.');
    }

    users[index].status = status;
    setItem(STORAGE_KEYS.USERS, users);
    return users[index];
  }

  public async resetUserPassword(userId: string, newPassword?: string): Promise<void> {
    const users = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.password = newPassword || 'password123';
    setItem(STORAGE_KEYS.USERS, users);
    console.log(`Password reset for ${user.email}`);
  }

  public async getCategories(): Promise<Category[]> {
    return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
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

    // Live Sync to Supabase
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

    return newCategory;
  }

  public async deleteCategory(id: string): Promise<void> {
    const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const filtered = categories.filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CATEGORIES, filtered);

    // Update products that belonged to this category
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const defaultCat = filtered[0]?.id || '';
    const updatedProducts = products.map(p => p.category_id === id ? { ...p, category_id: defaultCat } : p);
    setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // Live Sync to Supabase
    if (this.supabase) {
      try {
        await this.supabase.from('categories').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase category delete sync notice:', e);
      }
    }
  }

  public async getProducts(): Promise<Product[]> {
    return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
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

    // Live Sync to Supabase
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
          created_at: newProduct.created_at,
          updated_at: newProduct.updated_at,
        });
      } catch (e) {
        console.warn('Supabase product add sync notice:', e);
      }
    }

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

    // Live Sync to Supabase
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
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        });
      } catch (e) {
        console.warn('Supabase product update sync notice:', e);
      }
    }

    return updated;
  }

  public async deleteProduct(id: string): Promise<void> {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    setItem(STORAGE_KEYS.PRODUCTS, filtered);

    // Live Sync to Supabase
    if (this.supabase) {
      try {
        await this.supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase product delete sync notice:', e);
      }
    }
  }

  public async getTransactions(): Promise<Transaction[]> {
    return getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, generateSampleTransactions());
  }

  public async createTransaction(txData: Omit<Transaction, 'id' | 'invoice_number' | 'created_at'>): Promise<Transaction> {
    const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, generateSampleTransactions());
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
    return newTx;
  }

  public async getSettings(): Promise<SchoolSettings> {
    return getItem<SchoolSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public async updateSettings(settings: SchoolSettings): Promise<SchoolSettings> {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  }

  public async getCustomers(): Promise<CustomerProfile[]> {
    return getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  public async createCustomer(customerData: Omit<CustomerProfile, 'id' | 'created_at'>): Promise<CustomerProfile> {
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
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
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
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
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const filtered = customers.filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CUSTOMERS, filtered);
  }

  public async payCustomerDues(
    customerId: string,
    amountToPay: number,
    paymentMethod: PaymentMethod
  ): Promise<number> {
    const customers = getItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const customer = customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer profile not found.');

    const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, generateSampleTransactions());

    // Match transactions by name, roll_no, or school_name
    const matchingTxs = transactions.filter(tx => {
      if (tx.pending_amount <= 0) return false;

      const matchesName = tx.buyer_name.toLowerCase().trim() === customer.full_name.toLowerCase().trim();
      const matchesRollNo = Boolean(customer.roll_no && tx.student_roll_no && tx.student_roll_no.toLowerCase().trim() === customer.roll_no.toLowerCase().trim());
      const matchesSchool = Boolean(customer.school_name && tx.school_name && tx.school_name.toLowerCase().trim() === customer.school_name.toLowerCase().trim());

      return matchesName || matchesRollNo || matchesSchool;
    });

    let remainingPayment = amountToPay;
    let totalSettled = 0;

    // Process payment against matching pending transactions starting from oldest
    matchingTxs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const tx of matchingTxs) {
      if (remainingPayment <= 0) break;

      const settledForTx = Math.min(remainingPayment, tx.pending_amount);
      tx.paid_amount += settledForTx;
      tx.pending_amount -= settledForTx;

      remainingPayment -= settledForTx;
      totalSettled += settledForTx;

      // Also live sync updated transaction to Supabase if connected
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
    return totalSettled;
  }
}

export const db = new DatabaseService();

