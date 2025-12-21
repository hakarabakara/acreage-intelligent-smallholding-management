import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Sprout, Calendar, Calculator, ListTodo, ArrowRight, ArrowLeft, Check, BookOpen, Info, HelpCircle, Package, DollarSign, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { addDays, format } from 'date-fns';
import type { Field, Crop, Task, CropVariety, Contact, InventoryItem } from '@shared/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { validateRotation } from '@/lib/knowledge-base';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
const plantingSchema = z.object({
  name: z.string().min(2, 'Name required'),
  variety: z.string().optional(),
  fieldId: z.string().min(1, 'Field required'),
  plantingDate: z.string().min(1, 'Date required'),
  daysToMaturity: z.string().optional(),
  plantingMethod: z.enum(['direct', 'transplant']),
  classification: z.enum(['seasonal', 'long-term']),
  expectedLifespan: z.string().optional(),
  primaryPurpose: z.string().optional(),
  // Spacing
  plantSpacing: z.string().optional(),
  rowSpacing: z.string().optional(),
  rowsPerBed: z.string().optional(),
  // Succession
  successionCount: z.string().optional(),
  successionInterval: z.string().optional(),
  // Financials
  cost: z.string().optional(),
  contactId: z.string().optional(),
  // Inputs & Labor
  inputs: z.array(z.object({
    inventoryId: z.string().min(1, 'Item required'),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be positive'),
  })).optional(),
  laborHours: z.string().optional(),
  hourlyRate: z.string().optional(),
});
type PlantingFormValues = z.infer<typeof plantingSchema>;
interface PlantingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (crops: Partial<Crop>[], tasks: Partial<Task>[], inputs: { inventoryId: string, amount: number }[]) => Promise<void>;
  fields: Field[];
  varieties?: CropVariety[];
  contacts?: Contact[];
  inventory?: InventoryItem[];
  crops?: Crop[];
}
export function PlantingDialog({ isOpen, onClose, onSave, fields, varieties = [], contacts = [], inventory = [], crops = [] }: PlantingDialogProps) {
  const [step, setStep] = useState(1);
  const [generatedTasks, setGeneratedTasks] = useState<{ type: string; offset: number; selected: boolean }[]>([
    { type: 'Sow / Seed', offset: 0, selected: true },
    { type: 'Transplant', offset: 21, selected: false },
    { type: 'Thin', offset: 14, selected: true },
    { type: 'Weed', offset: 28, selected: true },
    { type: 'Harvest', offset: 60, selected: true },
    { type: 'Post-Harvest / Storage', offset: 61, selected: true },
  ]);
  const form = useForm<PlantingFormValues>({
    resolver: zodResolver(plantingSchema),
    defaultValues: {
      name: '',
      variety: '',
      fieldId: '',
      plantingDate: format(new Date(), 'yyyy-MM-dd'),
      daysToMaturity: '60',
      plantingMethod: 'direct',
      classification: 'seasonal',
      expectedLifespan: '',
      primaryPurpose: '',
      plantSpacing: '12',
      rowSpacing: '18',
      rowsPerBed: '1',
      successionCount: '1',
      successionInterval: '14',
      cost: '',
      contactId: '',
      inputs: [],
      laborHours: '0',
      hourlyRate: '15',
    },
  });
  const { fields: inputFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inputs',
  });
  const classification = form.watch('classification');
  const daysToMaturity = form.watch('daysToMaturity');
  const selectedFieldId = form.watch('fieldId');
  const cropName = form.watch('name');
  // Rotation Validation Logic
  const rotationAlert = useMemo(() => {
    if (!selectedFieldId || !cropName || !crops.length) return null;
    // Find most recent crop for this field
    const fieldCrops = crops
        .filter(c => c.fieldId === selectedFieldId)
        .sort((a, b) => b.plantingDate - a.plantingDate);
    const lastCrop = fieldCrops[0];
    if (!lastCrop) return null;
    return validateRotation(lastCrop.name, cropName);
  }, [selectedFieldId, cropName, crops]);
  React.useEffect(() => {
    const maturity = Number(daysToMaturity) || 60;
    setGeneratedTasks(prev => prev.map(t => {
      if (t.type === 'Harvest') return { ...t, offset: maturity };
      if (t.type.startsWith('Post-Harvest')) return { ...t, offset: maturity + 1 };
      return t;
    }));
  }, [daysToMaturity]);
  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) setStep(s => s + 1);
  };
  const handleBack = () => setStep(s => s - 1);
  const calculateDensity = () => {
    const ps = Number(form.getValues('plantSpacing')) || 12;
    const rs = Number(form.getValues('rowSpacing')) || 18;
    const rows = Number(form.getValues('rowsPerBed')) || 1;
    const plantsPerFoot = 12 / ps;
    const totalPlants = Math.round(plantsPerFoot * 100 * rows);
    return totalPlants;
  };
  const calculateTotalCost = () => {
    const inputs = form.getValues('inputs') || [];
    const laborHours = Number(form.getValues('laborHours')) || 0;
    const hourlyRate = Number(form.getValues('hourlyRate')) || 0;
    const materialCost = inputs.reduce((sum, input) => {
      const item = inventory.find(i => i.id === input.inventoryId);
      const cost = item?.unitCost || 0;
      return sum + (cost * (Number(input.amount) || 0));
    }, 0);
    const laborCost = laborHours * hourlyRate;
    return materialCost + laborCost;
  };
  const handleLoadTemplate = (varietyId: string) => {
    const template = varieties.find(v => v.id === varietyId);
    if (!template) return;
    form.setValue('name', template.name);
    form.setValue('variety', template.variety);
    form.setValue('daysToMaturity', template.daysToMaturity.toString());
    if (template.plantingMethod) {
      form.setValue('plantingMethod', template.plantingMethod);
    }
    if (template.defaultTasks && template.defaultTasks.length > 0) {
      const newTasks = template.defaultTasks.map(t => ({
        type: t.type,
        offset: t.dayOffset,
        selected: true
      }));
      if (!newTasks.some(t => t.type === 'Harvest')) {
        newTasks.push({ type: 'Harvest', offset: template.daysToMaturity, selected: true });
      }
      setGeneratedTasks(newTasks);
    }
  };
  const onSubmit = async (data: PlantingFormValues) => {
    const cropsToCreate: Partial<Crop>[] = [];
    const tasksToCreate: Partial<Task>[] = [];
    const count = Number(data.successionCount) || 1;
    const interval = Number(data.successionInterval) || 14;
    const maturity = Number(data.daysToMaturity) || 60;
    const baseDate = new Date(data.plantingDate);
    const totalCalculatedCost = calculateTotalCost();
    const finalCost = data.cost ? Number(data.cost) : (totalCalculatedCost > 0 ? totalCalculatedCost : undefined);
    for (let i = 0; i < count; i++) {
      const plantingDate = addDays(baseDate, i * interval);
      const harvestDate = addDays(plantingDate, maturity);
      const crop: Partial<Crop> = {
        name: data.name,
        variety: data.variety,
        fieldId: data.fieldId,
        plantingDate: plantingDate.getTime(),
        estimatedHarvestDate: harvestDate.getTime(),
        status: 'planted',
        daysToMaturity: maturity,
        plantingMethod: data.plantingMethod as any,
        classification: data.classification,
        expectedLifespan: data.classification === 'long-term' ? Number(data.expectedLifespan) : undefined,
        primaryPurpose: data.classification === 'long-term' ? data.primaryPurpose : undefined,
        spacing: {
          plantSpacing: Number(data.plantSpacing) || 0,
          rowSpacing: Number(data.rowSpacing) || 0,
          rowsPerBed: Number(data.rowsPerBed) || 1,
        },
        cost: finalCost,
        contactId: data.contactId || undefined,
      };
      cropsToCreate.push(crop);
      generatedTasks.filter(t => t.selected).forEach(t => {
        const dueDate = addDays(plantingDate, t.offset);
        tasksToCreate.push({
          title: `${t.type}: ${data.name} ${data.variety ? `(${data.variety})` : ''} #${i + 1}`,
          status: 'todo',
          priority: 'medium',
          dueDate: dueDate.getTime(),
        });
      });
    }
    const inputsToProcess = (data.inputs || []).map(i => ({
      inventoryId: i.inventoryId,
      amount: Number(i.amount)
    }));
    await onSave(cropsToCreate, tasksToCreate, inputsToProcess);
    onClose();
    setStep(1);
    form.reset();
  };
  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Planting Wizard</DialogTitle>
            <DialogDescription>Plan your crops, successions, and tasks in one go.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`h-2 w-8 rounded-full transition-colors ${s <= step ? 'bg-emerald-600' : 'bg-muted'}`} />
              ))}
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* STEP 1: BASICS */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  {varieties.length > 0 && (
                    <div className="bg-muted/30 p-3 rounded-lg border mb-4">
                      <Label className="text-xs text-muted-foreground mb-1 block">Load from Library</Label>
                      <Select onValueChange={handleLoadTemplate}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {varieties.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name} - {v.variety}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                    <Sprout className="h-5 w-5" />
                    <h3 className="font-semibold">Crop Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Crop Name</FormLabel><FormControl><Input placeholder="e.g. Lettuce" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="variety" render={({ field }) => (
                      <FormItem><FormLabel>Variety</FormLabel><FormControl><Input placeholder="e.g. Buttercrunch" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="fieldId" render={({ field }) => (
                      <FormItem><FormLabel>Field</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger></FormControl>
                          <SelectContent>{fields.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="classification" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Type
                          <Tooltip>
                            <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                            <TooltipContent>Seasonal crops are replanted annually. Long-term crops (perennials) last multiple years.</TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="seasonal">Seasonal (Annual)</SelectItem>
                            <SelectItem value="long-term">Long-term (Perennial)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {rotationAlert && rotationAlert.status !== 'neutral' && (
                    <Alert className={cn(
                      "mt-2",
                      rotationAlert.status === 'warning' ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                    )}>
                      {rotationAlert.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      <AlertTitle className={rotationAlert.status === 'warning' ? "text-amber-800 dark:text-amber-400" : "text-emerald-800 dark:text-emerald-400"}>
                        {rotationAlert.status === 'warning' ? 'Rotation Warning' : 'Rotation Recommendation'}
                      </AlertTitle>
                      <AlertDescription className={rotationAlert.status === 'warning' ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>
                        {rotationAlert.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="plantingDate" render={({ field }) => (
                      <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    {classification === 'long-term' ? (
                      <FormField control={form.control} name="expectedLifespan" render={({ field }) => (
                        <FormItem><FormLabel>Expected Lifespan (Years)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    ) : (
                      <FormField control={form.control} name="daysToMaturity" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Days to Maturity
                            <Tooltip>
                              <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                              <TooltipContent>Determines the estimated harvest date automatically.</TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl><FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>
                  {classification === 'long-term' && (
                    <FormField control={form.control} name="primaryPurpose" render={({ field }) => (
                      <FormItem><FormLabel>Primary Purpose</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="timber">Timber</SelectItem>
                            <SelectItem value="fruit">Fruit</SelectItem>
                            <SelectItem value="nuts">Nuts</SelectItem>
                            <SelectItem value="sap">Sap / Syrup</SelectItem>
                            <SelectItem value="ornamental">Ornamental</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              )}
              {/* STEP 2: SPACING */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                    <Calculator className="h-5 w-5" />
                    <h3 className="font-semibold">Spacing Calculator</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="plantSpacing" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          In-Row (in)
                          <Tooltip>
                            <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                            <TooltipContent>Distance between plants in the same row.</TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="rowSpacing" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Between Rows (in)
                          <Tooltip>
                            <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                            <TooltipContent>Distance between parallel rows in the bed.</TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="rowsPerBed" render={({ field }) => (
                      <FormItem><FormLabel>Rows / Bed</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Est. Plants per 100ft Bed:</span>
                        <span className="text-2xl font-bold text-emerald-600">{calculateDensity()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Density Calculation: Based on standard 100ft bed length. Adjust rows per bed and spacing to optimize yield.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              {/* STEP 3: INPUTS & COSTS */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                    <DollarSign className="h-5 w-5" />
                    <h3 className="font-semibold">Inputs & Costs</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Material Inputs (Seeds, Fertilizer)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ inventoryId: '', amount: '' })}>
                        <Plus className="h-3 w-3 mr-1" /> Add Input
                      </Button>
                    </div>
                    <ScrollArea className="h-[150px] border rounded-md p-2">
                      {inputFields.map((field, index) => {
                        const selectedItem = inventory.find(i => i.id === form.getValues(`inputs.${index}.inventoryId`));
                        const cost = selectedItem?.unitCost ? selectedItem.unitCost * (Number(form.getValues(`inputs.${index}.amount`)) || 0) : 0;
                        return (
                          <div key={field.id} className="flex gap-2 items-start mb-2">
                            <FormField
                              control={form.control}
                              name={`inputs.${index}.inventoryId`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      {inventory.map(i => (
                                        <SelectItem key={i.id} value={i.id}>
                                          {i.name} ({i.quantity} {i.unit}) {i.unitCost ? `- ${i.unitCost}/unit` : ''}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`inputs.${index}.amount`}
                              render={({ field }) => (
                                <FormItem className="w-24">
                                  <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="w-20 pt-2 text-sm text-right text-muted-foreground">
                              ${cost.toFixed(2)}
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        );
                      })}
                      {inputFields.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">No inputs added.</div>
                      )}
                    </ScrollArea>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <FormField control={form.control} name="laborHours" render={({ field }) => (
                        <FormItem><FormLabel>Est. Labor Hours</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="hourlyRate" render={({ field }) => (
                        <FormItem><FormLabel>Hourly Rate ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center">
                      <span className="font-medium">Total Estimated Cost:</span>
                      <span className="text-xl font-bold text-emerald-600">${calculateTotalCost().toFixed(2)}</span>
                    </div>
                    <FormField control={form.control} name="cost" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Override Total Cost (Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="Manual override..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}
              {/* STEP 4: SUCCESSION */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                    <Calendar className="h-5 w-5" />
                    <h3 className="font-semibold">Succession Planning</h3>
                  </div>
                  {classification === 'long-term' ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Succession planning is typically for seasonal crops. You can skip this step for perennials.
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900 mb-4">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-1">
                          <Info className="h-4 w-4" /> Why Succession Planting?
                        </h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Succession planting ensures a continuous harvest by staggering plantings over time, rather than harvesting everything at once.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="successionCount" render={({ field }) => (
                          <FormItem><FormLabel>Number of Plantings</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="successionInterval" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Interval (Days)
                              <Tooltip>
                                <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent>Days to wait between each planting batch.</TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        This will create {form.getValues('successionCount')} separate crop records, spaced {form.getValues('successionInterval')} days apart.
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* STEP 5: TASKS */}
              {step === 5 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                    <ListTodo className="h-5 w-5" />
                    <h3 className="font-semibold">Auto-Generate Tasks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    These tasks are automatically scheduled based on the planting date and days to maturity. Uncheck any you don't need.
                  </p>
                  <div className="space-y-3 border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    {generatedTasks.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={task.selected}
                            onCheckedChange={(c) => {
                              const newTasks = [...generatedTasks];
                              newTasks[idx].selected = !!c;
                              setGeneratedTasks(newTasks);
                            }}
                          />
                          <Label>{task.type}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Days after planting:</span>
                          <Input
                            type="number"
                            className="w-16 h-8"
                            value={task.offset}
                            onChange={(e) => {
                              const newTasks = [...generatedTasks];
                              newTasks[idx].offset = Number(e.target.value);
                              setGeneratedTasks(newTasks);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                {step < 5 ? (
                  <Button type="button" onClick={handleNext}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={form.formState.isSubmitting}>
                    <Check className="mr-2 h-4 w-4" /> Finish & Create
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}