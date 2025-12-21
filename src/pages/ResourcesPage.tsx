import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, Droplets, TrendingUp, Edit, Trash2, Loader2, Sun, Battery, Activity } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { ResourceLog } from '@shared/types';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { ResourceDialog } from '@/components/resources/ResourceDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
export function ResourcesPage() {
  const [logs, setLogs] = useState<ResourceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ResourceLog | null>(null);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api<{ items: ResourceLog[] }>('/api/resources');
      setLogs(response.items.sort((a, b) => b.date - a.date));
    } catch (error) {
      toast.error('Failed to load resource data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleSaveLog = async (data: Partial<ResourceLog>) => {
    try {
      if (selectedLog) {
        const updated = await api<ResourceLog>(`/api/resources/${selectedLog.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
        toast.success('Log updated');
      } else {
        const created = await api<ResourceLog>('/api/resources', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setLogs(prev => [created, ...prev]);
        toast.success('Log created');
      }
    } catch (error) {
      toast.error('Failed to save log');
    }
  };
  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete this log?')) return;
    try {
      await api(`/api/resources/${id}`, { method: 'DELETE' });
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Log deleted');
    } catch (error) {
      toast.error('Failed to delete log');
    }
  };
  const openDialog = (log?: ResourceLog) => {
    setSelectedLog(log || null);
    setIsDialogOpen(true);
  };
  // --- METRICS ---
  const metrics = useMemo(() => {
    const energyConsumed = logs
      .filter(l => l.type === 'energy' && l.flow === 'consumption')
      .reduce((acc, l) => acc + l.amount, 0);
    const energyProduced = logs
      .filter(l => l.type === 'energy' && l.flow === 'production')
      .reduce((acc, l) => acc + l.amount, 0);
    const waterConsumed = logs
      .filter(l => l.type === 'water' && l.flow === 'consumption')
      .reduce((acc, l) => acc + l.amount, 0);
    return {
      energyConsumed,
      energyProduced,
      netEnergy: energyProduced - energyConsumed,
      waterConsumed
    };
  }, [logs]);
  // --- CHART DATA ---
  const energyChartData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return days.map(day => {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = endOfDay(day).getTime();
      const dayLogs = logs.filter(l => l.type === 'energy' && l.date >= dayStart && l.date <= dayEnd);
      const consumption = dayLogs
        .filter(l => l.flow === 'consumption')
        .reduce((acc, l) => acc + l.amount, 0);
      const production = dayLogs
        .filter(l => l.flow === 'production')
        .reduce((acc, l) => acc + l.amount, 0);
      return {
        date: format(day, 'MMM d'),
        consumption,
        production
      };
    });
  }, [logs]);
  const energySourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    logs
      .filter(l => l.type === 'energy' && l.flow === 'consumption')
      .forEach(l => {
        sources[l.source] = (sources[l.source] || 0) + l.amount;
      });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [logs]);
  const waterSourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    logs
      .filter(l => l.type === 'water' && l.flow === 'consumption')
      .forEach(l => {
        sources[l.source] = (sources[l.source] || 0) + l.amount;
      });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [logs]);
  const waterTrendData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() }); // Last 14 days
    return days.map(day => {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = endOfDay(day).getTime();
      const amount = logs
        .filter(l => l.type === 'water' && l.flow === 'consumption' && l.date >= dayStart && l.date <= dayEnd)
        .reduce((acc, l) => acc + l.amount, 0);
      return {
        date: format(day, 'MMM d'),
        amount
      };
    });
  }, [logs]);
  return (
    <AppLayout
      title="Resources & Sustainability"
      actions={
        <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Log Usage
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Energy Consumed"
              value={`${metrics.energyConsumed.toFixed(1)} kWh`}
              icon={Zap}
              loading={isLoading}
              variant="yellow"
            />
            <StatCard
              title="Water Usage"
              value={`${metrics.waterConsumed.toLocaleString()} L`}
              icon={Droplets}
              loading={isLoading}
              variant="blue"
            />
            <StatCard
              title="Net Energy"
              value={`${metrics.netEnergy > 0 ? '+' : ''}${metrics.netEnergy.toFixed(1)} kWh`}
              icon={TrendingUp}
              loading={isLoading}
              variant={metrics.netEnergy >= 0 ? 'emerald' : 'amber'}
            />
          </div>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="energy">Energy</TabsTrigger>
              <TabsTrigger value="water">Water</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Energy Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Energy Trends (Last 7 Days)</CardTitle>
                    <CardDescription>Consumption vs Production</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={energyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="consumption" name="Consumption" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="production" name="Production" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                {/* Water Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Water Sources</CardTitle>
                    <CardDescription>Consumption by Source</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterSourceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                        <Tooltip />
                        <Bar dataKey="value" name="Liters" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              {/* Recent Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {logs.length === 0 ? (
                    <EmptyState
                      icon={Activity}
                      title="No recent activity"
                      description="Log your energy or water usage to see history here."
                      action={<Button onClick={() => openDialog()} variant="outline">Log Usage</Button>}
                    />
                  ) : (
                    <div className="space-y-4">
                      {logs.slice(0, 5).map(log => (
                        <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              log.type === 'energy' ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {log.type === 'energy' ? <Zap className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize">{log.source}</span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {log.flow}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(log.date, 'MMM d, yyyy')} • {log.notes || 'No notes'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "font-bold",
                              log.flow === 'production' ? "text-emerald-600" : "text-foreground"
                            )}>
                              {log.flow === 'production' ? '+' : ''}{log.amount} {log.unit}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDialog(log)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteLog(log.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="energy" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      Energy Sources
                    </CardTitle>
                    <CardDescription>Consumption breakdown by source</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {energySourceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={energySourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {energySourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No consumption data available.
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-emerald-500" />
                      Net Energy Flow
                    </CardTitle>
                    <CardDescription>Production vs Consumption over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={energyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="production" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="consumption" stackId="2" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="water" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Water Sources
                    </CardTitle>
                    <CardDescription>Where your water comes from</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {waterSourceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={waterSourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {waterSourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No water data available.
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Water Consumption</CardTitle>
                    <CardDescription>Last 14 days usage trend</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="amount" name="Liters" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      <ResourceDialog
        log={selectedLog}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveLog}
      />
    </AppLayout>
  );
}