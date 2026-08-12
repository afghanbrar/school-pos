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
  wholesaler_name?: string;
  wholesaler_details?: string;
  purchase_payment_channel?: string;
  purchased_by?: string;
  created_at: string;
  updated_at: string;
}

export type BuyerType = 'student' | 'external_school';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash';

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

// School Operational & Petty Cash Expenses Logged by Staff
export type ExpenseCategory = 
  | 'utilities'
  | 'maintenance'
  | 'stationery'
  | 'refreshments'
  | 'transport'
  | 'emergency'
  | 'inventory_purchase'
  | 'other';

export interface SchoolExpense {
  id: string;
  staff_id: string;
  staff_name: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  payment_channel: string;
  receipt_ref?: string;
  description?: string;
  created_at: string;
}

// Cash Handover from Staff to CEO with Approval Workflow
export type HandoverStatus = 'pending' | 'approved' | 'rejected';

export interface CashHandover {
  id: string;
  handover_code: string; // e.g. HND-202608-001
  staff_id: string;
  staff_name: string;
  period_start: string;
  period_end: string;
  gross_sales_cash: number;
  gross_sales_digital: number;
  total_gross_sales: number;
  total_expenses_deducted: number;
  net_cash_submitted: number;
  expense_ids: string[];
  transaction_ids: string[];
  notes?: string;
  status: HandoverStatus;
  submitted_at: string;
  acknowledged_by?: string; // CEO Name / ID
  acknowledged_at?: string;
  rejection_reason?: string;
  ceo_notes?: string;
}

// Real-Time Audit Activity Log
export type ActivityAction = 
  | 'sale_created' 
  | 'expense_logged' 
  | 'expense_deleted'
  | 'handover_submitted' 
  | 'handover_approved' 
  | 'handover_rejected' 
  | 'product_added' 
  | 'product_updated' 
  | 'product_deleted' 
  | 'category_created' 
  | 'staff_created' 
  | 'user_status_changed' 
  | 'profile_updated';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: ActivityAction;
  title: string;
  description: string;
  details?: Record<string, any>;
  created_at: string;
}
