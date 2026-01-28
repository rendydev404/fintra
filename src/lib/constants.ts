import { AccountType, CategoryType, BillingCycle } from '@/types';

// App Info
export const APP_NAME = 'FinTra';
export const APP_DESCRIPTION = 'Aplikasi pelacak keuangan pribadi super canggih';

// Currency
export const DEFAULT_CURRENCY = 'IDR';
export const SUPPORTED_CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', name: 'Rupiah Indonesia' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
];

// Account Types
export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'bank', label: 'Bank', icon: 'building-2' },
  { value: 'e-wallet', label: 'E-Wallet', icon: 'smartphone' },
  { value: 'cash', label: 'Tunai', icon: 'banknote' },
  { value: 'crypto', label: 'Crypto', icon: 'bitcoin' },
  { value: 'investment', label: 'Investasi', icon: 'trending-up' },
];

// Account Colors
export const ACCOUNT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

// Billing Cycles
export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'quarterly', label: 'Per 3 Bulan' },
  { value: 'yearly', label: 'Tahunan' },
];

// Default Categories
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan & Minuman', icon: 'utensils', color: '#F59E0B' },
  { name: 'Transportasi', icon: 'car', color: '#3B82F6' },
  { name: 'Belanja', icon: 'shopping-bag', color: '#EC4899' },
  { name: 'Tagihan & Utilitas', icon: 'receipt', color: '#EF4444' },
  { name: 'Hiburan', icon: 'gamepad-2', color: '#8B5CF6' },
  { name: 'Kesehatan', icon: 'heart-pulse', color: '#10B981' },
  { name: 'Pendidikan', icon: 'graduation-cap', color: '#06B6D4' },
  { name: 'Kecantikan & Perawatan', icon: 'sparkles', color: '#F472B6' },
  { name: 'Rumah Tangga', icon: 'home', color: '#84CC16' },
  { name: 'Donasi', icon: 'heart-handshake', color: '#A855F7' },
  { name: 'Langganan', icon: 'repeat', color: '#0EA5E9' },
  { name: 'Lainnya', icon: 'more-horizontal', color: '#6B7280' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji', icon: 'briefcase', color: '#10B981' },
  { name: 'Freelance', icon: 'laptop', color: '#3B82F6' },
  { name: 'Investasi', icon: 'trending-up', color: '#8B5CF6' },
  { name: 'Bonus', icon: 'gift', color: '#F59E0B' },
  { name: 'Hadiah', icon: 'party-popper', color: '#EC4899' },
  { name: 'Penjualan', icon: 'store', color: '#06B6D4' },
  { name: 'Pengembalian', icon: 'undo-2', color: '#84CC16' },
  { name: 'Lainnya', icon: 'more-horizontal', color: '#6B7280' },
];

// Chart Colors
export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Date Formats
export const DATE_FORMAT = 'dd MMM yyyy';
export const DATE_TIME_FORMAT = 'dd MMM yyyy, HH:mm';
export const MONTH_YEAR_FORMAT = 'MMMM yyyy';

// Navigation Items
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { href: '/accounts', label: 'Akun', icon: 'wallet' },
  { href: '/transactions', label: 'Transaksi', icon: 'arrow-left-right' },
  { href: '/budgets', label: 'Anggaran', icon: 'pie-chart' },
  { href: '/goals', label: 'Target', icon: 'target' },
  { href: '/subscriptions', label: 'Langganan', icon: 'repeat' },
  { href: '/ai-insights', label: 'AI Insights', icon: 'sparkles' },
  { href: '/reports', label: 'Laporan', icon: 'file-bar-chart' },
];

export const NAV_SECONDARY = [
  { href: '/settings', label: 'Pengaturan', icon: 'settings' },
];

// Financial Health Grades
export const HEALTH_GRADES = {
  A: { min: 80, label: 'Sangat Baik', color: '#10B981' },
  B: { min: 60, label: 'Baik', color: '#84CC16' },
  C: { min: 40, label: 'Cukup', color: '#F59E0B' },
  D: { min: 20, label: 'Perlu Perbaikan', color: '#F97316' },
  F: { min: 0, label: 'Kritis', color: '#EF4444' },
};
