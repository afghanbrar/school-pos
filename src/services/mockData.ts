import type { Category, Product, Transaction, UserProfile, SchoolSettings } from '../types';

export const INITIAL_SETTINGS: SchoolSettings = {
  name: 'Haider Memorial School & College',
  tagline: 'Excellence in Education & Character',
  address: 'Block 5, Education City Campus, Main Boulevard',
  phone: '+92 300 1234567 / (042) 35890123',
  email: 'principal@haidermemorial.edu.pk',
  logo_url: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80',
  currency_symbol: 'PKR',
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-principal-01',
    email: 'principal@haidermemorial.edu.pk',
    full_name: 'Dr. Arthur Pendelton (Principal)',
    role: 'principal',
    status: 'active',
    password: 'password123',
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    id: 'usr-staff-01',
    email: 'staff.ahmed@haidermemorial.edu.pk',
    full_name: 'Ahmed Hassan',
    role: 'staff',
    status: 'active',
    password: 'password123',
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
  {
    id: 'usr-staff-02',
    email: 'staff.fatima@haidermemorial.edu.pk',
    full_name: 'Fatima Zahra',
    role: 'staff',
    status: 'active',
    password: 'password123',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'usr-staff-03',
    email: 'staff.bilal@haidermemorial.edu.pk',
    full_name: 'Bilal Khan',
    role: 'staff',
    status: 'inactive',
    password: 'password123',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export const INITIAL_CUSTOMERS = [
  {
    id: 'stud-1001',
    type: 'student' as const,
    full_name: 'Muhammad Ali Khan',
    roll_no: 'HMS-2026-042',
    class_grade: 'Grade 9-A',
    phone: '+92 300 9876543',
    email: 'ali.khan@gmail.com',
    address: 'Gulberg III, Lahore',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'stud-1002',
    type: 'student' as const,
    full_name: 'Fatima Zahra',
    roll_no: 'HMS-2026-088',
    class_grade: 'Grade 7-B',
    phone: '+92 321 4567890',
    email: 'fatima.zahra@gmail.com',
    address: 'DHA Phase 5, Lahore',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'cust-2001',
    type: 'external_school' as const,
    full_name: 'Standard Grammar School (Bulk Procurement)',
    school_name: 'Standard Grammar School',
    phone: '+92 42 35789012',
    email: 'info@standardgrammar.edu.pk',
    address: 'Model Town, Lahore',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-01', name: 'Books', description: 'Curriculum Textbooks & Notebooks', icon_name: 'BookOpen', created_at: new Date().toISOString() },
  { id: 'cat-02', name: 'Uniforms', description: 'Daily School Shirts, Trousers & Skirts', icon_name: 'Shirt', created_at: new Date().toISOString() },
  { id: 'cat-03', name: 'Scarves', description: 'Official Hijabs & Headscarves', icon_name: 'Sparkles', created_at: new Date().toISOString() },
  { id: 'cat-04', name: 'Shoes', description: 'Black Leather & White Sports Shoes', icon_name: 'Footprints', created_at: new Date().toISOString() },
  { id: 'cat-05', name: 'Ties & Belts', description: 'School Crest Ties & Leather Belts', icon_name: 'Tag', created_at: new Date().toISOString() },
  { id: 'cat-06', name: 'Caps', description: 'Summer & Winter Crested Caps', icon_name: 'HardHat', created_at: new Date().toISOString() },
  { id: 'cat-07', name: 'Sports Gear', description: 'Badminton, Cricket, Football & Tracksuits', icon_name: 'Trophy', created_at: new Date().toISOString() },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-101',
    sku: 'BK-ENG-09',
    name: 'Oxford English Literature Class 9',
    category_id: 'cat-01',
    cost_price: 650,
    sale_price: 950,
    quantity: 45,
    size: 'Standard',
    color: 'Red/Blue Cover',
    variant: 'Edition 2026',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-102',
    sku: 'BK-MATH-10',
    name: 'Advanced Mathematics Grade 10',
    category_id: 'cat-01',
    cost_price: 800,
    sale_price: 1200,
    quantity: 30,
    size: 'Standard',
    color: 'Green Cover',
    variant: 'Edition 2026',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-103',
    sku: 'UNIF-SH-L',
    name: 'Boy Crisp White Uniform Shirt',
    category_id: 'cat-02',
    cost_price: 900,
    sale_price: 1450,
    quantity: 60,
    size: 'L (Size 38)',
    color: 'White',
    variant: 'Cotton Poly Blend',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-104',
    sku: 'UNIF-TR-M',
    name: 'Boy Navy Blue School Trouser',
    category_id: 'cat-02',
    cost_price: 1100,
    sale_price: 1800,
    quantity: 25,
    size: 'M (Size 32)',
    color: 'Navy Blue',
    variant: 'Gabardine',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-105',
    sku: 'SCARF-EMB',
    name: 'Official Embroidered White Hijab Scarf',
    category_id: 'cat-03',
    cost_price: 350,
    sale_price: 600,
    quantity: 80,
    size: 'Medium',
    color: 'Pure White',
    variant: 'Chiffon',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-106',
    sku: 'SHOE-BLK-40',
    name: 'Black Leather School Formal Shoes',
    category_id: 'cat-04',
    cost_price: 2200,
    sale_price: 3400,
    quantity: 18,
    size: '40 EU',
    color: 'Black',
    variant: 'Genuine Leather',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-107',
    sku: 'SHOE-WHT-38',
    name: 'White Canvas Sports PT Shoes',
    category_id: 'cat-04',
    cost_price: 1300,
    sale_price: 2100,
    quantity: 4,
    size: '38 EU',
    color: 'White',
    variant: 'Rubber Sole',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-108',
    sku: 'TIE-STRIP',
    name: 'Woven Crest Silk Tie',
    category_id: 'cat-05',
    cost_price: 250,
    sale_price: 450,
    quantity: 120,
    size: 'Standard',
    color: 'Maroon / Gold Striped',
    variant: 'Silk',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-109',
    sku: 'CAP-NAVY',
    name: 'School Crest Sun Cap',
    category_id: 'cat-06',
    cost_price: 300,
    sale_price: 550,
    quantity: 50,
    size: 'Adjustable',
    color: 'Navy Blue',
    variant: 'Cotton Twill',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-110',
    sku: 'SPRT-CRK-BAT',
    name: 'English Willow Cricket Bat (Grade A)',
    category_id: 'cat-07',
    cost_price: 4500,
    sale_price: 7200,
    quantity: 8,
    size: 'Size 6',
    color: 'Natural Wood',
    variant: 'Tournament Grade',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const generateSampleTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = new Date();
  const dateOffsets = [0.1, 1, 3, 7, 14, 25, 40, 60, 90, 150, 300, 450, 700];

  dateOffsets.forEach((daysAgo, idx) => {
    const txDate = new Date(now.getTime() - daysAgo * 86400000).toISOString();
    const isStudent = idx % 2 === 0;
    const staffId = idx % 3 === 0 ? 'usr-staff-01' : 'usr-staff-02';
    const staffName = idx % 3 === 0 ? 'Ahmed Hassan' : 'Fatima Zahra';

    const item1 = INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length];
    const item2 = INITIAL_PRODUCTS[(idx + 2) % INITIAL_PRODUCTS.length];

    const qty1 = (idx % 3) + 1;
    const qty2 = (idx % 2) + 1;

    const total1 = item1.sale_price * qty1;
    const total2 = item2.sale_price * qty2;
    const totalAmount = total1 + total2;
    const discount = idx % 4 === 0 ? 200 : 0;
    const netTotal = totalAmount - discount;

    const isPartial = idx % 5 === 0;
    const paidAmount = isPartial ? Math.round(netTotal * 0.6) : netTotal;
    const pendingAmount = netTotal - paidAmount;

    const methods: ('cash' | 'bank_transfer' | 'easypaisa')[] = ['cash', 'bank_transfer', 'easypaisa'];
    const paymentMethod = methods[idx % 3];

    transactions.push({
      id: `tx-${1000 + idx}`,
      invoice_number: `INV-2026-${(1001 + idx).toString().padStart(4, '0')}`,
      buyer_type: isStudent ? 'student' : 'external_school',
      buyer_name: isStudent ? `Muhammad Ali (Student #${idx + 101})` : `Beaconhouse School System (Branch ${idx + 1})`,
      student_roll_no: isStudent ? `ROLL-2026-0${idx + 12}` : undefined,
      student_class: isStudent ? `Class ${((idx % 10) + 1)}-A` : undefined,
      school_name: !isStudent ? `Beaconhouse Campus ${idx + 1}` : undefined,
      staff_id: staffId,
      staff_name: staffName,
      total_amount: totalAmount,
      discount: discount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_method: paymentMethod,
      notes: pendingAmount > 0 ? 'Partial payment recorded. Balance due upon delivery.' : 'Paid in full.',
      created_at: txDate,
      items: [
        {
          id: `txi-${idx}-1`,
          product_id: item1.id,
          product_name: item1.name,
          unit_price: item1.sale_price,
          unit_cost: item1.cost_price,
          quantity: qty1,
          total_price: total1,
          size: item1.size,
          color: item1.color,
        },
        {
          id: `txi-${idx}-2`,
          product_id: item2.id,
          product_name: item2.name,
          unit_price: item2.sale_price,
          unit_cost: item2.cost_price,
          quantity: qty2,
          total_price: total2,
          size: item2.size,
          color: item2.color,
        },
      ],
    });
  });

  return transactions;
};
