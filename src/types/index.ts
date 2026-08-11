export type UserRole = 'principal' | 'staff';
export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon_name?: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  cost_price: number;
  sale_price: number;
  quantity: number;
  size?: string;
  color?: string;
  variant?: string;
  created_at: string;
  updated_at: string;
}

export type BuyerType = 'student' | 'external_school';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'easypaisa';

export interface CartItem {
  product: Product;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
}

export interface TransactionItem {
  id?: string;
  transaction_id?: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  unit_cost: number;
  quantity: number;
  total_price: number;
  size?: string;
  color?: string;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  buyer_type: BuyerType;
  buyer_name: string;
  student_roll_no?: string;
  student_class?: string;
  school_name?: string;
  staff_id: string;
  staff_name?: string;
  total_amount: number;
  discount: number;
  paid_amount: number;
  pending_amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  items: TransactionItem[];
}

export interface SchoolSettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  currency_symbol: string;
}

export interface CustomerProfile {
  id: string;
  type: BuyerType;
  full_name: string;
  roll_no?: string;
  class_grade?: string;
  school_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export type ToastType = 'success' | 'delete' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export type DateFilterRange = '1M' | '3M' | '6M' | '1Y' | '5Y' | 'custom';

