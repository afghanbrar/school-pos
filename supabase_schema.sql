-- =========================================================================
-- SCHOOL POS & INVENTORY MANAGEMENT SYSTEM - COMPLETE SUPABASE SETUP
-- TARGET PROJECT: https://hxbqqcefvzpycwgveuet.supabase.co
-- Generated automatically: Schema + Security Policies + Restored Data
-- =========================================================================

-- 1. Profiles Table (Authentication & User Management)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  gender TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Tag',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Inventory Table
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

-- 4. Customers Table (Students & External Institutions)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('student', 'external_school')),
  full_name TEXT NOT NULL,
  roll_no TEXT,
  class_grade TEXT,
  school_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Transactions Table (Invoices, POS Orders & Student Sales)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  buyer_type TEXT NOT NULL CHECK (buyer_type IN ('student', 'external_school')),
  buyer_name TEXT NOT NULL,
  student_roll_no TEXT,
  student_class TEXT,
  school_name TEXT,
  staff_id TEXT,
  staff_name TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL,
  pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Operational School Expenses Table
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

-- 7. Cash Handovers Table (Staff to CEO Daily Balances)
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

-- 8. Audit Activity Logs Table
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

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on products" ON public.products;
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on customers" ON public.customers;
CREATE POLICY "Allow all on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on transactions" ON public.transactions;
CREATE POLICY "Allow all on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on expenses" ON public.expenses;
CREATE POLICY "Allow all on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on cash_handovers" ON public.cash_handovers;
CREATE POLICY "Allow all on cash_handovers" ON public.cash_handovers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow all on activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- DATA RESTORATION (SEEDED FROM OLD PROJECT EXPORTS)
-- =========================================================================

-- Profiles Data
INSERT INTO public.profiles (id, email, full_name, role, status, gender, password, created_at, updated_at)
VALUES ('usr-ceo-01', 'ceo@haidermemorial.edu.pk', 'Chief Executive Officer (CEO)', 'ceo', 'active', 'male', 'CeoMaster@2026', '2026-10-21 17:38:07.581+00', '2026-08-12 09:54:41.072376+00')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  gender = EXCLUDED.gender,
  password = EXCLUDED.password,
  updated_at = NOW();
INSERT INTO public.profiles (id, email, full_name, role, status, gender, password, created_at, updated_at)
VALUES ('usr-principal-01', 'bina.iftikhar@gmail.com', 'Rubina Iftikhar', 'principal', 'active', 'female', '12345678', '2026-10-21 17:38:07.582+00', '2026-10-18 16:48:48.062151+00')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  gender = EXCLUDED.gender,
  password = EXCLUDED.password,
  updated_at = NOW();

