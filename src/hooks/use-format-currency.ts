import { useAppStore } from '@/stores/app-store';
import { formatCurrency } from '@/lib/utils';
import { useCallback } from 'react';

/**
 * Hook that returns a formatCurrency function using the user's preferred currency
 */
export function useFormatCurrency() {
  const user = useAppStore((state) => state.user);
  const currency = user?.currency || 'IDR';
  
  const formatWithUserCurrency = useCallback(
    (amount: number) => {
      // Determine locale based on currency
      const localeMap: Record<string, string> = {
        'IDR': 'id-ID',
        'USD': 'en-US',
        'EUR': 'de-DE',
        'SGD': 'en-SG',
        'MYR': 'ms-MY',
      };
      const locale = localeMap[currency] || 'en-US';
      
      return formatCurrency(amount, currency, locale);
    },
    [currency]
  );

  return formatWithUserCurrency;
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'IDR': 'Rp',
    'USD': '$',
    'EUR': '€',
    'SGD': 'S$',
    'MYR': 'RM',
  };
  return symbols[currency] || currency;
}

/**
 * Hook that returns the user's currency symbol
 */
export function useCurrencySymbol() {
  const user = useAppStore((state) => state.user);
  const currency = user?.currency || 'IDR';
  return getCurrencySymbol(currency);
}
