import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, ShieldCheck, Copy } from 'lucide-react';
import type { Farm } from '@shared/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
interface SubscriptionCardProps {
  farm: Farm | null;
}
export function SubscriptionCard({ farm }: SubscriptionCardProps) {
  if (!farm) return null;
  const copyTenantId = () => {
    navigator.clipboard.writeText(farm.id);
    toast.success('Tenant ID copied to clipboard');
  };
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
      case 'trial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Subscription Status</CardTitle>
          </div>
          <Badge variant="outline" className={cn("capitalize", getStatusColor(farm.subscriptionStatus))}>
            {farm.subscriptionStatus || 'Unknown'}
          </Badge>
        </div>
        <CardDescription>Manage your billing and plan details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Professional</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full dark:bg-emerald-900/50 dark:text-emerald-400">
                Active
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm">
               <CreditCard className="mr-2 h-4 w-4" /> Manage Billing
             </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tenant ID</span>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{farm.id}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyTenantId}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Member Since</span>
            <span>{new Date(farm.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>Secure data encryption enabled</span>
        </div>
      </CardContent>
    </Card>
  );
}