import type { 
  Category, 
  Product, 
  Transaction, 
  UserProfile, 
  SchoolSettings,
  SchoolExpense,
  CashHandover,
  ActivityLog
} from '../types';

export const INITIAL_SETTINGS: SchoolSettings = {
  name: 'Haider Memorial School POS and Inventory System',
  tagline: 'Excellence in Education & Character',
  address: 'Block 5, Education City Campus, Main Boulevard',
  phone: '+92 300 1234567 / (042) 35890123',
  email: 'principal@haidermemorial.edu.pk',
  logo_url: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80',
  currency_symbol: 'PKR',
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-ceo-01',
    email: 'ceo@haidermemorial.edu.pk',
    full_name: 'Chief Executive Officer (CEO)',
    role: 'ceo',
    status: 'active',
    password: 'CeoMaster@2026',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr-principal-01',
    email: 'bina.iftikhar@gmail.com',
    full_name: 'Rubina Iftikhar',
    role: 'principal',
    gender: 'female',
    status: 'active',
    password: '12345678',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_CUSTOMERS: any[] = [];

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const generateSampleTransactions = (): Transaction[] => [];

export const INITIAL_EXPENSES: SchoolExpense[] = [];

export const INITIAL_HANDOVERS: CashHandover[] = [];

export const INITIAL_ACTIVITIES: ActivityLog[] = [];
