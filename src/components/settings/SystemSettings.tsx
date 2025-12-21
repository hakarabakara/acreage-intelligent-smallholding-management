import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Key, Trash2, Terminal, Copy, Moon, Sun, Download, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { ApiKey, Farm } from '@shared/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SubscriptionCard } from '@/components/settings/SubscriptionCard';
import { DangerZone } from '@/components/settings/DangerZone';
import { SystemInfoCard } from '@/components/settings/SystemInfoCard';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
export function SystemSettings() {
  const { isDark, toggleTheme } = useTheme();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  useEffect(() => {
    fetchApiKeys();
    fetchFarm();
  }, []);
  const fetchApiKeys = async () => {
    try {
      const res = await api<{ items: ApiKey[] }>('/api/api-keys');
      setApiKeys(res.items);
    } catch (error) {
      console.error('Failed to load API keys', error);
    }
  };
  const fetchFarm = async () => {
    try {
      const res = await api<Farm>('/api/farm');
      setFarm(res);
    } catch (error) {
      console.error('Failed to load farm details', error);
    }
  };
  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const created = await api<ApiKey>('/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName.trim() })
      });
      setApiKeys(prev => [...prev, created]);
      setGeneratedKey(created.key);
      setNewKeyName('');
      toast.success('API Key generated');
    } catch (error) {
      toast.error('Failed to generate key');
    }
  };
  const handleDeleteKey = async (id: string) => {
    if (!confirm('Revoke this API key? External integrations using it will stop working.')) return;
    try {
      await api(`/api/api-keys/${id}`, { method: 'DELETE' });
      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Key revoked');
    } catch (error) {
      toast.error('Failed to revoke key');
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  const handleRestoreData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.data) throw new Error('Invalid backup format');
        await api('/api/farm/data/restore', {
          method: 'POST',
          body: JSON.stringify({ data: json.data })
        });
        toast.success('Farm data restored successfully', { description: 'Reloading application...' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Restore failed:', error);
        toast.error('Failed to restore data', { description: 'Invalid file or server error.' });
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };
  const handleClearData = async () => {
    setIsResetting(true);
    try {
      await api('/api/farm/data', { method: 'DELETE' });
      toast.success('Farm data wiped successfully', { description: 'Reloading application...' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Failed to reset farm data', { description: 'Please check your connection and try again.' });
      setIsResetting(false);
    }
  };
  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    try {
      const data = await api<Record<string, any>>('/api/farm/backup');
      const blob = new Blob([JSON.stringify({ data }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acreage-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Failed to download backup');
    } finally {
      setIsBackingUp(false);
    }
  };
  return (
    <div className="space-y-8">
      <SubscriptionCard farm={farm} />
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how Acreage looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Theme Preference</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark modes.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={!isDark ? 'default' : 'ghost'}
                size="sm"
                onClick={() => isDark && toggleTheme()}
                className={cn("h-8", !isDark && "bg-white text-black shadow-sm")}
              >
                <Sun className="h-4 w-4 mr-2" /> Light
              </Button>
              <Button
                variant={isDark ? 'default' : 'ghost'}
                size="sm"
                onClick={() => !isDark && toggleTheme()}
                className={cn("h-8", isDark && "bg-neutral-800 text-white shadow-sm")}
              >
                <Moon className="h-4 w-4 mr-2" /> Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>External API Access</CardTitle>
            <CardDescription>Manage keys for IoT devices and external integrations.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsKeyDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Generate Key
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {apiKeys.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
              No API keys generated. Create one to connect external sensors.
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                      <Key className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{key.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Created {format(key.createdAt, 'MMM d, yyyy')} • Last used: {key.lastUsedAt ? format(key.lastUsedAt, 'MMM d, HH:mm') : 'Never'}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteKey(key.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between mb-2 text-slate-400">
              <span className="flex items-center gap-2"><Terminal className="h-3 w-3" /> Example: Log Resource Usage</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => copyToClipboard(`curl -X POST ${window.location.origin}/api/hooks/resources \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"type": "energy", "flow": "consumption", "amount": 12.5, "unit": "kWh", "source": "Smart Meter"}'`)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <pre>
{`curl -X POST ${window.location.origin}/api/hooks/resources \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "energy", "flow": "consumption", "amount": 12.5, "unit": "kWh", "source": "Smart Meter"}'`}
            </pre>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Data Portability</CardTitle>
          <CardDescription>Export your farm data for safekeeping or migration.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-background border rounded-lg">
            <div>
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-muted-foreground">Download a full JSON backup of your farm records.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleDownloadBackup}
              disabled={isBackingUp}
            >
              {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {isBackingUp ? 'Exporting...' : 'Download Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <SystemInfoCard />
      <DangerZone 
        onReset={handleClearData} 
        onRestore={handleRestoreData}
        isResetting={isResetting}
        isRestoring={isRestoring}
      />
      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>Create a new key for external access.</DialogDescription>
          </DialogHeader>
          {!generatedKey ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input 
                  placeholder="e.g. Home Assistant Bridge" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-2 font-medium">
                  Key Generated Successfully!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-black p-2 rounded border text-xs font-mono break-all">
                    {generatedKey}
                  </code>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(generatedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                  Copy this key now. It will not be shown again.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            {!generatedKey ? (
              <>
                <Button variant="outline" onClick={() => setIsKeyDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerateKey} disabled={!newKeyName.trim()}>Generate</Button>
              </>
            ) : (
              <Button onClick={() => { setIsKeyDialogOpen(false); setGeneratedKey(null); }}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}