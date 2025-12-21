import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, HardDrive, Globe, Hash } from 'lucide-react';
import { useAuth } from '@/lib/auth';
export function SystemInfoCard() {
  const user = useAuth((state) => state.user);
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');
  const [userAgent, setUserAgent] = useState<string>('');
  useEffect(() => {
    // Calculate Local Storage Usage
    let total = 0;
    for (const x in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
        total += (localStorage[x].length * 2);
      }
    }
    const sizeInKB = total / 1024;
    setStorageUsage(`${sizeInKB.toFixed(2)} KB`);
    setUserAgent(navigator.userAgent);
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          System Information
        </CardTitle>
        <CardDescription>Technical details about your current session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <Hash className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">App Version</div>
                <div className="text-xs text-muted-foreground">v1.2.0 (Stable)</div>
              </div>
            </div>
            <Badge variant="outline">Latest</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Local Storage</div>
                <div className="text-xs text-muted-foreground">{storageUsage} used</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border md:col-span-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 flex-shrink-0">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">Client Details</div>
                <div className="text-xs text-muted-foreground truncate" title={userAgent}>
                  {userAgent}
                </div>
              </div>
            </div>
          </div>
          {user?.id && (
             <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border md:col-span-2">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                        <Hash className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-sm font-medium">User ID</div>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{user.id}</code>
                    </div>
                </div>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}