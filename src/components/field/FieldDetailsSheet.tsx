import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Sprout, Beaker, History, Tractor, Save, Plus, AlertTriangle, Layers, Lightbulb, Info, ClipboardList, Calendar } from 'lucide-react';
import type { Field, Crop, Amendment, Task } from '@shared/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getRotationSuggestions, getFieldRestRecommendation } from '@/lib/knowledge-base';
interface FieldDetailsSheetProps {
  field: Field | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Field>) => Promise<void>;
  crops: Crop[];
  allFields?: Field[];
  tasks?: Task[];
}
export function FieldDetailsSheet({ field, isOpen, onClose, onUpdate, crops, allFields = [], tasks = [] }: FieldDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  // Local state for form inputs
  const [soilData, setSoilData] = useState({
    ph: '',
    organicMatter: '',
    nitrogen: 'optimal',
    phosphorus: 'optimal',
    potassium: 'optimal',
  });
  const [grazingData, setGrazingData] = useState({
    capacity: '',
  });
  const [amendmentData, setAmendmentData] = useState({
    type: '',
    amount: '',
    unit: 'lbs',
    notes: ''
  });
  // Update local state when field changes
  React.useEffect(() => {
    if (field) {
      setSoilData({
        ph: field.soilProfile?.ph?.toString() || '',
        organicMatter: field.soilProfile?.organicMatter?.toString() || '',
        nitrogen: field.soilProfile?.nitrogen || 'optimal',
        phosphorus: field.soilProfile?.phosphorus || 'optimal',
        potassium: field.soilProfile?.potassium || 'optimal',
      });
      setGrazingData({
        capacity: field.grazingCapacity?.toString() || '',
      });
    }
  }, [field]);
  if (!field) return null;
  const handleSaveSoil = async () => {
    setIsSaving(true);
    try {
      await onUpdate(field.id, {
        soilProfile: {
          ph: Number(soilData.ph) || undefined,
          organicMatter: Number(soilData.organicMatter) || undefined,
          nitrogen: soilData.nitrogen as any,
          phosphorus: soilData.phosphorus as any,
          potassium: soilData.potassium as any,
          lastTested: Date.now(),
        }
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveGrazing = async () => {
    setIsSaving(true);
    try {
      await onUpdate(field.id, {
        grazingCapacity: Number(grazingData.capacity) || 0,
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleAddAmendment = async () => {
    if (!amendmentData.type || !amendmentData.amount) return;
    setIsSaving(true);
    try {
      const newAmendment: Amendment = {
        id: crypto.randomUUID(),
        date: Date.now(),
        type: amendmentData.type,
        amount: Number(amendmentData.amount),
        unit: amendmentData.unit,
        notes: amendmentData.notes
      };
      const currentAmendments = field.amendments || [];
      await onUpdate(field.id, {
        amendments: [...currentAmendments, newAmendment]
      });
      setAmendmentData({ type: '', amount: '', unit: 'lbs', notes: '' });
    } finally {
      setIsSaving(false);
    }
  };
  const togglePermanentBed = async (checked: boolean) => {
    await onUpdate(field.id, { isPermanentBed: checked });
  };
  const handleParentChange = async (parentId: string) => {
    if (parentId === 'none') {
      await onUpdate(field.id, { parentId: undefined });
    } else {
      await onUpdate(field.id, { parentId });
    }
  };
  const fieldCrops = crops.filter(c => c.fieldId === field.id).sort((a, b) => b.plantingDate - a.plantingDate);
  const availableParents = allFields.filter(f => f.id !== field.id); // Simple cycle prevention (self)
  const fieldTasks = tasks.filter(t => t.relatedEntityId === field.id).sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0));
  // Rotation Logic
  const lastCrop = fieldCrops[0];
  const rotationSuggestions = lastCrop ? getRotationSuggestions(lastCrop.name) : [];
  const restRecommendation = getFieldRestRecommendation(field.soilProfile);
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{field.type || 'field'}</Badge>
            <Badge variant={field.status === 'active' ? 'default' : 'secondary'}>{field.status}</Badge>
          </div>
          <SheetTitle className="text-2xl">{field.name}</SheetTitle>
          <SheetDescription>
            {field.acres} acres • {field.soilType || 'Unknown Soil'}
          </SheetDescription>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="soil">Soil</TabsTrigger>
            <TabsTrigger value="crops">Crops</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="grazing">Grazing</TabsTrigger>
          </TabsList>
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Crop</Label>
                  <div className="font-medium">{field.currentCrop || 'None'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Amendment</Label>
                  <div className="font-medium">
                    {field.amendments?.length
                      ? format(field.amendments[field.amendments.length - 1].date, 'MMM d, yyyy')
                      : 'Never'}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Soil pH</Label>
                  <div className="font-medium">{field.soilProfile?.ph || '--'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="font-medium capitalize">{field.type || 'Field'}</div>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> Parent Field / Parcel
              </Label>
              <Select
                value={field.parentId || 'none'}
                onValueChange={handleParentChange}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent field..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {availableParents.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nest this unit within a larger field (e.g., a Bed inside a Field).
              </p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Permanent Bed</Label>
                <p className="text-sm text-muted-foreground">
                  Mark this area as a no-till permanent bed system.
                </p>
              </div>
              <Switch
                checked={field.isPermanentBed}
                onCheckedChange={togglePermanentBed}
              />
            </div>
            {restRecommendation && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Soil Alert
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {restRecommendation}
                </p>
              </div>
            )}
          </TabsContent>
          {/* SOIL TAB */}
          <TabsContent value="soil" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>pH Level</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={soilData.ph}
                    onChange={(e) => setSoilData({...soilData, ph: e.target.value})}
                    placeholder="7.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organic Matter (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={soilData.organicMatter}
                    onChange={(e) => setSoilData({...soilData, organicMatter: e.target.value})}
                    placeholder="5.0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Nitrogen (N)</Label>
                  <Select value={soilData.nitrogen} onValueChange={(v) => setSoilData({...soilData, nitrogen: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="optimal">Optimal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Phosphorus (P)</Label>
                  <Select value={soilData.phosphorus} onValueChange={(v) => setSoilData({...soilData, phosphorus: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="optimal">Optimal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Potassium (K)</Label>
                  <Select value={soilData.potassium} onValueChange={(v) => setSoilData({...soilData, potassium: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="optimal">Optimal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveSoil} disabled={isSaving} className="w-full">
                {isSaving ? 'Saving...' : 'Update Soil Profile'}
              </Button>
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Beaker className="h-4 w-4" /> Amendment History
                </h4>
              </div>
              {/* Add Amendment Form */}
              <div className="bg-muted/30 p-3 rounded-lg mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Type (e.g. Compost)"
                    value={amendmentData.type}
                    onChange={(e) => setAmendmentData({...amendmentData, type: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={amendmentData.amount}
                      onChange={(e) => setAmendmentData({...amendmentData, amount: e.target.value})}
                    />
                    <Input
                      className="w-16"
                      value={amendmentData.unit}
                      onChange={(e) => setAmendmentData({...amendmentData, unit: e.target.value})}
                    />
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="w-full" onClick={handleAddAmendment} disabled={isSaving}>
                  <Plus className="h-3 w-3 mr-1" /> Log Amendment
                </Button>
              </div>
              <ScrollArea className="h-[200px]">
                {field.amendments?.length ? (
                  <div className="space-y-3">
                    {field.amendments.map((amendment) => (
                      <div key={amendment.id} className="flex justify-between items-start text-sm p-2 bg-muted/50 rounded">
                        <div>
                          <div className="font-medium">{amendment.type}</div>
                          <div className="text-xs text-muted-foreground">{format(amendment.date, 'MMM d, yyyy')}</div>
                        </div>
                        <div className="text-right">
                          <div>{amendment.amount} {amendment.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No amendments recorded.
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
          {/* CROPS TAB */}
          <TabsContent value="crops" className="mt-4 space-y-4">
            {/* Rotation Advisor */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-blue-800 dark:text-blue-300">
                  <Lightbulb className="h-4 w-4" /> Rotation Advisor
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastCrop ? (
                  <div className="space-y-3">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Last crop: <span className="font-medium">{lastCrop.name}</span> ({lastCrop.variety})
                    </p>
                    {rotationSuggestions.map((suggestion, idx) => (
                      <div key={idx} className={cn(
                        "text-sm p-2 rounded border",
                        suggestion.type === 'recommendation' ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                        suggestion.type === 'warning' ? "bg-amber-50 border-amber-200 text-amber-800" :
                        "bg-white border-slate-200 text-slate-700"
                      )}>
                        <div className="font-medium flex items-center gap-2">
                          {suggestion.type === 'warning' ? <AlertTriangle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                          {suggestion.message}
                        </div>
                        <div className="text-xs mt-1 opacity-90">{suggestion.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No crop history found. Start by planting a crop to get rotation suggestions.
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" /> Rotation History
              </h4>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {fieldCrops.length > 0 ? (
                  fieldCrops.map((crop, index) => (
                    <div key={crop.id} className="relative pl-6 pb-6 border-l last:border-0">
                      <div className={cn(
                        "absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full border-2 bg-background",
                        index === 0 ? "border-emerald-500" : "border-muted-foreground"
                      )} />
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-sm">{crop.name}</h5>
                          <p className="text-xs text-muted-foreground">{crop.variety}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{crop.status}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {format(crop.plantingDate, 'MMM yyyy')} - {format(crop.estimatedHarvestDate, 'MMM yyyy')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No crop history available.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          {/* TASKS TAB */}
          <TabsContent value="tasks" className="mt-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Operational History
              </h4>
            </div>
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4 space-y-3">
                {fieldTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks linked to this field.
                  </div>
                )}
                {fieldTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("font-medium truncate", task.status === 'done' && "line-through text-muted-foreground")}>
                          {task.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(task.dueDate, 'MMM d')}
                          </span>
                        )}
                        <span>•</span>
                        <span className="capitalize">{task.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          {/* GRAZING TAB */}
          <TabsContent value="grazing" className="mt-4 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Grazing Capacity (Max Animals)</Label>
                <Input
                  type="number"
                  value={grazingData.capacity}
                  onChange={(e) => setGrazingData({...grazingData, capacity: e.target.value})}
                  placeholder="e.g. 10"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended stocking rate for {field.acres} acres based on soil quality.
                </p>
              </div>
              <Button onClick={handleSaveGrazing} disabled={isSaving} className="w-full">
                Update Capacity
              </Button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Tractor className="h-4 w-4" />
                Pasture Management
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                This field requires a 21-day rest period after grazing to ensure optimal regrowth.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}