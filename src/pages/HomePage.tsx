import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WeatherWidget } from '@/components/ui/weather-widget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sprout, Tractor, AlertCircle, CheckCircle2, TrendingUp, Calendar, Layout, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { Task, Field, Transaction } from '@shared/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScratchpadWidget } from '@/components/dashboard/ScratchpadWidget';
import { useFarmStore } from '@/lib/farm-store';
import { useFormatting } from '@/hooks/use-formatting';
interface DashboardSections {
  weather: boolean;
  stats: boolean;
  tasks: boolean;
  actions: boolean;
  tips: boolean;
  scratchpad: boolean;
}
const DEFAULT_SECTIONS: DashboardSections = {
  weather: true,
  stats: true,
  tasks: true,
  actions: true,
  tips: true,
  scratchpad: true,
};
export function HomePage() {
  const [stats, setStats] = useState({
    activeFields: 0,
    pendingTasks: 0,
    urgentTasks: 0,
    totalRevenue: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Farm Settings & Formatting
  const settings = useFarmStore((state) => state.settings);
  const { formatCurrency } = useFormatting();
  // Personalization State
  const [visibleSections, setVisibleSections] = useState<DashboardSections>(() => {
    const saved = localStorage.getItem('dashboard_sections');
    return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
  });
  useEffect(() => {
    localStorage.setItem('dashboard_sections', JSON.stringify(visibleSections));
  }, [visibleSections]);
  const toggleSection = (section: keyof DashboardSections) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [fieldsRes, tasksRes, transactionsRes] = await Promise.all([
          api<{ items: Field[] }>('/api/fields'),
          api<{ items: Task[] }>('/api/tasks'),
          api<{ items: Transaction[] }>('/api/transactions')
        ]);
        const activeFields = fieldsRes.items.filter(f => f.status === 'active').length;
        const pendingTasks = tasksRes.items.filter(t => t.status !== 'done');
        const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
        // Calculate total income (revenue)
        const totalRevenue = transactionsRes.items
          .filter(t => t.type === 'income')
          .reduce((acc, t) => acc + t.amount, 0);
        setStats({
          activeFields,
          pendingTasks: pendingTasks.length,
          urgentTasks,
          totalRevenue
        });
        setRecentTasks(pendingTasks.slice(0, 4)); // Top 4 pending
      } catch (error) {
        console.error('Dashboard load failed', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);
  const dashboardTitle = settings?.name ? `${settings.name} Mission Control` : 'Mission Control';
  return (
    <AppLayout
      title={dashboardTitle}
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Layout className="mr-2 h-4 w-4" /> Customize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Dashboard Widgets</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={visibleSections.weather} onCheckedChange={() => toggleSection('weather')}>
              Weather Widget
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={visibleSections.stats} onCheckedChange={() => toggleSection('stats')}>
              Key Statistics
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={visibleSections.tasks} onCheckedChange={() => toggleSection('tasks')}>
              Priority Tasks
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={visibleSections.actions} onCheckedChange={() => toggleSection('actions')}>
              Quick Actions
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={visibleSections.scratchpad} onCheckedChange={() => toggleSection('scratchpad')}>
              Scratchpad
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={visibleSections.tips} onCheckedChange={() => toggleSection('tips')}>
              Seasonal Tips
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <div className="space-y-8">
        {/* Top Section: Weather & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {visibleSections.weather && (
            <div className="lg:col-span-1 animate-in fade-in zoom-in-95 duration-300">
              <WeatherWidget className="h-full" />
            </div>
          )}
          {visibleSections.stats && (
            <div className={visibleSections.weather ? "lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300" : "lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-300"}>
              <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active Fields</p>
                    <h3 className="text-3xl font-bold mt-2 text-emerald-900 dark:text-emerald-100">
                      {isLoading ? <Skeleton className="h-8 w-12" /> : stats.activeFields}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                    <Sprout className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Urgent Tasks</p>
                    <h3 className="text-3xl font-bold mt-2 text-amber-900 dark:text-amber-100">
                      {isLoading ? <Skeleton className="h-8 w-12" /> : stats.urgentTasks}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Pending Jobs</p>
                    <h3 className="text-3xl font-bold mt-2 text-blue-900 dark:text-blue-100">
                      {isLoading ? <Skeleton className="h-8 w-12" /> : stats.pendingTasks}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Tractor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Revenue</p>
                    <h3 className="text-3xl font-bold mt-2 text-purple-900 dark:text-purple-100 truncate" title={formatCurrency(stats.totalRevenue)}>
                      {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(stats.totalRevenue)}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Urgent Tasks List */}
          {visibleSections.tasks && (
            <div className={visibleSections.actions || visibleSections.tips || visibleSections.scratchpad ? "lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" : "lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Priority Tasks</h2>
                <Button variant="ghost" className="text-sm text-muted-foreground hover:text-primary" asChild>
                  <Link to="/tasks">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))
                ) : recentTasks.length === 0 ? (
                  <div className="text-center py-8 border rounded-xl border-dashed">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No urgent tasks pending.</p>
                  </div>
                ) : (
                  recentTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className={`h-3 w-3 rounded-full ${task.priority === 'urgent' || task.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.dueDate ? `Due ${format(task.dueDate, 'MMM d')}` : 'No due date'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/tasks">Details</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* Right Column: Quick Actions, Scratchpad, Tips */}
          {(visibleSections.actions || visibleSections.tips || visibleSections.scratchpad) && (
            <div className={visibleSections.tasks ? "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100" : "lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"}>
              {visibleSections.actions && (
                <>
                  <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link to="/calendar"><Calendar className="mr-2 h-4 w-4" /> View Schedule</Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link to="/fields"><Sprout className="mr-2 h-4 w-4" /> Update Crop Status</Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link to="/tasks"><CheckCircle2 className="mr-2 h-4 w-4" /> Log Completed Work</Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link to="/inventory"><Tractor className="mr-2 h-4 w-4" /> Record Equipment Usage</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
              {visibleSections.scratchpad && (
                <div className="h-[200px]">
                  <ScratchpadWidget />
                </div>
              )}
              {visibleSections.tips && (
                <Card className="bg-neutral-900 text-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20" />
                  <CardHeader>
                    <CardTitle className="text-lg">Seasonal Tip</CardTitle>
                    <CardDescription className="text-neutral-400">Spring Preparation</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-sm text-neutral-300">
                      Soil temperatures are rising. It's a good time to schedule soil sampling for the North Pasture before seeding begins next month.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}