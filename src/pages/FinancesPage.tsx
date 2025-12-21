import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, TrendingUp, TrendingDown, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Transaction } from '@shared/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { useFormatting } from '@/hooks/use-formatting';
import { PrintButton } from '@/components/ui/print-button';
const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category required'),
  date: z.string().min(1, 'Date required'),
  description: z.string().min(2, 'Description required'),
});
type TransactionFormValues = z.infer<typeof transactionSchema>;
const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
export function FinancesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { formatCurrency } = useFormatting();
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      type: 'expense',
      category: 'other',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    },
  });
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await api<{ items: Transaction[] }>('/api/transactions');
      // Sort by date descending
      setTransactions(response.items.sort((a, b) => b.date - a.date));
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchTransactions();
  }, []);
  const onSubmit = async (data: TransactionFormValues) => {
    try {
      await api('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          amount: Number(data.amount),
          date: new Date(data.date).getTime(),
        }),
      });
      toast.success('Transaction logged');
      setIsDialogOpen(false);
      form.reset();
      fetchTransactions();
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
  // Analytics Calculations
  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);
  const chartData = useMemo(() => {
    // Group by month (last 6 months)
    const months: Record<string, { name: string, income: number, expense: number }> = {};
    // Initialize last 6 months safely
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'MMM yyyy');
      months[key] = { name: key, income: 0, expense: 0 };
    }
    transactions.forEach(t => {
      const key = format(t.date, 'MMM yyyy');
      if (months[key]) {
        if (t.type === 'income') months[key].income += t.amount;
        else months[key].expense += t.amount;
      }
    });
    return Object.values(months);
  }, [transactions]);
  const expenseCategoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions]);
  return (
    <AppLayout
      title="Financial Ledger"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Log Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Input type="number" step="0.01" {...field} />
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
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="feed">Feed</SelectItem>
                              <SelectItem value="seed">Seed</SelectItem>
                              <SelectItem value="labor">Labor</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
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
            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Income</p>
                    <h3 className="text-2xl font-bold mt-2 text-emerald-900 dark:text-emerald-100">
                      {formatCurrency(summary.income)}
                    </h3>
                  </div>
                  <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Expenses</p>
                    <h3 className="text-2xl font-bold mt-2 text-red-900 dark:text-red-100">
                      {formatCurrency(summary.expense)}
                    </h3>
                  </div>
                  <div className="h-10 w-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cn(
              "border-opacity-50",
              summary.net >= 0 
                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900" 
                : "bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn("text-sm font-medium", summary.net >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400")}>
                      Net Profit
                    </p>
                    <h3 className={cn("text-2xl font-bold mt-2", summary.net >= 0 ? "text-blue-900 dark:text-blue-100" : "text-orange-900 dark:text-orange-100")}>
                      {formatCurrency(summary.net)}
                    </h3>
                  </div>
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", summary.net >= 0 ? "bg-blue-100 dark:bg-blue-900" : "bg-orange-100 dark:bg-orange-900")}>
                    <DollarSign className={cn("h-5 w-5", summary.net >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trends</CardTitle>
                <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
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
                          <p className="font-medium">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="capitalize text-[10px] px-1 py-0 h-5">{t.category}</Badge>
                            <span>{format(t.date, 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("font-bold", t.type === 'income' ? "text-emerald-600" : "text-red-600")}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
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