import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, ShieldCheck, AlertTriangle, CheckCircle2, Calendar, FileText, Trash2, Edit, Loader2, Workflow } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { ComplianceLog, Field, Livestock, InventoryItem } from '@shared/types';
import { toast } from 'sonner';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ComplianceDialog } from '@/components/compliance/ComplianceDialog';
import { TraceabilityExplorer } from '@/components/compliance/TraceabilityExplorer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
export function CompliancePage() {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ComplianceLog | null>(null);
  const [activeTab, setActiveTab] = useState('logs');
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [logsRes, fieldsRes, livestockRes, inventoryRes] = await Promise.all([
        api<{ items: ComplianceLog[] }>('/api/compliance'),
        api<{ items: Field[] }>('/api/fields'),
        api<{ items: Livestock[] }>('/api/livestock'),
        api<{ items: InventoryItem[] }>('/api/inventory'),
      ]);
      setLogs(logsRes.items.sort((a, b) => b.date - a.date));
      setFields(fieldsRes.items);
      setLivestock(livestockRes.items);
      setInventory(inventoryRes.items);
    } catch (error) {
      toast.error('Failed to load compliance data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleSaveLog = async (data: Partial<ComplianceLog>) => {
    try {
      if (selectedLog) {
        const updated = await api<ComplianceLog>(`/api/compliance/${selectedLog.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
        toast.success('Log updated');
      } else {
        const created = await api<ComplianceLog>('/api/compliance', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setLogs(prev => [created, ...prev]);
        toast.success('Log created');
      }
    } catch (error) {
      toast.error('Failed to save log');
    }
  };
  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete this compliance record?')) return;
    try {
      await api(`/api/compliance/${id}`, { method: 'DELETE' });
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Record deleted');
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };
  const openDialog = (log?: ComplianceLog) => {
    setSelectedLog(log || null);
    setIsDialogOpen(true);
  };
  const filteredLogs = logs.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
      case 'fail': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      case 'warning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-4 w-4" />;
      case 'fail': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };
  // Calculate upcoming due dates
  const upcomingDue = logs
    .filter(l => l.nextDueDate && isAfter(l.nextDueDate, Date.now()) && isBefore(l.nextDueDate, addDays(Date.now(), 30)))
    .sort((a, b) => (a.nextDueDate || 0) - (b.nextDueDate || 0));
  return (
    <AppLayout
      title="Compliance & Safety"
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'logs' && (
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          {activeTab === 'logs' && (
            <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Log
            </Button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Audit Logs
            </TabsTrigger>
            <TabsTrigger value="traceability" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" /> Traceability
            </TabsTrigger>
          </TabsList>
          <TabsContent value="logs" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Passed Inspections</p>
                    <h3 className="text-2xl font-bold mt-2 text-emerald-900 dark:text-emerald-100">
                      {logs.filter(l => l.status === 'pass').length}
                    </h3>
                  </div>
                  <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Upcoming Renewals</p>
                    <h3 className="text-2xl font-bold mt-2 text-amber-900 dark:text-amber-100">
                      {upcomingDue.length}
                    </h3>
                  </div>
                  <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Records</p>
                    <h3 className="text-2xl font-bold mt-2 text-blue-900 dark:text-blue-100">
                      {logs.length}
                    </h3>
                  </div>
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Upcoming Due List */}
            {upcomingDue.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-900">
                <CardHeader className="pb-3 bg-amber-50/50 dark:bg-amber-950/10">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> Action Required Soon
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {upcomingDue.map(log => (
                      <div key={log.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.title}</span>
                          <Badge variant="outline" className="text-xs">{log.type}</Badge>
                        </div>
                        <span className="text-amber-600 font-medium">
                          Due {log.nextDueDate ? format(log.nextDueDate, 'MMM d') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Main List */}
            {filteredLogs.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No records found"
                description="Log inspections and certifications to maintain compliance."
                action={<Button onClick={() => openDialog()} variant="outline">Create Log</Button>}
              />
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <Card key={log.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                            log.status === 'pass' ? "bg-emerald-100 text-emerald-600" : 
                            log.status === 'fail' ? "bg-red-100 text-red-600" : 
                            "bg-blue-100 text-blue-600"
                          )}>
                            {getStatusIcon(log.status)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{log.title}</h4>
                              <Badge variant="secondary" className={cn("capitalize border", getStatusColor(log.status))}>
                                {log.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(log.date, 'MMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span className="capitalize">{log.type}</span>
                              </div>
                              {log.inspector && (
                                <div className="flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>Inspector: {log.inspector}</span>
                                </div>
                              )}
                              {log.relatedEntityType && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium capitalize text-emerald-600 dark:text-emerald-400">
                                    Linked to {log.relatedEntityType}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDialog(log)}>
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteLog(log.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="traceability">
            <TraceabilityExplorer />
          </TabsContent>
        </Tabs>
      )}
      <ComplianceDialog
        log={selectedLog}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveLog}
        fields={fields}
        livestock={livestock}
        inventory={inventory}
      />
    </AppLayout>
  );
}