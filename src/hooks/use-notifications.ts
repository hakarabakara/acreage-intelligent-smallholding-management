import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { InventoryItem, Task, Livestock, ComplianceLog } from '@shared/types';
export type NotificationSeverity = 'critical' | 'warning' | 'info';
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  timestamp: number;
  link: string;
  type: 'inventory' | 'task' | 'livestock' | 'compliance';
}
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchNotifications = useCallback(async () => {
    try {
      // Don't set loading to true on background refreshes to avoid UI flicker
      // Only set it on initial load if notifications are empty
      if (notifications.length === 0) {
        setIsLoading(true);
      }
      const [inventoryRes, tasksRes, livestockRes, complianceRes] = await Promise.all([
        api<{ items: InventoryItem[] }>('/api/inventory'),
        api<{ items: Task[] }>('/api/tasks'),
        api<{ items: Livestock[] }>('/api/livestock'),
        api<{ items: ComplianceLog[] }>('/api/compliance'),
      ]);
      const items: NotificationItem[] = [];
      const now = Date.now();
      // 1. Inventory Alerts
      inventoryRes.items.forEach(item => {
        if (item.quantity <= item.lowStockThreshold) {
          items.push({
            id: `inv-${item.id}`,
            title: 'Low Stock Alert',
            description: `${item.name} is running low (${item.quantity} ${item.unit} remaining).`,
            severity: item.quantity === 0 ? 'critical' : 'warning',
            timestamp: item.lastUpdated || now,
            link: '/inventory',
            type: 'inventory'
          });
        }
      });
      // 2. Task Alerts
      tasksRes.items.forEach(task => {
        if (task.status !== 'done') {
          const isOverdue = task.dueDate ? task.dueDate < now : false;
          if (task.priority === 'urgent' || isOverdue) {
            items.push({
              id: `task-${task.id}`,
              title: isOverdue ? 'Overdue Task' : 'Urgent Task',
              description: task.title,
              severity: 'critical',
              timestamp: task.createdAt || now,
              link: '/tasks',
              type: 'task'
            });
          } else if (task.priority === 'high') {
             items.push({
              id: `task-${task.id}`,
              title: 'High Priority Task',
              description: task.title,
              severity: 'warning',
              timestamp: task.createdAt || now,
              link: '/tasks',
              type: 'task'
            });
          }
        }
      });
      // 3. Livestock Alerts
      livestockRes.items.forEach(animal => {
        if (animal.status === 'sick') {
          items.push({
            id: `animal-${animal.id}`,
            title: 'Sick Animal',
            description: `${animal.tag} (${animal.type}) reported as sick.`,
            severity: 'critical',
            timestamp: now, // Livestock doesn't have a "status changed at" timestamp easily available
            link: '/livestock',
            type: 'livestock'
          });
        } else if (animal.status === 'quarantine') {
          items.push({
            id: `animal-${animal.id}`,
            title: 'Animal in Quarantine',
            description: `${animal.tag} is currently in quarantine.`,
            severity: 'warning',
            timestamp: now,
            link: '/livestock',
            type: 'livestock'
          });
        }
      });
      // 4. Compliance Alerts
      complianceRes.items.forEach(log => {
        if (log.status === 'fail') {
          items.push({
            id: `comp-${log.id}`,
            title: 'Compliance Failure',
            description: `${log.title} failed inspection.`,
            severity: 'critical',
            timestamp: log.date,
            link: '/compliance',
            type: 'compliance'
          });
        } else if (log.status === 'warning') {
           items.push({
            id: `comp-${log.id}`,
            title: 'Compliance Warning',
            description: `${log.title} has warnings.`,
            severity: 'warning',
            timestamp: log.date,
            link: '/compliance',
            type: 'compliance'
          });
        } else if (log.nextDueDate && log.status !== 'pass') { // Pending items due soon
           const dueDate = log.nextDueDate;
           const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
           if (daysUntilDue <= 7 && daysUntilDue >= 0) {
             items.push({
              id: `comp-due-${log.id}`,
              title: 'Compliance Due Soon',
              description: `${log.title} is due in ${Math.ceil(daysUntilDue)} days.`,
              severity: 'warning',
              timestamp: now,
              link: '/compliance',
              type: 'compliance'
            });
           } else if (daysUntilDue < 0) {
             items.push({
              id: `comp-overdue-${log.id}`,
              title: 'Compliance Overdue',
              description: `${log.title} was due on ${new Date(dueDate).toLocaleDateString()}.`,
              severity: 'critical',
              timestamp: now,
              link: '/compliance',
              type: 'compliance'
            });
           }
        }
      });
      // Sort by severity (critical first) then by timestamp (newest first)
      items.sort((a, b) => {
        const severityScore = { critical: 3, warning: 2, info: 1 };
        const scoreDiff = severityScore[b.severity] - severityScore[a.severity];
        if (scoreDiff !== 0) return scoreDiff;
        return b.timestamp - a.timestamp;
      });
      setNotifications(items);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      setError('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, [notifications.length]);
  useEffect(() => {
    fetchNotifications();
    // Poll every minute for updates
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);
  return { notifications, isLoading, error, refetch: fetchNotifications };
}