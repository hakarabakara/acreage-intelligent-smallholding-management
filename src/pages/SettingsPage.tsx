import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/use-theme';
import { toast } from 'sonner';
import { Save, Moon, Sun, Trash2, Download, Plus, Tractor, Loader2, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { LivestockTypeConfig } from '@shared/types';
import { format } from 'date-fns';
import { UserProfileCard } from '@/components/user/UserProfileCard';
import { useFarmStore } from '@/lib/farm-store';
export function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  // Farm Settings Store
  const settings = useFarmStore((state) => state.settings);
  const updateSettings = useFarmStore((state) => state.updateSettings);
  const isSettingsLoading = useFarmStore((state) => state.isLoading);
  // Local state for form inputs
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('imperial');
  // Sync local state with store
  useEffect(() => {
    if (settings) {
      setFarmName(settings.name || '');
      setOwnerName(settings.ownerName || '');
      setLocation(settings.location || '');
      setCurrency(settings.currency || 'USD');
      setMeasurementSystem(settings.measurementSystem || 'imperial');
    }
  }, [settings]);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  // Livestock Types State
  const [livestockTypes, setLivestockTypes] = useState<LivestockTypeConfig[]>([]);
  const [newType, setNewType] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  // System Health State
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  useEffect(() => {
    fetchLivestockTypes();
    checkSystemHealth();
  }, []);
  const checkSystemHealth = async () => {
    setHealthStatus('checking');
    try {
      await api<{ status: string }>('/api/health');
      setHealthStatus('online');
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus('offline');
    }
  };
  const fetchLivestockTypes = async () => {
    try {
      const res = await api<{ items: LivestockTypeConfig[] }>('/api/livestock-types');
      setLivestockTypes(res.items);
    } catch (error) {
      console.error('Failed to load livestock types', error);
    }
  };
  const handleSaveFarmProfile = async () => {
    try {
      await updateSettings({
        name: farmName,
        ownerName: ownerName,
        location: location,
        currency: currency,
        measurementSystem: measurementSystem
      });
      toast.success('Farm settings updated successfully');
    } catch (error) {
      toast.error('Failed to update farm settings');
    }
  };
  const handleExportData = async () => {
    setIsExporting(true);
    toast.info('Preparing data export...', { description: 'This may take a moment.' });
    try {
      // Fetch all data in parallel
      const [
        fields,
        crops,
        tasks,
        livestock,
        inventory,
        transactions,
        users,
        contacts,
        sales, // customers
        orders,
        compliance,
        rotations,
        cropVarieties,
        livestockTypesData
      ] = await Promise.all([
        api<{ items: any[] }>('/api/fields'),
        api<{ items: any[] }>('/api/crops'),
        api<{ items: any[] }>('/api/tasks'),
        api<{ items: any[] }>('/api/livestock'),
        api<{ items: any[] }>('/api/inventory'),
        api<{ items: any[] }>('/api/transactions'),
        api<{ items: any[] }>('/api/users'),
        api<{ items: any[] }>('/api/contacts'),
        api<{ items: any[] }>('/api/customers'),
        api<{ items: any[] }>('/api/orders'),
        api<{ items: any[] }>('/api/compliance'),
        api<{ items: any[] }>('/api/rotations'),
        api<{ items: any[] }>('/api/crop-varieties'),
        api<{ items: any[] }>('/api/livestock-types'),
      ]);
      const exportData = {
        metadata: {
          version: '1.0',
          exportDate: new Date().toISOString(),
          farmName: settings?.name || 'My Farm',
        },
        data: {
          fields: fields.items,
          crops: crops.items,
          tasks: tasks.items,
          livestock: livestock.items,
          inventory: inventory.items,
          transactions: transactions.items,
          users: users.items,
          contacts: contacts.items,
          customers: sales.items,
          orders: orders.items,
          compliance: compliance.items,
          rotations: rotations.items,
          cropVarieties: cropVarieties.items,
          livestockTypes: livestockTypesData.items
        }
      };
      // Create and trigger download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acreage-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data export complete');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data', { description: 'Please try again later.' });
    } finally {
      setIsExporting(false);
    }
  };
  const handleClearData = async () => {
    if (!confirm('Are you sure? This action cannot be undone and will reset the system to factory defaults.')) {
      return;
    }
    setIsResetting(true);
    try {
      await api('/api/reset', { method: 'DELETE' });
      toast.success('System reset successful', { description: 'Reloading application...' });
      // Short delay to allow toast to be seen
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Failed to reset system', { description: 'Please check your connection and try again.' });
      setIsResetting(false);
    }
  };
  const handleAddType = async () => {
    if (!newType.trim()) return;
    setIsAddingType(true);
    try {
      const created = await api<LivestockTypeConfig>('/api/livestock-types', {
        method: 'POST',
        body: JSON.stringify({ name: newType.trim() })
      });
      setLivestockTypes(prev => [...prev, created]);
      setNewType('');
      toast.success('Livestock type added');
    } catch (error) {
      toast.error('Failed to add type');
    } finally {
      setIsAddingType(false);
    }
  };
  const handleDeleteType = async (id: string) => {
    if (!confirm('Remove this livestock type?')) return;
    try {
      await api(`/api/livestock-types/${id}`, { method: 'DELETE' });
      setLivestockTypes(prev => prev.filter(t => t.id !== id));
      toast.success('Type removed');
    } catch (error) {
      toast.error('Failed to remove type');
    }
  };
  return (
    <AppLayout title="Settings">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* User Profile Section */}
        <UserProfileCard />
        {/* Farm Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Farm Settings</CardTitle>
            <CardDescription>Manage your farm's identity and global preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input
                id="farmName"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g. Green Valley Farm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. California, USA"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="measurement">Measurement System</Label>
                <Select value={measurementSystem} onValueChange={(v: any) => setMeasurementSystem(v)}>
                  <SelectTrigger id="measurement">
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imperial">Imperial (Acres, lbs)</SelectItem>
                    <SelectItem value="metric">Metric (Hectares, kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={handleSaveFarmProfile} disabled={isSettingsLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSettingsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Livestock Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Livestock Configuration</CardTitle>
            <CardDescription>Define the types of animals you manage on your farm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New animal type (e.g. Alpaca)"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
              />
              <Button onClick={handleAddType} disabled={isAddingType || !newType.trim()}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {livestockTypes.map(type => (
                <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                      <Tractor className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => handleDeleteType(type.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {livestockTypes.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No custom types defined.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Appearance Section */}
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
        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Control your data, exports, and system resets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground">Download a copy of all your farm records.</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/10 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-200">Clear All Data</h4>
                  <p className="text-sm text-red-700 dark:text-red-400">Permanently remove all records and reset.</p>
                </div>
              </div>
              <Button variant="destructive" onClick={handleClearData} disabled={isResetting}>
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isResetting ? 'Resetting...' : 'Reset System'}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* System Info */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Activity className="h-4 w-4" />
            <span>System Status:</span>
            {healthStatus === 'checking' && (
              <span className="flex items-center gap-1 text-yellow-600">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking...
              </span>
            )}
            {healthStatus === 'online' && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Online
              </span>
            )}
            {healthStatus === 'offline' && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <XCircle className="h-3 w-3" /> Offline
              </span>
            )}
          </div>
          <p>Acreage Manager v1.0.0</p>
          <p>Built with Cloudflare Workers & Durable Objects</p>
        </div>
      </div>
    </AppLayout>
  );
}