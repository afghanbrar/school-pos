-- SCHOOL POS & INVENTORY MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL DATABASE SCHEMA & SECURITY POLICIES

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('principal', 'staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Inventory Table (with Wholesaler & Payment Channel Details)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  size TEXT,
  color TEXT,
  variant TEXT,
  wholesaler_name TEXT,
  wholesaler_details TEXT,
  purchase_payment_channel TEXT,
  purchased_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  buyer_type TEXT NOT NULL CHECK (buyer_type IN ('student', 'external_school')),
  buyer_name TEXT NOT NULL,
  student_roll_no TEXT,
  student_class TEXT,
  school_name TEXT,
  staff_id TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL,
  pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. School Expenses Table (Ongoing Operating Expenses Deducted from Sales)
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_channel TEXT NOT NULL,
  receipt_ref TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Cash Handovers Table (Immutable Balance Handover from Staff to CEO)
CREATE TABLE IF NOT EXISTS public.cash_handovers (
  id TEXT PRIMARY KEY,
  handover_code TEXT UNIQUE NOT NULL,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_sales_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_sales_digital DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_gross_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_expenses_deducted DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_cash_submitted DECIMAL(10,2) NOT NULL DEFAULT 0,
  expense_ids JSONB DEFAULT '[]'::jsonb,
  transaction_ids JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  rejection_reason TEXT,
  ceo_notes TEXT
);

-- 7. Real-Time Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row-Level Security (RLS) & Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow access policies
DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on products" ON public.products;
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on transactions" ON public.transactions;
CREATE POLICY "Allow all on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on expenses" ON public.expenses;
CREATE POLICY "Allow all on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on cash_handovers" ON public.cash_handovers;
CREATE POLICY "Allow all on cash_handovers" ON public.cash_handovers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow all on activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
