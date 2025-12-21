import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MapPin, HeartPulse, Plus, Trash2, Syringe, Stethoscope, Activity, Edit, Dna, Archive } from 'lucide-react';
import type { Livestock, Field, HealthLog } from '@shared/types';
import { format } from 'date-fns';
interface LivestockDetailsSheetProps {
  livestock: Livestock | null;
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  healthLogs: HealthLog[];
  onUpdateLivestock: (id: string, data: Partial<Livestock>) => Promise<void>;
  onAddHealthLog: (log: Partial<HealthLog>) => Promise<void>;
  onDeleteHealthLog: (id: string) => Promise<void>;
  onEdit: () => void;
  allLivestock?: Livestock[];
}
export function LivestockDetailsSheet({
  livestock,
  isOpen,
  onClose,
  fields,
  healthLogs,
  onUpdateLivestock,
  onAddHealthLog,
  onDeleteHealthLog,
  onEdit,
  allLivestock = []
}: LivestockDetailsSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [newLog, setNewLog] = useState<Partial<HealthLog>>({
    type: 'checkup',
    description: '',
    cost: undefined,
    date: Date.now(),
  });
  if (!livestock) return null;
  const isArchived = livestock.status === 'archived';
  const handleLocationChange = async (locationId: string) => {
    setIsSaving(true);
    try {
      await onUpdateLivestock(livestock.id, { locationId });
    } finally {
      setIsSaving(false);
    }
  };
  const handleAddLog = async () => {
    if (!newLog.description) return;
    setIsSaving(true);
    try {
      await onAddHealthLog({
        ...newLog,
        livestockId: livestock.id,
        date: newLog.date || Date.now(),
      });
      setNewLog({ type: 'checkup', description: '', cost: undefined, date: Date.now() });
    } finally {
      setIsSaving(false);
    }
  };
  const handleArchive = async () => {
    if (!archiveReason.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateLivestock(livestock.id, {
        status: 'archived',
        archiveDate: Date.now(),
        archiveReason: archiveReason.trim()
      });
      setIsArchiveDialogOpen(false);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'vaccination': return <Syringe className="h-4 w-4 text-blue-500" />;
      case 'treatment': return <Stethoscope className="h-4 w-4 text-red-500" />;
      case 'checkup': return <Activity className="h-4 w-4 text-emerald-500" />;
      default: return <HeartPulse className="h-4 w-4 text-slate-500" />;
    }
  };
  const getParentName = (id?: string) => {
    if (!id) return '--';
    const parent = allLivestock.find(l => l.tag === id || l.id === id);
    return parent ? `${parent.tag} (${parent.type})` : id;
  };
  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{livestock.type}</Badge>
                <Badge variant={livestock.status === 'healthy' ? 'default' : livestock.status === 'archived' ? 'secondary' : 'destructive'}>
                  {livestock.status}
                </Badge>
              </div>
              {!isArchived && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              )}
            </div>
            <SheetTitle className="text-2xl">{livestock.tag}</SheetTitle>
            <div>
              <SheetDescription>
                {livestock.breed} • Registered {livestock.id.slice(0, 8)}
              </SheetDescription>
            </div>
          </SheetHeader>
          {isArchived && (
            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <Archive className="h-5 w-5 text-slate-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Archived Record</h4>
                <p className="text-sm text-muted-foreground">
                  Reason: {livestock.archiveReason}<br/>
                  Date: {livestock.archiveDate ? format(livestock.archiveDate, 'MMM d, yyyy') : 'Unknown'}
                </p>
              </div>
            </div>
          )}
          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="health">Health Record</TabsTrigger>
            </TabsList>
            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Location Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Field</Label>
                    <Select
                      value={livestock.locationId || 'unassigned'}
                      onValueChange={handleLocationChange}
                      disabled={isSaving || isArchived}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {fields.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {livestock.locationId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                      <MapPin className="h-4 w-4" />
                      <span>Currently grazing in {fields.find(f => f.id === livestock.locationId)?.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Dna className="h-4 w-4" /> Origin & Lineage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Origin</Label>
                      <div className="font-medium capitalize">{livestock.origin || 'Unknown'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {livestock.origin === 'purchased' ? 'Purchase Date' : 'Birth Date'}
                      </Label>
                      <div className="font-medium">
                        {livestock.birthDate ? format(livestock.birthDate, 'MMM d, yyyy') :
                         livestock.purchaseDate ? format(livestock.purchaseDate, 'MMM d, yyyy') : '--'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Dam (Mother)</Label>
                      <div className="font-medium">{getParentName(livestock.dam)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sire (Father)</Label>
                      <div className="font-medium">{getParentName(livestock.sire)}</div>
                    </div>
                  </div>
                  {livestock.notes && (
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm mt-1">{livestock.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              {!isArchived && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Status Update</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {['healthy', 'sick', 'quarantine'].map((status) => (
                        <Button
                          key={status}
                          variant={livestock.status === status ? 'default' : 'outline'}
                          size="sm"
                          className="capitalize"
                          onClick={() => onUpdateLivestock(livestock.id, { status: status as any })}
                          disabled={isSaving}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setIsArchiveDialogOpen(true)}
                      disabled={isSaving}
                    >
                      <Archive className="h-4 w-4 mr-2" /> Archive Record
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            {/* HEALTH RECORD */}
            <TabsContent value="health" className="space-y-6 mt-4">
              {!isArchived && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <h4 className="font-medium text-sm">Log New Event</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Event Type</Label>
                      <Select
                        value={newLog.type}
                        onValueChange={(v) => setNewLog({...newLog, type: v as any})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkup">Checkup</SelectItem>
                          <SelectItem value="vaccination">Vaccination</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="injury">Injury</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={format(newLog.date || Date.now(), 'yyyy-MM-dd')}
                        onChange={(e) => setNewLog({...newLog, date: new Date(e.target.value).getTime()})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      placeholder="Details about the event..."
                      value={newLog.description}
                      onChange={(e) => setNewLog({...newLog, description: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-2 w-1/3">
                      <Label className="text-xs">Cost ($)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newLog.cost || ''}
                        onChange={(e) => setNewLog({...newLog, cost: Number(e.target.value)})}
                      />
                    </div>
                    <Button size="sm" onClick={handleAddLog} disabled={isSaving || !newLog.description}>
                      <Plus className="h-4 w-4 mr-2" /> Add Log
                    </Button>
                  </div>
                </div>
              )}
              <Separator />
              <ScrollArea className="h-[300px]">
                <div className="space-y-4 pr-4">
                  {healthLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No health records found.
                    </div>
                  ) : (
                    healthLogs.sort((a, b) => b.date - a.date).map((log) => (
                      <div key={log.id} className="relative pl-6 pb-6 border-l last:border-0 last:pb-0">
                        <div className="absolute left-[-9px] top-0 bg-background p-1 rounded-full border">
                          {getLogIcon(log.type)}
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm capitalize">{log.type}</span>
                              <span className="text-xs text-muted-foreground">{format(log.date, 'MMM d, yyyy')}</span>
                            </div>
                            <p className="text-sm mt-1">{log.description}</p>
                            {log.cost && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                Cost: ${log.cost}
                              </Badge>
                            )}
                          </div>
                          {!isArchived && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-red-500"
                              onClick={() => onDeleteHealthLog(log.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Livestock Record</DialogTitle>
            <DialogDescription>
              This will move the animal to the archive. This action preserves history but removes it from active lists.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Archiving</Label>
              <Select value={archiveReason} onValueChange={setArchiveReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                  <SelectItem value="Gifted">Gifted</SelectItem>
                  <SelectItem value="Consumed">Consumed</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {archiveReason === 'Other' && (
               <Input placeholder="Specify reason..." onChange={(e) => setArchiveReason(e.target.value)} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleArchive} disabled={!archiveReason}>Confirm Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}