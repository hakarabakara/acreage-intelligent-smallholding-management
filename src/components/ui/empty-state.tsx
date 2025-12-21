import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl bg-muted/10 animate-in fade-in zoom-in-95 duration-300",
      className
    )}>
      <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}