-- Categories Data (18 records)
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-0398', 'Pents', NULL, 'Tag', '2026-10-19 06:05:00.398+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-0471', 'Dupata', NULL, 'Tag', '2026-10-19 06:07:20.471+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-0476', 'Girls Jurcy', NULL, 'Tag', '2026-10-19 06:08:20.476+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-1668', 'Summer Cap', NULL, 'Tag', '2026-10-19 06:06:01.668+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-3389', 'Haiderian Track Suit', NULL, 'Tag', '2026-10-19 06:06:53.389+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-3505', 'Boys Shirts', NULL, 'Tag', '2026-10-19 06:05:13.505+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-4319', 'Haiderian Court', NULL, 'Tag', '2026-10-19 06:09:04.319+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-4659', 'Green Jacket', NULL, 'Tag', '2026-10-19 06:09:24.659+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-4748', 'Winter Cap', NULL, 'Tag', '2026-10-19 06:06:14.748+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-6496', 'Trousers', NULL, 'Tag', '2026-10-20 05:48:06.496+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-6530', 'Boys Sweeter', NULL, 'Tag', '2026-10-19 06:07:56.53+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-6921', 'Girls Sweeter', NULL, 'Tag', '2026-10-19 06:07:46.921+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-6952', 'Scarf', NULL, 'Tag', '2026-10-19 06:05:46.952+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-7535', 'Haiderian Slash', NULL, 'Tag', '2026-10-19 06:06:37.535+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-7552', 'Tie', NULL, 'Tag', '2026-10-19 06:05:37.552+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-7870', 'Girls Uniform', NULL, 'Tag', '2026-10-19 06:05:27.87+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-7908', 'Shoes', NULL, 'Tag', '2026-10-21 07:42:07.908+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
INSERT INTO public.categories (id, name, description, icon_name, created_at)
VALUES ('cat-9519', 'Boys Jurcy', NULL, 'Tag', '2026-10-19 06:08:29.519+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;

-- Products Data (59 records)
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1792604554263-y66d', 'SKU-2915', 'shoes', 'cat-7908', 1000, 1500, 15, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-21 17:42:34.263+00', '2026-10-21 17:42:34.263+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1792995908495-hkn0', 'SKU-9318', 'Coat  20''''', 'cat-4319', 2600, 2400, 5, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-26 06:25:08.495+00', '2026-10-26 06:25:08.495+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1792995983818-n9tk', 'SKU-4655', 'Coat 22''''', 'cat-4319', 3000, 2800, 2, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-26 06:26:23.818+00', '2026-10-26 06:26:23.818+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1792996206548-gsfn', 'SKU-6792', 'Coat 24''''', 'cat-4319', 3300, 3000, 1, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-26 06:30:06.548+00', '2026-10-26 06:30:06.548+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1792996294960-zqp3', 'SKU-7681', 'Coat 26''''', 'cat-4319', 3400, 3200, 5, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-26 06:31:34.96+00', '2026-10-26 06:31:34.96+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1792996344619-njq3', 'SKU-7744', 'Coat 28''''', 'cat-4319', 3600, 3400, 10, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-26 06:32:24.619+00', '2026-10-26 06:32:24.619+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1792997662210-xljb', 'SKU-1010', 'Coat 28''''', 'cat-4319', 3600, 3400, 10, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-26 06:54:22.21+00', '2026-10-26 06:54:22.21+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793002851731-oqbj', 'SKU-7454', 'Coat 30''''', 'cat-4319', 3800, 3600, 5, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-26 08:20:51.731+00', '2026-10-26 08:20:51.731+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793002995952-yv37', 'SKU-6907', 'Coat 36''''', 'cat-4319', 4200, 4000, 3, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-26 08:23:15.952+00', '2026-10-26 08:23:15.952+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793077867875-mfrb', 'SKU-7361', 'Pent 22''''', 'cat-0398', 1300, 1150, 30, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:11:07.875+00', '2026-10-27 05:11:07.875+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793077969265-3285', 'SKU-3285', 'Pent 24''''', 'cat-0398', 1400, 1220, 35, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:12:49.265+00', '2026-10-27 05:12:49.265+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793078015105-sqrr', 'SKU-7239', 'Pent 26''''', 'cat-0398', 1500, 1350, 17, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:13:35.105+00', '2026-10-27 05:13:35.105+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793078174924-7nes', 'SKU-9204', 'Pent 28''''', 'cat-0398', 1600, 1450, 10, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:16:14.924+00', '2026-10-27 05:16:14.924+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793078680788-fyul', 'SKU-2423', 'Pent 34''''', 'cat-0398', 1900, 1720, 15, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:24:40.788+00', '2026-10-27 05:24:40.788+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793078751691-hnyp', 'SKU-4249', 'Pent 36''''', 'cat-0398', 1950, 1780, 23, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:25:51.691+00', '2026-10-27 05:25:51.691+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793079049896-0n09', 'SKU-1330', 'Pent 38''''', 'cat-0398', 2100, 1850, 10, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:30:49.897+00', '2026-10-27 05:30:49.897+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793079164051-ibpm', 'SKU-7789', 'Pent 40', 'cat-0398', 1950, 2300, 10, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:32:44.052+00', '2026-10-27 05:32:44.052+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793079237082-axi0', 'SKU-1368', 'Pent 28 /40', 'cat-0398', 2300, 1950, 15, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:33:57.082+00', '2026-10-27 05:33:57.083+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793079302310-alqo', 'SKU-7798', 'Pent 29/40', 'cat-0398', 2300, 1950, 4, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:35:02.31+00', '2026-10-27 05:35:02.31+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793079383052-rmlv', 'SKU-2560', 'Tie Meduiem', 'cat-7552', 300, 350, 62, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:36:23.052+00', '2026-10-27 05:36:23.052+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793079426528-1ket', 'SKU-4377', 'Tie Large', 'cat-7552', 350, 400, 135, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:37:06.528+00', '2026-10-27 05:37:06.528+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793079804852-hi01', 'SKU-9712', 'Pent waist', 'cat-0398', 2300, 1950, 5, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:43:24.852+00', '2026-10-27 05:43:24.852+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793080083025-r78q', 'SKU-1644', 'Pent 34 waist', 'cat-0398', 2300, 1950, 7, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:48:03.025+00', '2026-10-27 05:48:03.025+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793080132851-v3xl', 'SKU-1016', 'Pent 36''''', 'cat-0398', 2300, 1950, 17, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 05:48:52.851+00', '2026-10-27 05:48:52.851+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793080835624-aei7', 'SKU-7965', 'Pent 38 waist', 'cat-0398', 2300, 1950, 8, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:00:35.624+00', '2026-10-27 06:00:35.624+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793081023033-d8mk', 'SKU-7249', 'Shirt 18''''', 'cat-3505', 1300, 1030, 10, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:03:43.033+00', '2026-10-27 06:03:43.033+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793081075930-k4x7', 'SKU-8062', 'Shirt 20''''', 'cat-3505', 1400, 1220, 5, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:04:35.93+00', '2026-10-27 06:04:35.93+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793081167009-ala3', 'SKU-7805', 'shirt 22''''', 'cat-3505', 1500, 1320, 3, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:06:07.009+00', '2026-10-27 06:06:07.009+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793081401148-d3nk', 'SKU-9380', 'Track soot yellow 22''''', 'cat-3389', 2600, 2400, 17, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:10:01.148+00', '2026-10-27 06:10:01.148+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793081736446-dfzl', 'SKU-3274', 'Track soot yellow 24''''', 'cat-3389', 2800, 2600, 4, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:15:36.446+00', '2026-10-27 06:15:36.446+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793081914217-2txx', 'SKU-3746', 'Track soot yellow 36''''', 'cat-3389', 3400, 3150, 10, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:18:34.217+00', '2026-10-27 06:18:34.217+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793082074421-1b52', 'SKU-7126', 'Track soot 38 yellow', 'cat-3389', 3700, 3300, 15, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:21:14.421+00', '2026-10-27 06:21:14.421+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793083069284-xz44', 'SKU-2836', 'Track soot 40 yellow', 'cat-3389', 3700, 3450, 3, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 06:37:49.284+00', '2026-10-27 06:37:49.284+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793085891177-7nb9', 'SKU-7160', 'Track soot 22 green', 'cat-3389', 2600, 2400, 20, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 07:24:51.177+00', '2026-10-27 07:24:51.177+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793086104518-9xa4', 'SKU-9998', 'Track soot 24''''', 'cat-3389', 2800, 2600, 3, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 07:28:24.518+00', '2026-10-27 07:28:24.518+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793086262436-85np', 'SKU-8426', 'Track soot 36 green', 'cat-3389', 3300, 3150, 3, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 07:31:02.436+00', '2026-10-27 07:31:02.436+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793086901836-huqy', 'SKU-8688', 'Track soot 40 green', 'cat-3389', 3600, 3450, 2, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 07:41:41.836+00', '2026-10-27 07:41:41.836+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793087115679-8lbn', 'SKU-6753', 'Track soot 38''''', 'cat-3389', 3600, 3300, 5, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 07:45:15.679+00', '2026-10-27 07:45:15.679+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793088552367-m8v8', 'SKU-2060', 'Scaraf Small', 'cat-6952', 600, 900, 65, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-27 08:09:12.367+00', '2026-10-27 08:09:12.367+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793174701197-tumz', 'SKU-3370', 'Girls uniform 20''''', 'cat-7870', 2100, 1900, 8, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-28 08:05:01.197+00', '2026-10-28 08:05:01.197+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793174832783-c5zf', 'SKU-1967', 'Girls uniform 22''''', 'cat-7870', 2200, 2000, 2, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-28 08:07:12.783+00', '2026-10-28 08:07:12.783+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793175071014-ostg', 'SKU-9663', 'Girls uniform 26''''', 'cat-7870', 1900, 2150, 14, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-28 08:11:11.014+00', '2026-10-28 08:11:11.014+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793175247575-fztw', 'SKU-3635', 'Girls uniform 28''''', 'cat-7870', 2000, 2300, 25, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-28 08:14:07.575+00', '2026-10-28 08:14:07.575+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793175340988-74gw', 'SKU-1904', 'Girls uniform 30;;', 'cat-7870', 2000, 2400, 55, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-28 08:15:40.988+00', '2026-10-28 08:15:40.988+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793251596648-zzgn', 'SKU-8336', 'Girls uniform 32''''', 'cat-7870', 2300, 2650, 44, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:26:36.648+00', '2026-10-29 05:26:36.648+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793251781872-oerv', 'SKU-4363', 'Girls Uniform 34''''', 'cat-7870', 2300, 2650, 47, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:29:41.872+00', '2026-10-29 05:29:41.872+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793252081232-ntjk', 'SKU-5059', 'Girls uniform 36''''', 'cat-7870', 2300, 2600, 55, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:34:41.232+00', '2026-10-29 05:34:41.232+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793252203405-1atv', 'SKU-6022', 'Girls uniform 38''''', 'cat-7870', 2400, 2700, 45, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:36:43.405+00', '2026-10-29 05:36:43.405+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793252284658-zmzb', 'SKU-8238', 'Girls uniform 40''''', 'cat-7870', 2500, 2800, 42, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:38:04.658+00', '2026-10-29 05:38:04.658+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793252364551-dlvp', 'SKU-4462', 'Girls uniform 42''''', 'cat-7870', 2800, 3050, 42, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:39:24.551+00', '2026-10-29 05:39:24.551+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793252512218-bjm2', 'SKU-5366', 'Girls uniform 44''''', 'cat-7870', 3000, 3200, 40, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:41:52.218+00', '2026-10-29 05:41:52.218+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793252648421-riq9', 'SKU-9561', 'Dupta sky 6th', 'cat-0471', 800, 1000, 13, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:44:08.421+00', '2026-10-29 05:44:08.421+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793252850032-9yx4', 'SKU-4309', 'Dupta yellow', 'cat-0471', 800, 1000, 5, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:47:30.032+00', '2026-10-29 05:47:30.032+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793253095951-owj4', 'SKU-2001', 'Dupata pink''''', 'cat-0471', 800, 1000, 3, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:51:35.951+00', '2026-10-29 05:51:35.951+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793253274444-ywoc', 'SKU-6910', 'Dupta purple', 'cat-0471', 800, 1000, 20, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:54:34.444+00', '2026-10-29 05:54:34.444+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793253340822-o8iz', 'SKU-1693', 'Dupta light green 1st year', 'cat-0471', 800, 1000, 9, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:55:40.822+00', '2026-10-29 05:55:40.822+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793253403189-6p4u', 'SKU-5027', 'Dupta dark purple 2nd year', 'cat-0471', 800, 1000, 2, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:56:43.189+00', '2026-10-29 05:56:43.189+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793253467212-rliw', 'SKU-6062', 'Scarf small', 'cat-6952', 600, 900, 65, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:57:47.212+00', '2026-10-29 05:57:47.212+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
INSERT INTO public.products (id, sku, name, category_id, cost_price, sale_price, quantity, size, color, variant, wholesaler_name, wholesaler_details, purchase_payment_channel, purchased_by, created_at, updated_at)
VALUES ('prod-1793253514602-oudz', 'SKU-5306', 'Scarf large', 'cat-6952', 800, 1000, 69, NULL, NULL, '{"v":"","wn":"","wd":"","pc":"Cash","pb":"CEO Office"}', NULL, NULL, 'Cash', 'CEO Office', '2026-10-29 05:58:34.602+00', '2026-10-29 05:58:34.602+00')
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  quantity = EXCLUDED.quantity,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  variant = EXCLUDED.variant,
  wholesaler_name = EXCLUDED.wholesaler_name,
  wholesaler_details = EXCLUDED.wholesaler_details,
  purchase_payment_channel = EXCLUDED.purchase_payment_channel,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = NOW();
