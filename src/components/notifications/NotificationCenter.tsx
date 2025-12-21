import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
export function NotificationCenter() {
  const { notifications, isLoading, error } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const criticalCount = notifications.filter(n => n.severity === 'critical').length;
  const totalCount = notifications.length;
  const handleItemClick = (link: string) => {
    setOpen(false);
    navigate(link);
  };
  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };
  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-950/30';
      case 'warning': return 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-950/30';
      default: return 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/30';
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className={cn(
              "absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
              criticalCount > 0 ? "bg-red-600" : "bg-amber-500"
            )} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold leading-none">Notifications</h4>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount} New
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">All systems operational</p>
            </div>
          ) : (
            <div className="grid gap-1 p-1">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 p-3 text-left rounded-md transition-colors border",
                    getBgColor(item.severity)
                  )}
                  onClick={() => handleItemClick(item.link)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getIcon(item.severity)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground pt-1">
                      {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}