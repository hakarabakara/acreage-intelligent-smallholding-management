import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Plus, Tractor, MapPin, HeartPulse, Loader2, Trash2, Archive, LayoutGrid, List, ArrowRightLeft } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Livestock, Field, HealthLog, LivestockTypeConfig } from '@shared/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { LivestockDetailsSheet } from '@/components/livestock/LivestockDetailsSheet';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectionBar } from '@/components/ui/selection-bar';
import { BulkMoveDialog } from '@/components/livestock/BulkMoveDialog';
import { LivestockList } from '@/components/livestock/LivestockList';
const livestockSchema = z.object({
  tag: z.string().min(1, 'Tag ID required'),
  type: z.string().min(1, 'Type required'),
  breed: z.string().optional(),
  status: z.enum(['healthy', 'sick', 'quarantine', 'archived']),
  locationId: z.string().optional(),
  origin: z.enum(['born', 'purchased']).optional(),
  date: z.string().optional(), // Birth or Purchase date
  dam: z.string().optional(),
  sire: z.string().optional(),
  notes: z.string().optional(),
});
type LivestockFormValues = z.infer<typeof livestockSchema>;
export function LivestockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [livestockTypes, setLivestockTypes] = useState<LivestockTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [editingAnimal, setEditingAnimal] = useState<Livestock | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // View State
  const [displayFilter, setDisplayFilter] = useState<'active' | 'archived'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Bulk Selection State
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const form = useForm<LivestockFormValues>({
    resolver: zodResolver(livestockSchema),
    defaultValues: {
      tag: '',
      type: 'Cattle',
      breed: '',
      status: 'healthy',
      locationId: '',
      origin: 'born',
      date: format(new Date(), 'yyyy-MM-dd'),
      dam: '',
      sire: '',
      notes: '',
    },
  });
  const originType = form.watch('origin');
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [livestockRes, fieldsRes, logsRes, typesRes] = await Promise.all([
        api<{ items: Livestock[] }>('/api/livestock'),
        api<{ items: Field[] }>('/api/fields'),
        api<{ items: HealthLog[] }>('/api/health-logs'),
        api<{ items: LivestockTypeConfig[] }>('/api/livestock-types')
      ]);
      setLivestock(livestockRes.items);
      setFields(fieldsRes.items);
      setHealthLogs(logsRes.items);
      setLivestockTypes(typesRes.items);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  // Deep Linking Effect
  useEffect(() => {
    if (!isLoading && livestock.length > 0) {
      const livestockId = searchParams.get('livestockId');
      if (livestockId) {
        const animal = livestock.find(l => l.id === livestockId);
        if (animal) {
          openDetails(animal);
        }
      }
    }
  }, [isLoading, livestock, searchParams]);
  const openDialog = (animal?: Livestock) => {
    if (animal) {
      setEditingAnimal(animal);
      form.reset({
        tag: animal.tag,
        type: animal.type,
        breed: animal.breed || '',
        status: animal.status,
        locationId: animal.locationId || 'unassigned',
        origin: animal.origin || 'born',
        date: animal.birthDate ? format(animal.birthDate, 'yyyy-MM-dd') : animal.purchaseDate ? format(animal.purchaseDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        dam: animal.dam || '',
        sire: animal.sire || '',
        notes: animal.notes || '',
      });
    } else {
      setEditingAnimal(null);
      form.reset({
        tag: '',
        type: livestockTypes.length > 0 ? livestockTypes[0].name : 'Cattle',
        breed: '',
        status: 'healthy',
        locationId: 'unassigned',
        origin: 'born',
        date: format(new Date(), 'yyyy-MM-dd'),
        dam: '',
        sire: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };
  const onSubmit = async (data: LivestockFormValues) => {
    try {
      const payload: Partial<Livestock> = {
        ...data,
        birthDate: data.origin === 'born' && data.date ? new Date(data.date).getTime() : undefined,
        purchaseDate: data.origin === 'purchased' && data.date ? new Date(data.date).getTime() : undefined,
      };
      if (editingAnimal) {
        const updated = await api<Livestock>(`/api/livestock/${editingAnimal.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setLivestock(prev => prev.map(l => l.id === updated.id ? updated : l));
        if (selectedAnimal?.id === updated.id) setSelectedAnimal(updated);
        toast.success('Animal updated successfully');
      } else {
        const created = await api<Livestock>('/api/livestock', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setLivestock(prev => [...prev, created]);
        toast.success('Animal registered successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(editingAnimal ? 'Failed to update animal' : 'Failed to register animal');
    }
  };
  const deleteAnimal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure? This will delete all health records as well.')) return;
    try {
      await api(`/api/livestock/${id}`, { method: 'DELETE' });
      setLivestock(prev => prev.filter(l => l.id !== id));
      if (selectedAnimal?.id === id) setIsSheetOpen(false);
      toast.success('Record deleted');
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };
  const handleUpdateLivestock = async (id: string, data: Partial<Livestock>) => {
    try {
      const updated = await api<Livestock>(`/api/livestock/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setLivestock(prev => prev.map(l => l.id === id ? updated : l));
      setSelectedAnimal(updated);
      toast.success('Updated successfully');
    } catch (error) {
      toast.error('Failed to update');
    }
  };
  const handleAddHealthLog = async (log: Partial<HealthLog>) => {
    try {
      const created = await api<HealthLog>('/api/health-logs', {
        method: 'POST',
        body: JSON.stringify(log),
      });
      setHealthLogs(prev => [...prev, created]);
      toast.success('Health log added');
    } catch (error) {
      toast.error('Failed to add log');
    }
  };
  const handleDeleteHealthLog = async (id: string) => {
    try {
      await api(`/api/health-logs/${id}`, { method: 'DELETE' });
      setHealthLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Log deleted');
    } catch (error) {
      toast.error('Failed to delete log');
    }
  };
  const openDetails = (animal: Livestock) => {
    setSelectedAnimal(animal);
    setIsSheetOpen(true);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'sick': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'quarantine': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'archived': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  // Bulk Actions
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedAnimalIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAnimalIds(newSet);
  };
  const clearSelection = () => {
    setSelectedAnimalIds(new Set());
  };
  const handleSelectAll = (ids: string[]) => {
    if (ids.length === 0) {
      clearSelection();
    } else {
      setSelectedAnimalIds(new Set(ids));
    }
  };
  const handleBulkAction = async (action: 'update' | 'delete', data?: any) => {
    if (selectedAnimalIds.size === 0) return;
    if (action === 'delete') {
        if (!confirm(`Delete ${selectedAnimalIds.size} animals?`)) return;
    }
    try {
        const ids = Array.from(selectedAnimalIds);
        await api('/api/livestock/bulk', {
            method: 'POST',
            body: JSON.stringify({ ids, action, data })
        });
        if (action === 'delete') {
            setLivestock(prev => prev.filter(l => !selectedAnimalIds.has(l.id)));
            toast.success(`Deleted ${ids.length} records`);
        } else if (action === 'update') {
            setLivestock(prev => prev.map(l => selectedAnimalIds.has(l.id) ? { ...l, ...data } : l));
            toast.success(`Updated ${ids.length} records`);
        }
        clearSelection();
    } catch (error) {
        toast.error('Bulk action failed');
    }
  };
  const filteredLivestock = livestock.filter(l =>
    displayFilter === 'active' ? l.status !== 'archived' : l.status === 'archived'
  );
  return (
    <AppLayout
      title="Livestock Manager"
      actions={
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={displayFilter} onValueChange={(v) => v && setDisplayFilter(v as any)}>
            <ToggleGroupItem value="active" aria-label="Active">Active</ToggleGroupItem>
            <ToggleGroupItem value="archived" aria-label="Archived">Archived</ToggleGroupItem>
          </ToggleGroup>
          <div className="h-6 w-px bg-border mx-1" />
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
            <ToggleGroupItem value="grid" aria-label="Grid View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List View"><List className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          {displayFilter === 'active' && (
            <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white ml-2">
              <Plus className="mr-2 h-4 w-4" /> Register Animal
            </Button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredLivestock.length === 0 ? (
        displayFilter === 'active' ? (
          <EmptyState
            icon={Tractor}
            title="No livestock registered"
            description="Add your herds to start tracking."
            action={<Button onClick={() => openDialog()} variant="outline">Register Animal</Button>}
          />
        ) : (
          <EmptyState
            icon={Archive}
            title="No archived records"
            description="Archived animals will appear here."
          />
        )
      ) : viewMode === 'list' ? (
        <LivestockList
          livestock={filteredLivestock}
          fields={fields}
          onSelect={openDetails}
          onDelete={deleteAnimal}
          selectedIds={selectedAnimalIds}
          toggleSelection={toggleSelection}
          onSelectAll={handleSelectAll}
          isAllSelected={filteredLivestock.length > 0 && filteredLivestock.every(l => selectedAnimalIds.has(l.id))}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLivestock.map((animal) => {
            const locationName = fields.find(f => f.id === animal.locationId)?.name || 'Unassigned';
            const isSelected = selectedAnimalIds.has(animal.id);
            return (
              <Card
                key={animal.id}
                className={cn(
                  "group hover:shadow-lg transition-all duration-200 border-border/60 cursor-pointer relative",
                  isSelected && "border-emerald-500 bg-emerald-50/10"
                )}
                onClick={() => openDetails(animal)}
              >
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(animal.id)}
                        className={cn("transition-opacity", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                    />
                </div>
                <CardHeader className="pb-3 pl-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold group-hover:text-emerald-600 transition-colors">
                        {animal.tag}
                      </CardTitle>
                      <CardDescription className="mt-1 capitalize">
                        {animal.breed} {animal.type}
                      </CardDescription>
                    </div>
                    {displayFilter === 'active' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={(e) => deleteAnimal(animal.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={cn("capitalize font-normal border", getStatusColor(animal.status))}>
                      {animal.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{locationName}</span>
                    </div>
                  </div>
                  {animal.status === 'archived' && animal.archiveReason && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      Archived: {animal.archiveReason}
                    </div>
                  )}
                  <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <HeartPulse className="h-3 w-3" />
                    <span>Last checkup: {healthLogs.filter(l => l.livestockId === animal.id).length > 0 ? 'Recently' : 'None'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <LivestockDetailsSheet
        livestock={selectedAnimal}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        fields={fields}
        healthLogs={healthLogs.filter(l => l.livestockId === selectedAnimal?.id)}
        onUpdateLivestock={handleUpdateLivestock}
        onAddHealthLog={handleAddHealthLog}
        onDeleteHealthLog={handleDeleteHealthLog}
        onEdit={() => {
          setIsSheetOpen(false);
          openDialog(selectedAnimal!);
        }}
        allLivestock={livestock}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnimal ? 'Edit Animal Profile' : 'Register New Animal'}</DialogTitle>
            <DialogDescription>
              {editingAnimal ? 'Update details, origin, and lineage.' : 'Add a new animal or herd to your livestock registry.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag ID / Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. A-101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {livestockTypes.map(type => (
                            <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Angus" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="healthy">Healthy</SelectItem>
                          <SelectItem value="sick">Sick</SelectItem>
                          <SelectItem value="quarantine">Quarantine</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {fields.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-3">Origin & Lineage</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="born">Born on Farm</SelectItem>
                            <SelectItem value="purchased">Purchased</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{originType === 'born' ? 'Birth Date' : 'Purchase Date'}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dam (Mother)</FormLabel>
                        <FormControl>
                          <Input placeholder="Tag ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sire"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sire (Father)</FormLabel>
                        <FormControl>
                          <Input placeholder="Tag ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {editingAnimal ? 'Save Changes' : 'Register Animal'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <BulkMoveDialog
        isOpen={isBulkDialogOpen}
        onClose={() => setIsBulkDialogOpen(false)}
        onSave={handleBulkAction}
        count={selectedAnimalIds.size}
        fields={fields}
      />
      <SelectionBar
        count={selectedAnimalIds.size}
        onClear={clearSelection}
        label="animals selected"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setIsBulkDialogOpen(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" /> Move / Update
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </>
        }
      />
    </AppLayout>
  );
}