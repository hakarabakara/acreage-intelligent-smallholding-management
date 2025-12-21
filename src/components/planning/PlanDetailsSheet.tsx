import React, { useState, useMemo, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Play, CheckCircle2, AlertCircle, DollarSign, Calculator, Link as LinkIcon } from 'lucide-react';
import type { BudgetPlan, BudgetItem, Task, TransactionCategory, Transaction, FarmSettings } from '@shared/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { TransactionLinkDialog } from './TransactionLinkDialog';
import { useFormatting } from '@/hooks/use-formatting';
interface PlanDetailsSheetProps {
  plan: BudgetPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<BudgetPlan>) => Promise<void>;
}
export function PlanDetailsSheet({ plan, isOpen, onClose, onUpdate }: PlanDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState('items');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // Data State
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const { formatCurrency } = useFormatting();
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    name: '',
    estimatedCost: 0,
    priority: 'medium',
    season: 'any',
    status: 'planned',
    categoryId: ''
  });
  const [fundSimulatorAmount, setFundSimulatorAmount] = useState<string>('');
  // Fetch auxiliary data when sheet opens
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [catRes, txRes, settingsRes] = await Promise.all([
            // Increased limit to 1000 to ensure all categories are loaded
            api<{ items: TransactionCategory[] }>('/api/transaction-categories?limit=1000'),
            // Increased limit to 1000 to ensure accurate actual cost calculation
            api<{ items: Transaction[] }>('/api/transactions?limit=1000'),
            // FIX: API returns FarmSettings object directly, not { items: [] }
            api<FarmSettings>('/api/settings/farm')
          ]);
          setCategories(catRes.items);
          setTransactions(txRes.items);
          setSettings(settingsRes);
        } catch (error) {
          console.error('Failed to load planning data', error);
          toast.error('Failed to load plan details');
        }
      };
      loadData();
    }
  }, [isOpen]);
  // Fund Simulator Logic
  const simulatedItems = useMemo(() => {
    const currentItems = plan?.items || [];
    if (!fundSimulatorAmount) return [];
    const limit = Number(fundSimulatorAmount);
    let currentTotal = 0;
    const sortedItems = [...currentItems].sort((a, b) => {
      const pMap = { high: 3, medium: 2, low: 1 };
      const pDiff = pMap[b.priority] - pMap[a.priority];
      if (pDiff !== 0) return pDiff;
      return a.estimatedCost - b.estimatedCost;
    });
    return sortedItems.map(item => {
      const fits = (currentTotal + item.estimatedCost) <= limit;
      if (fits) currentTotal += item.estimatedCost;
      return { ...item, fits };
    });
  }, [plan?.items, fundSimulatorAmount]);
  // Handlers
  const handleAddItem = async () => {
    if (!newItem.name || !plan) return;
    const item: BudgetItem = {
      id: crypto.randomUUID(),
      name: newItem.name,
      estimatedCost: Number(newItem.estimatedCost) || 0,
      priority: newItem.priority as any,
      season: newItem.season || 'any',
      status: 'planned',
      categoryId: newItem.categoryId,
      relatedTransactionIds: []
    };
    const updatedItems = [...plan.items, item];
    await onUpdate(plan.id, { items: updatedItems });
    setIsAddItemOpen(false);
    setNewItem({ name: '', estimatedCost: 0, priority: 'medium', season: 'any', status: 'planned', categoryId: '' });
    toast.success('Item added to plan');
  };
  const handleDeleteItem = async (itemId: string) => {
    if (!plan) return;
    const updatedItems = plan.items.filter(i => i.id !== itemId);
    await onUpdate(plan.id, { items: updatedItems });
    toast.success('Item removed');
  };
  const handleExecuteItem = async (item: BudgetItem) => {
    if (!plan) return;
    try {
      const task: Partial<Task> = {
        title: item.name,
        description: `Executed from plan: ${plan.name}`,
        priority: item.priority === 'high' ? 'high' : 'medium',
        status: 'todo',
        cost: item.estimatedCost,
        createdAt: Date.now()
      };
      const createdTask = await api<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(task)
      });
      const updatedItems = plan.items.map(i =>
        i.id === item.id ? { ...i, status: 'executed' as const, relatedTaskId: createdTask.id } : i
      );
      await onUpdate(plan.id, { items: updatedItems });
      toast.success('Task created from plan item');
    } catch (error) {
      toast.error('Failed to execute item');
    }
  };
  const openLinkDialog = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsLinkDialogOpen(true);
  };
  const handleLinkTransactions = async (selectedIds: string[]) => {
    if (!plan || !selectedItemId) return;
    const updatedItems = plan.items.map(i =>
      i.id === selectedItemId ? { ...i, relatedTransactionIds: selectedIds } : i
    );
    await onUpdate(plan.id, { items: updatedItems });
    toast.success('Transactions linked');
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };
  const getSeasonLabel = (seasonId: string) => {
    if (seasonId === 'any') return 'Any Season';
    const season = settings?.seasons?.find(s => s.id === seasonId);
    return season ? season.name : seasonId;
  };
  const getCategoryName = (catId?: string) => {
    if (!catId) return null;
    return categories.find(c => c.id === catId)?.name;
  };
  if (!plan) return null;
  const totalPlannedCost = plan.items.reduce((acc, item) => acc + item.estimatedCost, 0);
  const totalActualCost = plan.items.reduce((acc, item) => {
    if (!item.relatedTransactionIds) return acc;
    const itemActual = item.relatedTransactionIds.reduce((sum, txId) => {
      const tx = transactions.find(t => t.id === txId);
      return sum + (tx ? tx.amount : 0);
    }, 0);
    return acc + itemActual;
  }, 0);
  const budgetUtilization = Math.min(100, (totalPlannedCost / (plan.totalBudget || 1)) * 100);
  const remainingBudget = plan.totalBudget - totalPlannedCost;
  const selectedBudgetItem = plan.items.find(i => i.id === selectedItemId);
  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(
                "capitalize",
                plan.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-700 border-slate-200"
              )}>
                {plan.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(plan.startDate, 'MMM yyyy')} - {format(plan.endDate, 'MMM yyyy')}
              </span>
            </div>
            <SheetTitle className="text-2xl">{plan.name}</SheetTitle>
            <SheetDescription>
              Budget: {formatCurrency(plan.totalBudget)} • Planned: {formatCurrency(totalPlannedCost)}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget Utilization</span>
                <span className={cn("font-medium", remainingBudget < 0 ? "text-red-600" : "text-emerald-600")}>
                  {remainingBudget < 0 ? `Over by ${formatCurrency(Math.abs(remainingBudget))}` : `${formatCurrency(remainingBudget)} remaining`}
                </span>
              </div>
              <Progress value={budgetUtilization} className={cn("h-2", remainingBudget < 0 && "bg-red-100 [&>div]:bg-red-500")} />
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
              <span className="text-sm font-medium">Actual Spend</span>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", totalActualCost > totalPlannedCost ? "text-red-600" : "text-emerald-600")}>
                  {formatCurrency(totalActualCost)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({((totalActualCost / (totalPlannedCost || 1)) * 100).toFixed(0)}% of planned)
                </span>
              </div>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">Planned Items</TabsTrigger>
              <TabsTrigger value="simulator">Fund Simulator</TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Activities & Costs</h3>
                <Button size="sm" variant="outline" onClick={() => setIsAddItemOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-4 space-y-3">
                  {plan.items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No items planned yet.
                    </div>
                  )}
                  {plan.items.map((item) => {
                    const itemActualCost = (item.relatedTransactionIds || []).reduce((sum, txId) => {
                      const tx = transactions.find(t => t.id === txId);
                      return sum + (tx ? tx.amount : 0);
                    }, 0);
                    const categoryName = getCategoryName(item.categoryId);
                    return (
                      <div key={item.id} className="flex flex-col p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("font-medium truncate", item.status === 'executed' && "line-through text-muted-foreground")}>
                                {item.name}
                              </span>
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border", getPriorityColor(item.priority))}>
                                {item.priority}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 capitalize">
                                {getSeasonLabel(item.season)}
                              </Badge>
                              {categoryName && (
                                <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{categoryName}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatCurrency(item.estimatedCost)}</div>
                            <div className="text-xs text-muted-foreground">Est.</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-dashed">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => openLinkDialog(item.id)}
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              {item.relatedTransactionIds?.length ? 'Actuals Linked' : 'Link Actuals'}
                            </Button>
                            {itemActualCost > 0 && (
                              <span className={cn("text-xs font-medium", itemActualCost > item.estimatedCost ? "text-red-600" : "text-emerald-600")}>
                                {formatCurrency(itemActualCost)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {item.status === 'planned' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleExecuteItem(item)}
                                title="Execute (Create Task)"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-1.5" />
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="simulator" className="space-y-4 mt-4">
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-medium">
                    <Calculator className="h-4 w-4" />
                    Fund Availability Calculator
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                    Enter your available cash to see which high-priority items you can afford right now.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Available Funds..."
                        className="pl-9 bg-white dark:bg-black"
                        value={fundSimulatorAmount}
                        onChange={(e) => setFundSimulatorAmount(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {fundSimulatorAmount && (
                <ScrollArea className="h-[300px] border rounded-md">
                  <div className="p-4 space-y-2">
                    {simulatedItems.map((item) => (
                      <div key={item.id} className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        item.fits
                          ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                          : "bg-muted/30 opacity-60"
                      )}>
                        <div className="flex items-center gap-3">
                          {item.fits ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-muted-foreground flex gap-2">
                              <span className="capitalize">{item.priority} Priority</span>
                              <span>•</span>
                              <span>{formatCurrency(item.estimatedCost)}</span>
                            </div>
                          </div>
                        </div>
                        {item.fits && (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            Fits
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Planned Activity</DialogTitle>
            <DialogDescription>Add an item to your budget plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Activity Name</Label>
              <Input
                placeholder="e.g. Buy Seeds"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Est. Cost ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newItem.estimatedCost || ''}
                  onChange={(e) => setNewItem({...newItem, estimatedCost: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newItem.priority}
                  onValueChange={(v: any) => setNewItem({...newItem, priority: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Season</Label>
                <Select
                  value={newItem.season}
                  onValueChange={(v: any) => setNewItem({...newItem, season: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Season</SelectItem>
                    {settings?.seasons?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                    {/* Fallback defaults if no seasons defined */}
                    {(!settings?.seasons || settings.seasons.length === 0) && (
                      <>
                        <SelectItem value="spring">Spring</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="fall">Fall</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newItem.categoryId}
                  onValueChange={(v: any) => setNewItem({...newItem, categoryId: v})}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Manage categories in the Finances page.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={!newItem.name}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TransactionLinkDialog
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        onLink={handleLinkTransactions}
        transactions={transactions}
        initialSelectedIds={plan.items.find(i => i.id === selectedItemId)?.relatedTransactionIds}
        plan={plan}
        budgetItem={selectedBudgetItem}
      />
    </>
  );
}