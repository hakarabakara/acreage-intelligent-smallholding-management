import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LucideIcon, HelpCircle } from 'lucide-react';
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  variant?: 'default' | 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'yellow';
  className?: string;
}
export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  variant = 'default',
  className
}: StatCardProps) {
  const variants = {
    default: {
      bg: 'bg-card',
      border: 'border-border',
      text: 'text-muted-foreground',
      value: 'text-foreground',
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-100 dark:border-emerald-900',
      text: 'text-emerald-600 dark:text-emerald-400',
      value: 'text-emerald-900 dark:text-emerald-100',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-100 dark:border-blue-900',
      text: 'text-blue-600 dark:text-blue-400',
      value: 'text-blue-900 dark:text-blue-100',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-100 dark:border-amber-900',
      text: 'text-amber-600 dark:text-amber-400',
      value: 'text-amber-900 dark:text-amber-100',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-purple-100 dark:border-purple-900',
      text: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-900 dark:text-purple-100',
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-100 dark:border-red-900',
      text: 'text-red-600 dark:text-red-400',
      value: 'text-red-900 dark:text-red-100',
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-100 dark:border-yellow-900',
      text: 'text-yellow-600 dark:text-yellow-400',
      value: 'text-yellow-900 dark:text-yellow-100',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    }
  };
  const styles = variants[variant];
  const IconComponent = Icon || HelpCircle;
  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", styles.bg, styles.border, className)}>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className={cn("text-sm font-medium", styles.text)}>{title}</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <h3 className={cn("text-3xl font-bold", styles.value)}>
                {value}
              </h3>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", styles.iconBg)}>
          <IconComponent className={cn("h-6 w-6", styles.iconColor)} />
        </div>
      </CardContent>
    </Card>
  );
}