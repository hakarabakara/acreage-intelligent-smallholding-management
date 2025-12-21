import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Sprout, CheckCircle2, ShoppingCart, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { HarvestLog, Task, Order, ComplianceLog } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
interface ActivityItem {
  id: string;
  type: 'harvest' | 'task' | 'order' | 'compliance';
  title: string;
  description: string;
  timestamp: number;
  link: string;
}
export function ActivityFeedWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const [harvestsRes, tasksRes, ordersRes, complianceRes] = await Promise.all([
          api<{ items: HarvestLog[] }>('/api/harvests?limit=10'),
          api<{ items: Task[] }>('/api/tasks?limit=20'),
          api<{ items: Order[] }>('/api/orders?limit=10'),
          api<{ items: ComplianceLog[] }>('/api/compliance?limit=10'),
        ]);
        const items: ActivityItem[] = [];
        // Harvests
        harvestsRes.items.forEach(h => {
          items.push({
            id: `harvest-${h.id}`,
            type: 'harvest',
            title: 'Harvest Logged',
            description: `${h.amount} ${h.unit} harvested`,
            timestamp: h.date,
            link: `/crops?cropId=${h.cropId}`
          });
        });
        // Tasks (Completed or Created recently)
        tasksRes.items.forEach(t => {
          // Use createdAt for "New Task" or maybe we can infer completion if we had completedAt.
          // For now, let's show created tasks as activity.
          items.push({
            id: `task-${t.id}`,
            type: 'task',
            title: t.status === 'done' ? 'Task Completed' : 'New Task',
            description: t.title,
            timestamp: t.createdAt,
            link: `/tasks?taskId=${t.id}`
          });
        });
        // Orders
        ordersRes.items.forEach(o => {
          items.push({
            id: `order-${o.id}`,
            type: 'order',
            title: 'New Order',
            description: `${o.totalAmount.toFixed(2)} - ${o.status}`,
            timestamp: o.date,
            link: '/sales'
          });
        });
        // Compliance
        complianceRes.items.forEach(c => {
          items.push({
            id: `comp-${c.id}`,
            type: 'compliance',
            title: 'Compliance Log',
            description: c.title,
            timestamp: c.date,
            link: '/compliance'
          });
        });
        // Sort by timestamp desc and take top 15
        const sorted = items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
        setActivities(sorted);
      } catch (error) {
        console.error('Failed to load activity feed', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);
  const getIcon = (type: string) => {
    switch (type) {
      case 'harvest': return <Sprout className="h-4 w-4 text-emerald-600" />;
      case 'task': return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'order': return <ShoppingCart className="h-4 w-4 text-purple-600" />;
      case 'compliance': return <ShieldCheck className="h-4 w-4 text-amber-600" />;
      default: return <Activity className="h-4 w-4 text-slate-600" />;
    }
  };
  const getBgColor = (type: string) => {
    switch (type) {
      case 'harvest': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'task': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'order': return 'bg-purple-100 dark:bg-purple-900/30';
      case 'compliance': return 'bg-amber-100 dark:bg-amber-900/30';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px] p-0">
        <ScrollArea className="h-[300px] px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent activity found.
            </div>
          ) : (
            <div className="space-y-6 pb-6 pt-2">
              {activities.map((item, index) => (
                <div key={item.id} className="relative pl-6 group">
                  {/* Timeline Line */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-border group-hover:bg-muted-foreground/50 transition-colors" />
                  )}
                  {/* Icon Bubble */}
                  <div className={cn(
                    "absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-background",
                    getBgColor(item.type)
                  )}>
                    {getIcon(item.type)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <Link to={item.link} className="text-sm font-medium hover:underline decoration-emerald-500/50 underline-offset-4">
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}