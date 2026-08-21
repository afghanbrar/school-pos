export const formatRoleLabel = (role?: string): string => {
  if (!role) return 'Staff';
  switch (role.toLowerCase()) {
    case 'ceo':
      return 'CEO (Super Admin)';
    case 'cashier':
      return 'Cashier';
    case 'principal':
      return 'Principal';
    case 'staff':
      return 'Staff';
    case 'accountant':
      return 'Accountant';
    case 'manager':
      return 'Manager';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

export const getRoleBadgeStyle = (role?: string): { bg: string; text: string; border: string } => {
  const r = (role || 'staff').toLowerCase();
  switch (r) {
    case 'ceo':
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-950',
        text: 'text-emerald-800 dark:text-emerald-200',
        border: 'border-emerald-300 dark:border-emerald-800',
      };
    case 'principal':
      return {
        bg: 'bg-purple-100 dark:bg-purple-950',
        text: 'text-purple-800 dark:text-purple-200',
        border: 'border-purple-300 dark:border-purple-800',
      };
    case 'cashier':
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-950',
        text: 'text-indigo-800 dark:text-indigo-200',
        border: 'border-indigo-300 dark:border-indigo-800',
      };
    case 'accountant':
      return {
        bg: 'bg-teal-100 dark:bg-teal-950',
        text: 'text-teal-800 dark:text-teal-200',
        border: 'border-teal-300 dark:border-teal-800',
      };
    case 'manager':
      return {
        bg: 'bg-amber-100 dark:bg-amber-950',
        text: 'text-amber-800 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-800',
      };
    case 'staff':
    default:
      return {
        bg: 'bg-blue-100 dark:bg-blue-950',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-300 dark:border-blue-800',
      };
  }
};

export const AVAILABLE_ROLES = [
  { value: 'ceo', label: 'CEO (Super Admin - Full Authority)' },
  { value: 'cashier', label: 'Cashier (POS Sales & Invoicing)' },
  { value: 'principal', label: 'Principal (Academic / Staff Access)' },
  { value: 'staff', label: 'Staff (Standard Cashier Access)' },
  { value: 'accountant', label: 'Accountant (Ledger & Financials)' },
  { value: 'manager', label: 'Manager (Campus Operations)' },
] as const;
