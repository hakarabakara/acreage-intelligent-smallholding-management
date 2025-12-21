import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, Users, Sprout, Map as MapIcon } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Crop, Task, Transaction, Field, User } from '@shared/types';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useFormatting } from '@/hooks/use-formatting';
import { PrintButton } from '@/components/ui/print-button';
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
export function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timeRange, setTimeRange] = useState('6m'); // 6m, 1y, all
  const { formatCurrency } = useFormatting();
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [cropsRes, tasksRes, transRes, fieldsRes, usersRes] = await Promise.all([
          api<{ items: Crop[] }>('/api/crops'),
          api<{ items: Task[] }>('/api/tasks'),
          api<{ items: Transaction[] }>('/api/transactions'),
          api<{ items: Field[] }>('/api/fields'),
          api<{ items: User[] }>('/api/users'),
        ]);
        setCrops(cropsRes.items);
        setTasks(tasksRes.items);
        setTransactions(transRes.items);
        setFields(fieldsRes.items);
        setUsers(usersRes.items);
      } catch (error) {
        toast.error('Failed to load analytics data');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  // --- METRICS CALCULATIONS ---
  // 1. Field Utilization
  const fieldUtilizationData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    fields.forEach(f => {
      statusCounts[f.status] = (statusCounts[f.status] || 0) + f.acres;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [fields]);
  // 2. Labor Distribution (Tasks by Assignee)
  const laborData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const assigneeName = users.find(u => u.id === t.assigneeId)?.name || 'Unassigned';
      counts[assigneeName] = (counts[assigneeName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [tasks, users]);
  // 3. Financial Trends (Monthly Income vs Expense)
  const financialTrendData = useMemo(() => {
    const months: Record<string, { name: string; income: number; expense: number }> = {};
    // Initialize last 6 months
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
  // 4. Crop Distribution (Count by Variety/Name)
  const cropDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    crops.forEach(c => {
      counts[c.name] = (counts[c.name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [crops]);
  return (
    <AppLayout 
      title="Reports & Analytics"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Controls */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Farm Insights</h2>
              <p className="text-muted-foreground">Performance metrics across all operations.</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Active Acres</CardTitle>
                <MapIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fields.filter(f => f.status === 'active').reduce((acc, f) => acc + f.acres, 0).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((fields.filter(f => f.status === 'active').length / fields.length) * 100).toFixed(0)}% of total land
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Crops</CardTitle>
                <Sprout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crops.filter(c => c.status !== 'harvested').length}</div>
                <p className="text-xs text-muted-foreground">
                  Across {new Set(crops.map(c => c.fieldId)).size} fields
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.length > 0 
                    ? ((tasks.filter(t => t.status === 'done').length / tasks.length) * 100).toFixed(0) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {tasks.filter(t => t.status === 'done').length} tasks completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit (6m)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(financialTrendData.reduce((acc, m) => acc + (m.income - m.expense), 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg {formatCurrency(financialTrendData.reduce((acc, m) => acc + (m.income - m.expense), 0) / 6)} / month
                </p>
              </CardContent>
            </Card>
          </div>
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Financial Performance</CardTitle>
                <CardDescription>Income vs Expenses (Last 6 Months)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Field Utilization</CardTitle>
                <CardDescription>Acres by Status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fieldUtilizationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {fieldUtilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} acres`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Workforce Distribution</CardTitle>
                <CardDescription>Tasks Assigned by Person</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={laborData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" name="Tasks" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Crop Diversity</CardTitle>
                <CardDescription>Most Planted Crops</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cropDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {cropDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
}