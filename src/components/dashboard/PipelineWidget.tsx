import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import type { Crop, Task, Order } from '@shared/types';
import { Sprout, ClipboardList, ShoppingCart, ArrowRight, Loader2, Workflow } from 'lucide-react';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { useFormatting } from '@/hooks/use-formatting';
import { Link } from 'react-router-dom';
export function PipelineWidget() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    harvestsDue: 0,
    activeTasks: 0,
    urgentTasks: 0,
    pendingOrders: 0,
    pendingValue: 0
  });
  const { formatCurrency } = useFormatting();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cropsRes, tasksRes, ordersRes] = await Promise.all([
          api<{ items: Crop[] }>('/api/crops'),
          api<{ items: Task[] }>('/api/tasks'),
          api<{ items: Order[] }>('/api/orders')
        ]);
        const now = Date.now();
        const next14Days = addDays(now, 14).getTime();
        const upcomingHarvests = cropsRes.items.filter(c =>
          c.status === 'growing' &&
          c.estimatedHarvestDate &&
          isAfter(c.estimatedHarvestDate, now) &&
          isBefore(c.estimatedHarvestDate, next14Days)
        );
        const activeTasks = tasksRes.items.filter(t => t.status !== 'done');
        const urgentTasks = activeTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
        const pendingOrders = ordersRes.items.filter(o => o.status === 'pending' || o.status === 'confirmed');
        const pendingValue = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        setMetrics({
          harvestsDue: upcomingHarvests.length,
          activeTasks: activeTasks.length,
          urgentTasks: urgentTasks.length,
          pendingOrders: pendingOrders.length,
          pendingValue
        });
      } catch (error) {
        console.error('Failed to load pipeline data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-4 border-b bg-muted/10">
        <CardTitle className="text-base flex items-center gap-2">
          <Workflow className="h-4 w-4 text-emerald-600" />
          Operational Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="relative p-6">
          {/* Vertical Line */}
          <div className="absolute left-9 top-8 bottom-8 w-px bg-border" />
          <div className="space-y-8">
            {/* Production */}
            <Link to="/crops" className="relative flex items-start gap-4 group">
              <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-background dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                <Sprout className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 -mt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium group-hover:text-emerald-600 transition-colors">Production</h4>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{metrics.harvestsDue}</span> harvests due soon
                </p>
              </div>
            </Link>
            {/* Operations */}
            <Link to="/tasks" className="relative flex items-start gap-4 group">
              <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-4 ring-background dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <ClipboardList className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 -mt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium group-hover:text-blue-600 transition-colors">Operations</h4>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{metrics.activeTasks}</span> active tasks
                  {metrics.urgentTasks > 0 && (
                    <span className="text-red-500 ml-1">({metrics.urgentTasks} urgent)</span>
                  )}
                </p>
              </div>
            </Link>
            {/* Sales */}
            <Link to="/sales" className="relative flex items-start gap-4 group">
              <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 ring-4 ring-background dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                <ShoppingCart className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 -mt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium group-hover:text-purple-600 transition-colors">Sales</h4>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{metrics.pendingOrders}</span> pending
                  <span className="ml-1 text-muted-foreground">({formatCurrency(metrics.pendingValue)})</span>
                </p>
              </div>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}