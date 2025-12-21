import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, Users, Sprout, Map as MapIcon, Workflow, FileText } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Crop, Task, Transaction, Field, User, HarvestLog, ComplianceLog, InventoryItem, InventoryCategory, Order } from '@shared/types';
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
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { useFormatting } from '@/hooks/use-formatting';
import { PrintButton } from '@/components/ui/print-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReportGenerator } from '@/components/analytics/ReportGenerator';
import { StatCard } from '@/components/ui/stat-card';
import { PipelineVisualizer } from '@/components/analytics/PipelineVisualizer';
import { LaborAnalytics } from '@/components/analytics/LaborAnalytics';
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
export function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [harvests, setHarvests] = useState<HarvestLog[]>([]);
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [taskCategories, setTaskCategories] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('6m'); // 6m, 1y, all
  const { formatCurrency } = useFormatting();
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [cropsRes, tasksRes, transRes, fieldsRes, usersRes, harvestsRes, complianceRes, invRes, catRes, ordersRes, taskCatsRes] = await Promise.all([
          api<{ items: Crop[] }>('/api/crops'),
          api<{ items: Task[] }>('/api/tasks'),
          api<{ items: Transaction[] }>('/api/transactions'),
          api<{ items: Field[] }>('/api/fields'),
          api<{ items: User[] }>('/api/users'),
          api<{ items: HarvestLog[] }>('/api/harvests'),
          api<{ items: ComplianceLog[] }>('/api/compliance'),
          api<{ items: InventoryItem[] }>('/api/inventory'),
          api<{ items: InventoryCategory[] }>('/api/inventory-categories'),
          api<{ items: Order[] }>('/api/orders?limit=1000'),
          api<{ items: any[] }>('/api/task-categories'),
        ]);
        setCrops(cropsRes.items);
        setTasks(tasksRes.items);
        setTransactions(transRes.items);
        setFields(fieldsRes.items);
        setUsers(usersRes.items);
        setHarvests(harvestsRes.items);
        setComplianceLogs(complianceRes.items);
        setInventory(invRes.items);
        setCategories(catRes.items);
        setOrders(ordersRes.items);
        setTaskCategories(taskCatsRes.items);
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
  // 2. Financial Trends (Monthly Income vs Expense)
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
  // 3. Yield Efficiency (Actual vs Expected)
  const yieldEfficiencyData = useMemo(() => {
    const cropYields: Record<string, { expected: number; actual: number }> = {};
    // Map harvests to crops
    harvests.forEach(h => {
      const crop = crops.find(c => c.id === h.cropId);
      if (crop) {
        const key = crop.name; // Group by crop name (e.g., "Tomato")
        if (!cropYields[key]) {
          cropYields[key] = { expected: 0, actual: 0 };
        }
        cropYields[key].actual += h.amount;
      }
    });
    // Add expected yields from crops that have been harvested or are active
    crops.forEach(c => {
      if (c.expectedYield) {
        const key = c.name;
        if (!cropYields[key]) {
           cropYields[key] = { expected: 0, actual: 0 };
        }
        cropYields[key].expected += c.expectedYield;
      }
    });
    return Object.entries(cropYields)
      .map(([name, data]) => ({ name, ...data }))
      .filter(d => d.expected > 0 || d.actual > 0)
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 6); // Top 6
  }, [crops, harvests]);
  // 4. Crop Profitability
  const profitabilityData = useMemo(() => {
    return crops.map(crop => {
      // Revenue: Sum of income transactions linked to this crop
      const revenue = transactions
        .filter(t => t.relatedEntityId === crop.id && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      // Expenses: Sum of expense transactions linked to this crop
      const expenses = transactions
        .filter(t => t.relatedEntityId === crop.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      // Operational Cost: Sum of tasks linked to this crop (Labor + Materials)
      const operationalCost = tasks
        .filter(t => t.relatedEntityId === crop.id)
        .reduce((sum, t) => {
          const labor = (t.cost || 0) + (t.externalAssignments?.reduce((s, a) => s + a.cost, 0) || 0);
          const materials = t.materials?.reduce((s, m) => s + (m.cost || 0), 0) || 0;
          return sum + labor + materials;
        }, 0);
      const totalCost = expenses + operationalCost + (crop.cost || 0); // Include initial crop cost (seeds/plants)
      const netProfit = revenue - totalCost;
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
      const yieldAmount = harvests
        .filter(h => h.cropId === crop.id)
        .reduce((sum, h) => sum + h.amount, 0);
      return {
        id: crop.id,
        name: crop.name,
        variety: crop.variety,
        revenue,
        totalCost,
        netProfit,
        roi,
        yieldAmount,
        yieldUnit: crop.yieldUnit || 'units'
      };
    }).filter(d => d.revenue > 0 || d.totalCost > 0) // Only show crops with financial activity
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [crops, transactions, tasks, harvests]);
  // 5. Inventory Value by Category
  const inventoryValueData = useMemo(() => {
    const values: Record<string, number> = {};
    inventory.forEach(item => {
      const catName = categories.find(c => c.id === item.categoryId)?.name || item.category || 'Uncategorized';
      const value = item.quantity * (item.unitCost || 0);
      values[catName] = (values[catName] || 0) + value;
    });
    return Object.entries(values)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [inventory, categories]);
  // Metric Values
  const totalActiveAcres = fields.filter(f => f.status === 'active').reduce((acc, f) => acc + f.acres, 0).toFixed(1);
  const activeAcresPercent = fields.length > 0 ? ((fields.filter(f => f.status === 'active').length / fields.length) * 100).toFixed(0) : 0;
  const activeCropsCount = crops.filter(c => c.status !== 'harvested').length;
  const activeCropsFields = new Set(crops.map(c => c.fieldId)).size;
  const taskCompletionRate = tasks.length > 0
    ? ((tasks.filter(t => t.status === 'done').length / tasks.length) * 100).toFixed(0)
    : 0;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const netProfit = financialTrendData.reduce((acc, m) => acc + (m.income - m.expense), 0);
  const avgMonthlyProfit = financialTrendData.reduce((acc, m) => acc + (m.income - m.expense), 0) / 6;
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
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex justify-between items-center no-print">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pipeline" className="flex items-center gap-2">
                <Workflow className="h-4 w-4" /> Pipeline
              </TabsTrigger>
              <TabsTrigger value="labor" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Labor
              </TabsTrigger>
              <TabsTrigger value="profitability">Crop Profitability</TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Reports
              </TabsTrigger>
            </TabsList>
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
          <TabsContent value="overview" className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Active Acres"
                value={totalActiveAcres}
                icon={MapIcon}
                description={`${activeAcresPercent}% of total land`}
                loading={isLoading}
                variant="emerald"
              />
              <StatCard
                title="Active Crops"
                value={activeCropsCount}
                icon={Sprout}
                description={`Across ${activeCropsFields} fields`}
                loading={isLoading}
                variant="emerald"
              />
              <StatCard
                title="Task Completion"
                value={`${taskCompletionRate}%`}
                icon={Users}
                description={`${completedTasksCount} tasks completed`}
                loading={isLoading}
                variant="blue"
              />
              <StatCard
                title="Net Profit (6m)"
                value={formatCurrency(netProfit)}
                icon={TrendingUp}
                description={`Avg ${formatCurrency(avgMonthlyProfit)} / month`}
                loading={isLoading}
                variant="emerald"
              />
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
                  <CardTitle>Yield Efficiency</CardTitle>
                  <CardDescription>Expected vs Actual Harvest (Top Crops)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yieldEfficiencyData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="expected" name="Expected" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={20} />
                      <Bar dataKey="actual" name="Actual" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Inventory Valuation</CardTitle>
                  <CardDescription>Asset Value by Category</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {inventoryValueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryValueData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {inventoryValueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No inventory data with cost available.
                    </div>
                  )}
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
          </TabsContent>
          <TabsContent value="pipeline">
            <PipelineVisualizer
              inventory={inventory}
              crops={crops}
              orders={orders}
              categories={categories}
            />
          </TabsContent>
          <TabsContent value="labor">
            <LaborAnalytics
              tasks={tasks}
              users={users}
              categories={taskCategories}
            />
          </TabsContent>
          <TabsContent value="profitability" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Profitability Analysis</CardTitle>
                  <CardDescription>Net Profit vs Total Cost by Crop</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitabilityData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="netProfit" name="Net Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalCost" name="Total Cost" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers (ROI)</CardTitle>
                  <CardDescription>Highest Return on Investment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profitabilityData.slice(0, 5).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-700" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-50 text-slate-600"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.variety}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">{item.roi.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">ROI</div>
                        </div>
                      </div>
                    ))}
                    {profitabilityData.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No financial data available for crops yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Detailed Crop Financials</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Crop</TableHead>
                      <TableHead>Yield</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Net Profit</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitabilityData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.variety}</div>
                        </TableCell>
                        <TableCell>
                          {item.yieldAmount > 0 ? `${item.yieldAmount} ${item.yieldUnit}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                        <TableCell className={cn("text-right font-medium", item.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {formatCurrency(item.netProfit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.roi > 0 ? "outline" : "secondary"} className={cn(
                            item.roi > 50 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            item.roi > 0 ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {item.roi.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {profitabilityData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No data available. Link transactions and tasks to crops to see profitability.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports">
            <ReportGenerator
              harvests={harvests}
              transactions={transactions}
              complianceLogs={complianceLogs}
              tasks={tasks}
              users={users}
              crops={crops}
            />
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
}