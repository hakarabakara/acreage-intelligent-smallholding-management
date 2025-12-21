import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Plus, Sprout, Calendar, MapPin, Loader2, Trash2, Scale, Leaf, BookOpen, Upload, TreeDeciduous, Edit, Bug, Search, LayoutGrid, List, CheckCircle2, Circle } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Crop, Field, HarvestLog, Task, CropVariety, Contact, InventoryItem, InventoryCategory } from '@shared/types';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { HarvestDialog } from '@/components/crop/HarvestDialog';
import { PlantingDialog } from '@/components/crop/PlantingDialog';
import { CropDetailsSheet } from '@/components/crop/CropDetailsSheet';
import { CropImportDialog } from '@/components/crop/CropImportDialog';
import { CropVarietyDialog } from '@/components/crop/CropVarietyDialog';
import { CropTimeline } from '@/components/crop/CropTimeline';
import { CropDiagnostics } from '@/components/crop/CropDiagnostics';
import { CropList } from '@/components/crop/CropList';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/ui/empty-state';
import { SelectionBar } from '@/components/ui/selection-bar';
export function CropsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [harvests, setHarvests] = useState<HarvestLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // View State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedCropIds, setSelectedCropIds] = useState<Set<string>>(new Set());
  // Dialog States
  const [isPlantingOpen, setIsPlantingOpen] = useState(false);
  const [isHarvestOpen, setIsHarvestOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isVarietyDialogOpen, setIsVarietyDialogOpen] = useState(false);
  // Selection States
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<CropVariety | null>(null);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cropsRes, fieldsRes, harvestsRes, tasksRes, varietiesRes, contactsRes, invRes, catsRes] = await Promise.all([
        api<{ items: Crop[] }>('/api/crops'),
        api<{ items: Field[] }>('/api/fields'),
        api<{ items: HarvestLog[] }>('/api/harvests'),
        api<{ items: Task[] }>('/api/tasks'),
        api<{ items: CropVariety[] }>('/api/crop-varieties'),
        api<{ items: Contact[] }>('/api/contacts'),
        api<{ items: InventoryItem[] }>('/api/inventory'),
        api<{ items: InventoryCategory[] }>('/api/inventory-categories')
      ]);
      setCrops(cropsRes.items);
      setFields(fieldsRes.items);
      setHarvests(harvestsRes.items.sort((a, b) => b.date - a.date));
      setTasks(tasksRes.items);
      setVarieties(varietiesRes.items);
      setContacts(contactsRes.items);
      setInventoryItems(invRes.items);
      setInventoryCategories(catsRes.items);
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
    if (!isLoading && crops.length > 0) {
      const cropId = searchParams.get('cropId');
      if (cropId) {
        const crop = crops.find(c => c.id === cropId);
        if (crop) {
          openDetails(crop);
        }
      }
    }
  }, [isLoading, crops, searchParams]);
  const handlePlantingSave = async (
    newCrops: Partial<Crop>[],
    newTasks: Partial<Task>[],
    inputs: { inventoryId: string, amount: number }[]
  ) => {
    try {
      const createdCrops: Crop[] = [];
      for (const cropData of newCrops) {
        const created = await api<Crop>('/api/crops', {
          method: 'POST',
          body: JSON.stringify(cropData),
        });
        createdCrops.push(created);
      }
      for (const taskData of newTasks) {
        await api('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(taskData),
        });
      }
      if (inputs.length > 0) {
        let deductedCount = 0;
        for (const input of inputs) {
          const item = inventoryItems.find(i => i.id === input.inventoryId);
          if (item) {
            const newQuantity = Math.max(0, item.quantity - input.amount);
            await api(`/api/inventory/${item.id}`, {
              method: 'PUT',
              body: JSON.stringify({ quantity: newQuantity })
            });
            deductedCount++;
          }
        }
        if (deductedCount > 0) {
          toast.success(`Updated stock for ${deductedCount} items`);
        }
      }
      toast.success(`Created ${createdCrops.length} crops and ${newTasks.length} tasks`);
      fetchData();
    } catch (error) {
      toast.error('Failed to save planting plan');
      console.error(error);
    }
  };
  const deleteCrop = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this crop?')) return;
    try {
      await api(`/api/crops/${id}`, { method: 'DELETE' });
      setCrops(prev => prev.filter(c => c.id !== id));
      toast.success('Crop record deleted');
      if (selectedCrop?.id === id) setIsDetailsOpen(false);
    } catch (error) {
      toast.error('Failed to delete crop');
    }
  };
  const handleHarvestSave = async (data: any) => {
    if (!selectedCrop) return;
    try {
      await api('/api/harvests', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          cropId: selectedCrop.id,
          date: new Date(data.date).getTime(),
          amount: Number(data.amount),
        }),
      });
      toast.success('Harvest logged');
      setIsHarvestOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to log harvest');
    }
  };
  const handleUpdateCrop = async (id: string, data: Partial<Crop>) => {
    try {
      const updated = await api<Crop>(`/api/crops/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setCrops(prev => prev.map(c => c.id === id ? updated : c));
      setSelectedCrop(updated);
      toast.success('Crop updated');
    } catch (error) {
      toast.error('Failed to update crop');
    }
  };
  const handleImportVarieties = async (newVarieties: Partial<CropVariety>[]) => {
    try {
      const created = await api<CropVariety[]>('/api/crop-varieties/bulk', {
        method: 'POST',
        body: JSON.stringify(newVarieties),
      });
      setVarieties(prev => [...prev, ...created]);
      toast.success(`Imported ${created.length} varieties`);
    } catch (error) {
      toast.error('Failed to import varieties');
    }
  };
  const handleSaveVariety = async (data: Partial<CropVariety>) => {
    try {
      if (selectedVariety) {
        const updated = await api<CropVariety>(`/api/crop-varieties/${selectedVariety.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setVarieties(prev => prev.map(v => v.id === updated.id ? updated : v));
        toast.success('Variety updated');
      } else {
        const created = await api<CropVariety>('/api/crop-varieties', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setVarieties(prev => [...prev, created]);
        toast.success('Variety created');
      }
      setIsVarietyDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save variety');
    }
  };
  const deleteVariety = async (id: string) => {
    if (!confirm('Delete this variety template?')) return;
    try {
      await api(`/api/crop-varieties/${id}`, { method: 'DELETE' });
      setVarieties(prev => prev.filter(v => v.id !== id));
      toast.success('Variety deleted');
    } catch (error) {
      toast.error('Failed to delete variety');
    }
  };
  // Bulk Actions
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedCropIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCropIds(newSet);
  };
  const clearSelection = () => {
    setSelectedCropIds(new Set());
  };
  const handleSelectAll = (ids: string[]) => {
    if (ids.length === 0) {
      clearSelection();
    } else {
      setSelectedCropIds(new Set(ids));
    }
  };
  const handleBulkAction = async (action: 'delete' | 'update', data?: any) => {
    if (selectedCropIds.size === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selectedCropIds.size} crops?`)) return;
    try {
      const ids = Array.from(selectedCropIds);
      await api('/api/crops/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action, data })
      });
      if (action === 'delete') {
        setCrops(prev => prev.filter(c => !selectedCropIds.has(c.id)));
        toast.success(`Deleted ${ids.length} crops`);
      } else if (action === 'update') {
        setCrops(prev => prev.map(c => selectedCropIds.has(c.id) ? { ...c, ...data } : c));
        toast.success(`Updated ${ids.length} crops`);
      }
      clearSelection();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };
  const openVarietyDialog = (variety?: CropVariety) => {
    setSelectedVariety(variety || null);
    setIsVarietyDialogOpen(true);
  };
  const openHarvestDialog = (crop: Crop, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCrop(crop);
    setIsHarvestOpen(true);
  };
  const openDetails = (crop: Crop) => {
    setSelectedCrop(crop);
    setIsDetailsOpen(true);
  };
  const getProgress = (start: number, end: number) => {
    const total = end - start;
    const elapsed = Date.now() - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };
  const getDaysRemaining = (end: number) => {
    const days = differenceInDays(end, Date.now());
    if (days < 0) return 'Ready for harvest';
    return `${days} days left`;
  };
  // Filtering
  const filteredCrops = useMemo(() => {
    return crops.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.variety.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [crops, searchQuery]);
  const seasonalCrops = filteredCrops.filter(c => c.status !== 'harvested' && c.classification !== 'long-term');
  const perennialCrops = filteredCrops.filter(c => c.classification === 'long-term');
  return (
    <AppLayout
      title="Crop Operations"
      actions={
        <Button onClick={() => setIsPlantingOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Plan New Crop
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <TabsList>
              <TabsTrigger value="active">Seasonal</TabsTrigger>
              <TabsTrigger value="perennials">Perennials</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="harvests">Harvest Log</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="diagnostics" className="flex items-center gap-2"><Bug className="h-3 w-3" /> Diagnostics</TabsTrigger>
            </TabsList>
            {(activeTab === 'active' || activeTab === 'perennials') && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search crops..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
                  <ToggleGroupItem value="grid" aria-label="Grid View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List View"><List className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
          </div>
          {/* ACTIVE SEASONAL PLANTINGS */}
          <TabsContent value="active">
            {seasonalCrops.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No active seasonal crops"
                description="Start by planning your first planting."
                action={<Button onClick={() => setIsPlantingOpen(true)} variant="outline">Plan Crop</Button>}
              />
            ) : viewMode === 'list' ? (
              <CropList
                crops={seasonalCrops}
                fields={fields}
                onSelectCrop={openDetails}
                onHarvest={openHarvestDialog}
                onDelete={deleteCrop}
                selectedIds={selectedCropIds}
                toggleSelection={toggleSelection}
                onSelectAll={handleSelectAll}
                isAllSelected={seasonalCrops.length > 0 && seasonalCrops.every(c => selectedCropIds.has(c.id))}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seasonalCrops.map((crop) => {
                  const fieldName = fields.find(f => f.id === crop.fieldId)?.name || 'Unknown Field';
                  const progress = getProgress(crop.plantingDate, crop.estimatedHarvestDate);
                  return (
                    <Card
                      key={crop.id}
                      className="group hover:shadow-lg transition-all duration-200 border-border/60 cursor-pointer"
                      onClick={() => openDetails(crop)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold group-hover:text-emerald-600 transition-colors">
                              {crop.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {crop.variety}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                              onClick={(e) => openHarvestDialog(crop, e)}
                              title="Log Harvest"
                            >
                              <Scale className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={(e) => deleteCrop(crop.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{fieldName}</span>
                          </div>
                          <Badge variant="outline" className={cn(
                            "capitalize",
                            crop.status === 'growing' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {crop.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Planted {format(crop.plantingDate, 'MMM d')}</span>
                            <span>{getDaysRemaining(crop.estimatedHarvestDate)}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Harvest: {format(crop.estimatedHarvestDate, 'MMM d')}</span>
                          </div>
                          {crop.expectedYield && (
                            <div className="flex items-center gap-1">
                              <Leaf className="h-3 w-3" />
                              <span>Est: {crop.expectedYield} {crop.yieldUnit}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          {/* PERENNIALS / LONG-TERM */}
          <TabsContent value="perennials">
            {perennialCrops.length === 0 ? (
              <EmptyState
                icon={TreeDeciduous}
                title="No long-term crops"
                description="Track orchards, vineyards, and perennial beds here."
                action={<Button onClick={() => setIsPlantingOpen(true)} variant="outline">Add Perennial</Button>}
              />
            ) : viewMode === 'list' ? (
              <CropList
                crops={perennialCrops}
                fields={fields}
                onSelectCrop={openDetails}
                onHarvest={openHarvestDialog}
                onDelete={deleteCrop}
                selectedIds={selectedCropIds}
                toggleSelection={toggleSelection}
                onSelectAll={handleSelectAll}
                isAllSelected={perennialCrops.length > 0 && perennialCrops.every(c => selectedCropIds.has(c.id))}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {perennialCrops.map((crop) => {
                  const fieldName = fields.find(f => f.id === crop.fieldId)?.name || 'Unknown Field';
                  const ageYears = differenceInDays(Date.now(), crop.plantingDate) / 365;
                  return (
                    <Card
                      key={crop.id}
                      className="group hover:shadow-lg transition-all duration-200 border-border/60 cursor-pointer"
                      onClick={() => openDetails(crop)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                              {crop.name}
                              <Badge variant="secondary" className="text-[10px] h-5">Perennial</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {crop.variety}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                              onClick={(e) => openHarvestDialog(crop, e)}
                              title="Log Harvest"
                            >
                              <Scale className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={(e) => deleteCrop(crop.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{fieldName}</span>
                          </div>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Active
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-2 bg-muted/30 rounded-lg text-center">
                          <div>
                            <div className="text-xs text-muted-foreground">Age</div>
                            <div className="font-medium">{ageYears.toFixed(1)} years</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Lifespan</div>
                            <div className="font-medium">{crop.expectedLifespan || '?'} years</div>
                          </div>
                        </div>
                        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Planted: {format(crop.plantingDate, 'MMM yyyy')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          {/* PLANNING CALENDAR */}
          <TabsContent value="planning">
            <CropTimeline crops={crops} onSelectCrop={openDetails} />
          </TabsContent>
          {/* HARVEST LOG */}
          <TabsContent value="harvests">
            <Card>
              <CardHeader>
                <CardTitle>Harvest Records</CardTitle>
                <CardDescription>History of all yields collected</CardDescription>
              </CardHeader>
              <CardContent>
                {harvests.length === 0 ? (
                  <EmptyState
                    icon={Scale}
                    title="No harvests recorded"
                    description="Harvest logs will appear here once recorded."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Crop</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead className="text-right">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {harvests.map((log) => {
                        const crop = crops.find(c => c.id === log.cropId);
                        return (
                          <TableRow key={log.id}>
                            <TableCell>{format(log.date, 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <div className="font-medium">{crop?.name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{crop?.variety}</div>
                            </TableCell>
                            <TableCell className="font-medium">{log.amount} {log.unit}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn(
                                log.quality === 'A' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                log.quality === 'B' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-gray-50 text-gray-700 border-gray-200"
                              )}>
                                Grade {log.quality}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground max-w-[200px] truncate">
                              {log.notes || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* CROP LIBRARY */}
          <TabsContent value="library">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Crop Library</h3>
                <p className="text-sm text-muted-foreground">Manage reusable crop templates and task schedules.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Import CSV
                </Button>
                <Button onClick={() => openVarietyDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Add Variety
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {varieties.map((variety) => (
                <Card key={variety.id} className="group hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{variety.name}</CardTitle>
                          <CardDescription>{variety.variety}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500" onClick={() => openVarietyDialog(variety)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => deleteVariety(variety.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Maturity:</span>
                      <span className="font-medium">{variety.daysToMaturity} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium capitalize">{variety.plantingMethod || 'Any'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasks:</span>
                      <span className="font-medium">{variety.defaultTasks?.length || 0} defined</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {varieties.length === 0 && (
                <div className="col-span-full">
                  <EmptyState
                    icon={BookOpen}
                    title="Library is empty"
                    description="Import varieties to speed up your planning."
                    action={<Button onClick={() => setIsImportOpen(true)}>Import CSV</Button>}
                  />
                </div>
              )}
            </div>
          </TabsContent>
          {/* DIAGNOSTICS TAB */}
          <TabsContent value="diagnostics">
            <CropDiagnostics />
          </TabsContent>
        </Tabs>
      )}
      <SelectionBar
        count={selectedCropIds.size}
        onClear={clearSelection}
        label="crops selected"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => handleBulkAction('update', { status: 'harvested' })}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Harvested
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkAction('update', { status: 'growing' })}>
              <Circle className="h-4 w-4 mr-2" /> Mark Growing
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </>
        }
      />
      <PlantingDialog
        isOpen={isPlantingOpen}
        onClose={() => setIsPlantingOpen(false)}
        onSave={handlePlantingSave}
        fields={fields}
        varieties={varieties}
        contacts={contacts}
        inventory={inventoryItems}
        crops={crops}
      />
      <HarvestDialog
        crop={selectedCrop}
        isOpen={isHarvestOpen}
        onClose={() => setIsHarvestOpen(false)}
        onSave={handleHarvestSave}
        inventory={inventoryItems}
        categories={inventoryCategories}
      />
      <CropDetailsSheet
        crop={selectedCrop}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdate={handleUpdateCrop}
        tasks={tasks}
        harvests={harvests.filter(h => h.cropId === selectedCrop?.id)}
        contacts={contacts}
      />
      <CropImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportVarieties}
      />
      <CropVarietyDialog
        isOpen={isVarietyDialogOpen}
        onClose={() => setIsVarietyDialogOpen(false)}
        onSave={handleSaveVariety}
        variety={selectedVariety}
      />
    </AppLayout>
  );
}