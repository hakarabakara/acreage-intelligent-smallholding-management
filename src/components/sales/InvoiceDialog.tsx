import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useFarmStore } from '@/lib/farm-store';
import { useFormatting } from '@/hooks/use-formatting';
import { PrintButton } from '@/components/ui/print-button';
import type { Order, Customer } from '@shared/types';
import { format } from 'date-fns';
import { Sprout, X } from 'lucide-react';
interface InvoiceDialogProps {
  order: Order | null;
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}
export function InvoiceDialog({ order, customer, isOpen, onClose }: InvoiceDialogProps) {
  const settings = useFarmStore((state) => state.settings);
  const { formatCurrency } = useFormatting();
  if (!order || !customer) return null;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white text-black">
        {/* Close button for screen only */}
        <div className="absolute right-4 top-4 z-50 no-print">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-8 md:p-12 h-full overflow-y-auto" id="invoice-content">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white print:bg-emerald-600 print:text-white">
                <Sprout className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{settings?.name || 'Farm Name'}</h1>
                <p className="text-sm text-gray-500">{settings?.location || 'Farm Address'}</p>
                <p className="text-sm text-gray-500">{settings?.ownerName}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-200 uppercase tracking-widest">Invoice</h2>
              <p className="text-sm text-gray-500 mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm text-gray-500">{format(order.date, 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <Separator className="my-8" />
          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
            <div className="text-gray-900 font-medium">{customer.name}</div>
            {customer.address && <div className="text-gray-600 text-sm">{customer.address}</div>}
            {customer.email && <div className="text-gray-600 text-sm">{customer.email}</div>}
            {customer.phone && <div className="text-gray-600 text-sm">{customer.phone}</div>}
          </div>
          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-4">{item.description}</td>
                  <td className="py-4 text-right">{item.quantity}</td>
                  <td className="py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 text-right font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-auto pt-8 border-t border-gray-100">
            <p className="font-medium text-gray-900 mb-1">Thank you for your business!</p>
            <p>Please make checks payable to {settings?.name || 'Farm Name'}. Payment is due within 30 days.</p>
          </div>
          {/* Print Actions */}
          <div className="mt-8 flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <PrintButton className="bg-emerald-600 hover:bg-emerald-700 text-white border-none" variant="default" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}