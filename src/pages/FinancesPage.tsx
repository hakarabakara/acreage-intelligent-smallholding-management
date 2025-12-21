import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, TrendingUp, TrendingDown, Trash2, Loader2, Repeat, Globe, Banknote, Settings2, Calculator, Edit, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Transaction, TransactionCategory, BudgetPlan } from '@shared/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { format, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { useFormatting } from '@/hooks/use-formatting';
import { PrintButton } from '@/components/ui/print-button';
import { useFarmStore } from '@/lib/farm-store';
import { StatCard } from '@/components/ui/stat-card';
import { DEFAULT_CURRENCIES } from '@/lib/constants';
const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Category required'),
  date: z.string().min(1, 'Date required'),
  description: z.string().min(2, 'Description required'),
  isRecurrent: z.boolean().optional(),
  frequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  currency: z.string().optional(),
  exchangeRate: z.string().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), 'Must be a positive number').optional(),
  budgetPlanId: z.string().optional(),
  budgetItemId: z.string().optional(),
});
type TransactionFormValues = z.infer<typeof transactionSchema>;
const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
export function FinancesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  // Category Management State
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense' | 'both'>('expense');
  const { formatCurrency } = useFormatting();
  const settings = useFarmStore((state) => state.settings);
  const baseCurrency = settings?.currency || 'USD';
  const availableCurrencies = useMemo(() => {
    const custom = settings?.customCurrencies || [];
    return [...DEFAULT_CURRENCIES, ...custom];
  }, [settings?.customCurrencies]);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      type: 'expense',
      categoryId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      isRecurrent: false,
      frequency: 'monthly',
      currency: baseCurrency,
      exchangeRate: '1',
      budgetPlanId: '',
      budgetItemId: '',
    },
  });
  const isRecurrent = form.watch('isRecurrent');
  const selectedCurrency = form.watch('currency');
  const selectedType = form.watch('type');
  const selectedBudgetPlanId = form.watch('budgetPlanId');
  // Update default currency when settings load
  useEffect(() => {
    if (settings?.currency) {
      form.setValue('currency', settings.currency);
    }
  }, [settings, form]);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [txRes, catRes, plansRes] = await Promise.all([
        api<{ items: Transaction[] }>('/api/transactions?limit=1000'),
        api<{ items: TransactionCategory[] }>('/api/transaction-categories?limit=1000'),
        api<{ items: BudgetPlan[] }>('/api/budget-plans?limit=1000')
      ]);
      setTransactions(txRes.items.sort((a, b) => b.date - a.date));
      setCategories(catRes.items);
      setBudgetPlans(plansRes.items);
    } catch (error) {
      toast.error('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const onSubmit = async (data: TransactionFormValues) => {
    try {
      const category = categories.find(c => c.id === data.categoryId);
      await api('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          amount: Number(data.amount),
          category: category?.name || 'Unknown',
          date: new Date(data.date).getTime(),
          exchangeRate: Number(data.exchangeRate) || 1,
          nextDueDate: data.isRecurrent ? new Date(data.date).getTime() : undefined,
          budgetPlanId: data.budgetPlanId || undefined,
          budgetItemId: data.budgetItemId || undefined
        }),
      });
      toast.success('Transaction logged');
      setIsDialogOpen(false);
      form.reset({
        amount: '',
        type: 'expense',
        categoryId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        isRecurrent: false,
        frequency: 'monthly',
        currency: baseCurrency,
        exchangeRate: '1',
        budgetPlanId: '',
        budgetItemId: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to log transaction');
    }
  };
  const deleteTransaction = async (id: string) => {
    try {
      await api(`/api/transactions/${id}`, { method: 'DELETE' });
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Record deleted');
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };
  // Category Management Handlers
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      if (editingCategory) {
        const updated = await api<TransactionCategory>(`/api/transaction-categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: newCategoryName.trim(),
            type: newCategoryType
          })
        });
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Category updated');
        setEditingCategory(null);
      } else {
        const created = await api<TransactionCategory>('/api/transaction-categories', {
          method: 'POST',
          body: JSON.stringify({
            name: newCategoryName.trim(),
            type: newCategoryType
          })
        });
        setCategories(prev => [...prev, created]);
        toast.success('Category added');
      }
      setNewCategoryName('');
      setNewCategoryType('expense');
    } catch (error) {
      toast.error('Failed to save category');
    }
  };
  const handleEditCategory = (category: TransactionCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryType(category.type);
  };
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryType('expense');
  };
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api(`/api/transaction-categories/${id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category (System categories cannot be deleted)');
    }
  };
  // Analytics Calculations
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      const rate = t.exchangeRate || 1;
      const normalizedAmount = t.amount * rate;
      if (t.type === 'income') income += normalizedAmount;
      else expense += normalizedAmount;
    });
    return { income, expense, net: income - expense };
  }, [transactions]);
  const chartData = useMemo(() => {
    const months: Record<string, { name: string, income: number, expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'MMM yyyy');
      months[key] = { name: key, income: 0, expense: 0 };
    }
    transactions.forEach(t => {
      const key = format(t.date, 'MMM yyyy');
      if (months[key]) {
        const rate = t.exchangeRate || 1;
        const normalizedAmount = t.amount * rate;
        if (t.type === 'income') months[key].income += normalizedAmount;
        else months[key].expense += normalizedAmount;
      }
    });
    return Object.values(months);
  }, [transactions]);
  const expenseCategoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const rate = t.exchangeRate || 1;
      const normalizedAmount = t.amount * rate;
      const catName = t.category || categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
      catMap[catName] = (catMap[catName] || 0) + normalizedAmount;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);
  const filteredCategories = categories.filter(c =>
    c.type === 'both' || c.type === selectedType
  );
  // Budget Linking Logic
  const selectedPlan = budgetPlans.find(p => p.id === selectedBudgetPlanId);
  const budgetItems = selectedPlan ? selectedPlan.items : [];
  const handleBudgetItemChange = (itemId: string) => {
    form.setValue('budgetItemId', itemId);
    const item = budgetItems.find(i => i.id === itemId);
    if (item && item.categoryId) {
      form.setValue('categoryId', item.categoryId);
    }
  };
  return (
    <AppLayout
      title="Financial Ledger"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton />
          <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
            setIsCategoryDialogOpen(open);
            if (!open) handleCancelEdit();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings2 className="mr-2 h-4 w-4" /> Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogDescription>Add, edit, or remove transaction categories.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>{editingCategory ? 'Edit Name' : 'New Name'}</Label>
                    <Input
                      placeholder="Category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <div className="w-[120px] space-y-2">
                    <Label>Type</Label>
                    <Select value={newCategoryType} onValueChange={(v: any) => setNewCategoryType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1">
                    {editingCategory && (
                      <Button variant="ghost" size="icon" onClick={handleCancelEdit} title="Cancel Edit">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button onClick={handleSaveCategory} disabled={!newCategoryName.trim()}>
                      {editingCategory ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {categories.map(cat => (
                    <div key={cat.id} className={cn(
                      "flex items-center justify-between p-2 rounded border transition-colors",
                      editingCategory?.id === cat.id ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" : "bg-muted/50"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{cat.type}</Badge>
                        {cat.isSystem && <Badge variant="secondary" className="text-[10px]">System</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-500" onClick={() => handleEditCategory(cat)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        {!cat.isSystem && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Log Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log New Transaction</DialogTitle>
                <DialogDescription>
                  Record an income or expense to keep your financial ledger up to date.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('categoryId', '');
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">
                                {selectedCurrency || baseCurrency}
                              </span>
                              <Input type="number" step="0.01" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Sold 50 bushels of wheat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredCategories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Budget Allocation Section */}
                  <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      Budget Allocation (Optional)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budgetPlanId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Plan</FormLabel>
                            <Select onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('budgetItemId', '');
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {budgetPlans.map(plan => (
                                  <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="budgetItemId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Item</FormLabel>
                            <Select
                              onValueChange={handleBudgetItemChange}
                              value={field.value}
                              disabled={!selectedBudgetPlanId || selectedBudgetPlanId === 'none'}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {budgetItems.map(item => (
                                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {/* Currency Section */}
                  <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      Currency & Exchange
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCurrencies.map(c => (
                                  <SelectItem key={c.code} value={c.code}>
                                    {c.code} ({c.symbol})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {selectedCurrency !== baseCurrency && (
                        <FormField
                          control={form.control}
                          name="exchangeRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exchange Rate (to {baseCurrency})</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.0001" placeholder="1.0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                  {/* Recurrence Section */}
                  <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                    <FormField
                      control={form.control}
                      name="isRecurrent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-2">
                              <Repeat className="h-4 w-4 text-purple-600" />
                              Recurring Transaction
                            </FormLabel>
                            <FormDescription>
                              Automatically track this expense periodically.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {isRecurrent && (
                      <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      Save Record
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Income"
              value={formatCurrency(summary.income)}
              icon={TrendingUp}
              loading={isLoading}
              variant="emerald"
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(summary.expense)}
              icon={TrendingDown}
              loading={isLoading}
              variant="red"
            />
            <StatCard
              title="Net Profit"
              value={formatCurrency(summary.net)}
              icon={Banknote}
              loading={isLoading}
              variant={summary.net >= 0 ? 'blue' : 'amber'}
            />
          </div>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trends</CardTitle>
                <CardDescription>Income vs Expenses (Last 6 Months)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No transactions recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {t.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{t.description}</p>
                            {t.isRecurrent && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 flex items-center gap-1">
                                <Repeat className="h-3 w-3" /> {t.frequency}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="capitalize text-[10px] px-1 py-0 h-5">{t.category}</Badge>
                            <span>{format(t.date, 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={cn("font-bold block", t.type === 'income' ? "text-emerald-600" : "text-red-600")}>
                            {t.type === 'income' ? '+' : '-'}{t.currency !== baseCurrency ? `${t.amount} ${t.currency}` : formatCurrency(t.amount)}
                          </span>
                          {t.currency !== baseCurrency && (
                            <span className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(t.amount * (t.exchangeRate || 1))}
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => deleteTransaction(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}