import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import type { InventoryItem, InventoryCategory } from '@shared/types';
import { cn } from '@/lib/utils';
interface StocktakeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adjustments: { id: string; quantity: number }[]) => Promise<void>;
  inventory: InventoryItem[];
  categories: InventoryCategory[];
}
export function StocktakeDialog({ isOpen, onClose, onSave, inventory, categories }: StocktakeDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setCounts({});
      setSelectedCategory('all');
    }
  }, [isOpen]);
  const filteredInventory = useMemo(() => {
    if (selectedCategory === 'all') return inventory;
    return inventory.filter(item => item.categoryId === selectedCategory);
  }, [inventory, selectedCategory]);
  const handleCountChange = (id: string, value: string) => {
    setCounts(prev => ({ ...prev, [id]: value }));
  };
  const calculateVariance = (item: InventoryItem) => {
    const actual = counts[item.id];
    if (actual === undefined || actual === '') return null;
    const numActual = Number(actual);
    if (isNaN(numActual)) return null;
    return numActual - item.quantity;
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const adjustments: { id: string; quantity: number }[] = [];
      Object.entries(counts).forEach(([id, value]) => {
        if (value !== '') {
          const numVal = Number(value);
          if (!isNaN(numVal)) {
            // Only include if value is different from system (though API might handle no-op)
            // Actually, stocktake confirms the count, so even if same, it's a verification.
            // But for "adjustments", we usually only send changes. 
            // The prompt says "perform batch adjustments".
            // Let's send all verified counts.
            adjustments.push({ id, quantity: numVal });
          }
        }
      });
      if (adjustments.length > 0) {
        await onSave(adjustments);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  const totalVariance = filteredInventory.reduce((acc, item) => {
    const variance = calculateVariance(item);
    return variance !== null ? acc + Math.abs(variance) : acc;
  }, 0);
  const itemsCounted = Object.keys(counts).filter(k => counts[k] !== '').length;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Inventory Stocktake</DialogTitle>
          <DialogDescription>
            Audit physical stock levels and reconcile discrepancies.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between py-4 gap-4">
          <div className="w-[250px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{itemsCounted} / {filteredInventory.length} Counted</span>
            </div>
            {totalVariance > 0 && (
              <div className="flex items-center gap-2 text-amber-600 font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>{totalVariance} Unit Variance</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 border rounded-md overflow-hidden bg-background">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[300px]">Item Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead className="w-[150px] text-right">Actual Qty</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const variance = calculateVariance(item);
                  const hasVariance = variance !== null && variance !== 0;
                  return (
                    <TableRow key={item.id} className={cn(hasVariance ? "bg-amber-50/30 dark:bg-amber-950/10" : "")}>
                      <TableCell className="font-medium">
                        {item.name}
                        <div className="text-xs text-muted-foreground">{item.unit}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.storageLocation || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className={cn(
                            "h-8 w-24 ml-auto text-right font-mono",
                            hasVariance ? "border-amber-300 focus-visible:ring-amber-400" : ""
                          )}
                          placeholder={item.quantity.toString()}
                          value={counts[item.id] || ''}
                          onChange={(e) => handleCountChange(item.id, e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {variance !== null ? (
                          <Badge variant={variance === 0 ? "outline" : "secondary"} className={cn(
                            "font-mono w-16 justify-center",
                            variance > 0 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                            variance < 0 ? "bg-red-100 text-red-700 hover:bg-red-100" :
                            "text-muted-foreground"
                          )}>
                            {variance > 0 ? `+${variance}` : variance}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No items found in this category.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || itemsCounted === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Commit Adjustments
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}