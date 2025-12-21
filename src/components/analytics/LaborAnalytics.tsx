import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { Users, Clock, DollarSign, Briefcase } from 'lucide-react';
import type { Task, User, TaskCategory } from '@shared/types';
import { useFormatting } from '@/hooks/use-formatting';
import { StatCard } from '@/components/ui/stat-card';
import { format, subMonths } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
interface LaborAnalyticsProps {
  tasks: Task[];
  users: User[];
  categories: TaskCategory[];
}
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];
export function LaborAnalytics({ tasks, users, categories }: LaborAnalyticsProps) {
  const { formatCurrency } = useFormatting();
  const isMobile = useIsMobile();
  const metrics = useMemo(() => {
    let totalHours = 0;
    let totalLaborCost = 0;
    let completedTasks = 0;
    let activeTasks = 0;
    tasks.forEach(task => {
      const duration = task.duration || 0;
      const cost = (task.cost || 0) + (task.externalAssignments?.reduce((sum, a) => sum + a.cost, 0) || 0);
      totalHours += duration;
      totalLaborCost += cost;
      if (task.status === 'done') {
        completedTasks++;
      } else {
        activeTasks++;
      }
    });
    const avgCostPerHour = totalHours > 0 ? totalLaborCost / totalHours : 0;
    return {
      totalHours,
      totalLaborCost,
      avgCostPerHour,
      completedTasks,
      activeTasks
    };
  }, [tasks]);
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    tasks.forEach(task => {
      if (task.duration) {
        const catName = categories.find(c => c.id === task.categoryId)?.name || 'Uncategorized';
        data[catName] = (data[catName] || 0) + task.duration;
      }
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tasks, categories]);
  const userData = useMemo(() => {
    const data: Record<string, number> = {};
    tasks.forEach(task => {
      if (task.duration && task.assigneeId) {
        const userName = users.find(u => u.id === task.assigneeId)?.name || 'Unknown';
        data[userName] = (data[userName] || 0) + task.duration;
      }
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 users
  }, [tasks, users]);
  const costTrendData = useMemo(() => {
    const months: Record<string, { name: string; cost: number }> = {};
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'MMM yyyy');
      months[key] = { name: key, cost: 0 };
    }
    tasks.forEach(task => {
      const date = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
      const key = format(date, 'MMM yyyy');
      if (months[key]) {
        const cost = (task.cost || 0) + (task.externalAssignments?.reduce((sum, a) => sum + a.cost, 0) || 0);
        months[key].cost += cost;
      }
    });
    return Object.values(months);
  }, [tasks]);
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Labor Hours"
          value={metrics.totalHours.toFixed(1)}
          icon={Clock}
          description="Tracked duration across all tasks"
          variant="blue"
        />
        <StatCard
          title="Total Labor Cost"
          value={formatCurrency(metrics.totalLaborCost)}
          icon={DollarSign}
          description="Internal & External costs"
          variant="emerald"
        />
        <StatCard
          title="Avg Cost / Hour"
          value={formatCurrency(metrics.avgCostPerHour)}
          icon={Briefcase}
          description="Efficiency metric"
          variant="amber"
        />
        <StatCard
          title="Active Workforce"
          value={users.filter(u => u.status === 'active').length}
          icon={Users}
          description="Active team members"
          variant="purple"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Hours by Category</CardTitle>
            <CardDescription>Distribution of labor across farm operations</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] md:h-[400px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 80 : 100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)} hrs`} />
                  <Legend 
                    layout={isMobile ? 'horizontal' : 'vertical'} 
                    align={isMobile ? 'center' : 'right'} 
                    verticalAlign={isMobile ? 'bottom' : 'middle'}
                    wrapperStyle={isMobile ? { fontSize: '12px' } : {}}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No duration data available.
              </div>
            )}
          </CardContent>
        </Card>
        {/* Workforce Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Workforce Activity</CardTitle>
            <CardDescription>Total hours logged by team member</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] md:h-[400px]">
            {userData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userData} layout="vertical" margin={{ left: isMobile ? 0 : 20, right: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    width={isMobile ? 80 : 100} 
                  />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)} hrs`} />
                  <Bar dataKey="value" name="Hours" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No user activity data available.
              </div>
            )}
          </CardContent>
        </Card>
        {/* Labor Cost Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Labor Cost Trends</CardTitle>
            <CardDescription>Monthly labor expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costTrendData} margin={{ left: isMobile ? -20 : 0, right: 10 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="cost" stroke="#10B981" fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}