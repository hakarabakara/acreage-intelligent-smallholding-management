import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Sprout, Calendar, MapPin, Loader2, Trash2, Scale, Leaf, MoreHorizontal, BookOpen, Upload, TreeDeciduous } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Crop, Field, HarvestLog, Task, CropVariety, Contact } from '@shared/types';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { HarvestDialog } from '@/components/crop/HarvestDialog';
import { PlantingDialog } from '@/components/crop/PlantingDialog';
import { CropDetailsSheet } from '@/components/crop/CropDetailsSheet';
import { CropImportDialog } from '@/components/crop/CropImportDialog';
export function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [harvests, setHarvests] = useState<HarvestLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Dialog States
  const [isPlantingOpen, setIsPlantingOpen] = useState(false);
  const [isHarvestOpen, setIsHarvestOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  // Selection States
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cropsRes, fieldsRes, harvestsRes, tasksRes, varietiesRes, contactsRes] = await Promise.all([
        api<{ items: Crop[] }>('/api/crops'),
        api<{ items: Field[] }>('/api/fields'),
        api<{ items: HarvestLog[] }>('/api/harvests'),
        api<{ items: Task[] }>('/api/tasks'),
        api<{ items: CropVariety[] }>('/api/crop-varieties'),
        api<{ items: Contact[] }>('/api/contacts')
      ]);
      setCrops(cropsRes.items);
      setFields(fieldsRes.items);
      setHarvests(harvestsRes.items.sort((a, b) => b.date - a.date));
      setTasks(tasksRes.items);
      setVarieties(varietiesRes.items);
      setContacts(contactsRes.items);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handlePlantingSave = async (newCrops: Partial<Crop>[], newTasks: Partial<Task>[]) => {
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
      toast.success(`Created ${createdCrops.length} crops and ${newTasks.length} tasks`);
      fetchData();
    } catch (error) {
      toast.error('Failed to save planting plan');
      console.error(error);
    }
  };
  const deleteCrop = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
  const getProgress = (start: number, end: number) => {
    const total = end - start;
    const elapsed = Date.now() - start;
    const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return percent;
  };
  const getDaysRemaining = (end: number) => {
    const days = differenceInDays(end, Date.now());
    if (days < 0) return 'Ready for harvest';
    return `${days} days left`;
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
  const seasonalCrops = crops.filter(c => c.status !== 'harvested' && c.classification !== 'long-term');
  const perennialCrops = crops.filter(c => c.classification === 'long-term');
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
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Seasonal</TabsTrigger>
            <TabsTrigger value="perennials">Perennials / Long-term</TabsTrigger>
            <TabsTrigger value="planning">Planning Calendar</TabsTrigger>
            <TabsTrigger value="harvests">Harvest Log</TabsTrigger>
            <TabsTrigger value="library">Crop Library</TabsTrigger>
          </TabsList>
          {/* ACTIVE SEASONAL PLANTINGS */}
          <TabsContent value="active">
            {seasonalCrops.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed">
                <Sprout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No active seasonal crops</h3>
                <p className="text-muted-foreground mb-4">Start by planning your first planting.</p>
                <Button onClick={() => setIsPlantingOpen(true)} variant="outline">Plan Crop</Button>
              </div>
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
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed">
                <TreeDeciduous className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No long-term crops</h3>
                <p className="text-muted-foreground mb-4">Track orchards, vineyards, and perennial beds here.</p>
                <Button onClick={() => setIsPlantingOpen(true)} variant="outline">Add Perennial</Button>
              </div>
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
            <Card>
              <CardHeader>
                <CardTitle>Planting Schedule</CardTitle>
                <CardDescription>Timeline of all crops and successions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 relative pl-4 border-l-2 border-muted">
                  {crops.sort((a, b) => a.plantingDate - b.plantingDate).map((crop) => (
                    <div key={crop.id} className="relative pl-6 group cursor-pointer" onClick={() => openDetails(crop)}>
                      <div className={cn(
                        "absolute left-[-9px] top-1 h-4 w-4 rounded-full border-2 bg-background transition-colors",
                        crop.status === 'harvested' ? "border-gray-400" : "border-emerald-500 group-hover:bg-emerald-100"
                      )} />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm group-hover:text-emerald-600 transition-colors">{crop.name} <span className="text-muted-foreground font-normal">- {crop.variety}</span></h4>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Plant: {format(crop.plantingDate, 'MMM d')}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {fields.find(f => f.id === crop.fieldId)?.name} • {crop.plantingMethod || 'Direct'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                  <div className="text-center py-8 text-muted-foreground">No harvests recorded yet.</div>
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
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => deleteVariety(variety.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                <div className="col-span-full text-center py-12 border border-dashed rounded-lg">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">Library is empty</h3>
                  <p className="text-muted-foreground mb-4">Import varieties to speed up your planning.</p>
                  <Button onClick={() => setIsImportOpen(true)}>Import CSV</Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
      <PlantingDialog
        isOpen={isPlantingOpen}
        onClose={() => setIsPlantingOpen(false)}
        onSave={handlePlantingSave}
        fields={fields}
        varieties={varieties}
        contacts={contacts}
      />
      <HarvestDialog
        crop={selectedCrop}
        isOpen={isHarvestOpen}
        onClose={() => setIsHarvestOpen(false)}
        onSave={handleHarvestSave}
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
    </AppLayout>
  );
}