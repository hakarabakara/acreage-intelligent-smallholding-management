import { useCallback } from 'react';
import { useFarmStore } from '@/lib/farm-store';
import { DEFAULT_CURRENCIES } from '@/lib/constants';
export function useFormatting() {
  const settings = useFarmStore((state) => state.settings);
  const formatCurrency = useCallback((amount: number) => {
    const currencyCode = settings?.currency || 'USD';
    const customCurrencies = settings?.customCurrencies || [];
    try {
      // Try standard formatting first
      // We check if it's a valid ISO code by attempting to format
      // If it fails, it throws an error, which we catch
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (error) {
      // Fallback for custom/invalid codes
      const allCurrencies = [...DEFAULT_CURRENCIES, ...customCurrencies];
      const currency = allCurrencies.find(c => c.code === currencyCode);
      const symbol = currency?.symbol || currencyCode;
      // Simple formatting with symbol
      return `${symbol}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
    }
  }, [settings?.currency, settings?.customCurrencies]);
  const formatNumber = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  }, []);
  return { formatCurrency, formatNumber };
}