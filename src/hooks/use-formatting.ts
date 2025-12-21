import { useCallback } from 'react';
import { useFarmStore } from '@/lib/farm-store';
export function useFormatting() {
  const settings = useFarmStore((state) => state.settings);
  const formatCurrency = useCallback((amount: number) => {
    const currency = settings?.currency || 'USD';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      // Fallback for invalid currency codes
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  }, [settings?.currency]);
  const formatNumber = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  }, []);
  return { formatCurrency, formatNumber };
}