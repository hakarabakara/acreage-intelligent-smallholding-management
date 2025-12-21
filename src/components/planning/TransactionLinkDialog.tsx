import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, DollarSign, Calendar, Sparkles } from 'lucide-react';
import type { Transaction, BudgetPlan, BudgetItem } from '@shared/types';
import { format } from 'date-fns';
import { useFormatting } from '@/hooks/use-formatting';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
interface TransactionLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (selectedIds: string[]) => void;
  transactions: Transaction[];
  initialSelectedIds?: string[];
  plan?: BudgetPlan | null;
  budgetItem?: BudgetItem | null;
}
export function TransactionLinkDialog({
  isOpen,
  onClose,
  onLink,
  transactions,
  initialSelectedIds = [],
  plan,
  budgetItem
}: TransactionLinkDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { formatCurrency } = useFormatting();
  const suggestedTransactions = useMemo(() => {
    if (!plan || !budgetItem) return [];
    return transactions.filter(t => {
      // Check if category matches (if budget item has a category)
      const categoryMatch = budgetItem.categoryId ? t.categoryId === budgetItem.categoryId : true;
      // Check if date is within plan range
      const dateMatch = t.date >= plan.startDate && t.date <= plan.endDate;
      return categoryMatch && dateMatch;
    }).sort((a, b) => b.date - a.date);
  }, [transactions, plan, budgetItem]);
  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
      // Default to suggestions if available
      if (suggestedTransactions.length > 0) {
        setActiveTab('suggested');
      } else {
        setActiveTab('all');
      }
    }
  }, [isOpen, initialSelectedIds, suggestedTransactions.length]);
  const filteredTransactions = useMemo(() => {
    const source = activeTab === 'suggested' ? suggestedTransactions : transactions;
    return source.filter(t =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.date - a.date);
  }, [transactions, suggestedTransactions, searchQuery, activeTab]);
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  const handleSave = () => {
    onLink(selectedIds);
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Actual Transactions</DialogTitle>
          <DialogDescription>
            Select transactions to track against this budget item.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="suggested" className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Suggested
              {suggestedTransactions.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 h-4 text-[10px]">
                  {suggestedTransactions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
          </TabsList>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[300px] pr-4 -mr-4 border rounded-md p-2">
            <div className="space-y-2">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {activeTab === 'suggested'
                    ? "No suggestions found based on category and date."
                    : "No transactions found."}
                </div>
              ) : (
                filteredTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedIds.includes(tx.id)
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => toggleSelection(tx.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(tx.id)}
                      onCheckedChange={() => toggleSelection(tx.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{tx.description}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(tx.date, 'MMM d, yyyy')}
                        </span>
                        <span className="capitalize px-1.5 py-0.5 bg-muted rounded text-[10px]">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "font-medium text-sm whitespace-nowrap",
                      tx.type === 'income' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>
        <DialogFooter className="mt-4">
          <div className="flex-1 flex items-center text-sm text-muted-foreground">
            {selectedIds.length} selected
          </div>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Link Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}