import React, { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Package, Wrench, History, Save, Trash2, Plus, Tag, AlertTriangle, Calendar, CheckCircle2, ClipboardList, DollarSign, Briefcase } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { InventoryItem, InventoryCategory, Task, Transaction, StorageLocation } from '@shared/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFormatting } from '@/hooks/use-formatting';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
const inventorySchema = z.object({
  name: z.string().min(2, 'Name required'),
  categoryId: z.string().min(1, 'Category required'),
  quantity: z.string().refine((val) => !isNaN(Number(val)), 'Must be a number'),
  unit: z.string().min(1, 'Unit required'),
  lowStockThreshold: z.string().refine((val) => !isNaN(Number(val)), 'Must be a number'),
  storageLocationId: z.string().optional(),
  germinationRate: z.string().optional(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  customAttributes: z.array(z.object({
    key: z.string().min(1, "Name required"),
    value: z.string().min(1, "Value required")
  })).optional(),
  unitCost: z.string().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Must be a non-negative number').optional(),
  status: z.enum(['active', 'maintenance', 'lent', 'broken', 'lost', 'archived']).optional(),
  // Expense Logging Fields
  logExpense: z.boolean().optional(),
  expenseAmount: z.string().optional(),
  expenseDate: z.string().optional(),
  expenseSupplier: z.string().optional(),
});
type InventoryFormValues = z.infer<typeof inventorySchema>;
interface InventoryDetailsSheetProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<InventoryItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: InventoryCategory[];
  tasks: Task[];
  storageLocations: StorageLocation[];
}
export function InventoryDetailsSheet({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
  categories,
  tasks,
  storageLocations
}: InventoryDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const { formatCurrency } = useFormatting();
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: '',
      categoryId: '',
      quantity: '0',
      unit: 'units',
      lowStockThreshold: '1',
      storageLocationId: '',
      germinationRate: '',
      lotNumber: '',
      expiryDate: '',
      customAttributes: [],
      unitCost: '',
      status: 'active',
      logExpense: false,
      expenseAmount: '',
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
      expenseSupplier: '',
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customAttributes',
  });
  const logExpense = form.watch('logExpense');
  const quantity = form.watch('quantity');
  const unitCost = form.watch('unitCost');
  // Auto-calculate expense amount when quantity or unit cost changes
  useEffect(() => {
    if (logExpense && !item) { // Only auto-calc for new items
      const qty = Number(quantity) || 0;
      const cost = Number(unitCost) || 0;
      if (qty > 0 && cost > 0) {
        form.setValue('expenseAmount', (qty * cost).toFixed(2));
      }
    }
  }, [quantity, unitCost, logExpense, item, form]);
  useEffect(() => {
    if (isOpen) {
      if (item) {
        form.reset({
          name: item.name,
          categoryId: item.categoryId || '',
          quantity: item.quantity.toString(),
          unit: item.unit,
          lowStockThreshold: item.lowStockThreshold.toString(),
          storageLocationId: item.storageLocationId || '',
          germinationRate: item.germinationRate?.toString() || '',
          lotNumber: item.lotNumber || '',
          expiryDate: item.expiryDate ? format(item.expiryDate, 'yyyy-MM-dd') : '',
          customAttributes: item.customAttributes || [],
          unitCost: item.unitCost?.toString() || '',
          status: item.status || 'active',
          logExpense: false,
          expenseAmount: '',
          expenseDate: format(new Date(), 'yyyy-MM-dd'),
          expenseSupplier: '',
        });
      } else {
        form.reset({
          name: '',
          categoryId: '',
          quantity: '0',
          unit: 'units',
          lowStockThreshold: '1',
          storageLocationId: '',
          germinationRate: '',
          lotNumber: '',
          expiryDate: '',
          customAttributes: [],
          unitCost: '',
          status: 'active',
          logExpense: false,
          expenseAmount: '',
          expenseDate: format(new Date(), 'yyyy-MM-dd'),
          expenseSupplier: '',
        });
      }
      setActiveTab('details');
    }
  }, [isOpen, item, form]);
  const handleSubmit = async (data: InventoryFormValues) => {
    setIsSaving(true);
    try {
      const category = categories.find(c => c.id === data.categoryId);
      const location = storageLocations.find(l => l.id === data.storageLocationId);
      const payload: Partial<InventoryItem> = {
        ...data,
        category: category?.name || 'other',
        storageLocation: location?.name || undefined, // Denormalize name for display
        quantity: Number(data.quantity),
        lowStockThreshold: Number(data.lowStockThreshold),
        germinationRate: data.germinationRate ? Number(data.germinationRate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).getTime() : undefined,
        customAttributes: data.customAttributes || [],
        unitCost: data.unitCost ? Number(data.unitCost) : undefined,
        status: data.status,
      };
      if (data.logExpense && data.expenseAmount) {
        const expensePayload: Partial<Transaction> = {
          amount: Number(data.expenseAmount),
          type: 'expense',
          category: 'Equipment', // Default or maybe 'Supplies'
          date: new Date(data.expenseDate || Date.now()).getTime(),
          description: `Purchase: ${data.name} ${data.expenseSupplier ? `from ${data.expenseSupplier}` : ''}`,
          relatedEntityId: item?.id, // Only link if existing item
        };
        // Try to find a matching category for expense
        if (category?.name.toLowerCase().includes('seed')) expensePayload.category = 'Seed';
        else if (category?.name.toLowerCase().includes('feed')) expensePayload.category = 'Feed';
        else if (category?.name.toLowerCase().includes('equipment')) expensePayload.category = 'Equipment';
        else expensePayload.category = 'Supplies';
        await api('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(expensePayload)
        });
        toast.success('Expense logged to ledger');
      }
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!item) return;
    if (confirm('Are you sure you want to delete this item?')) {
      await onDelete(item.id);
      onClose();
    }
  };
  // Filter tasks for Maintenance (linked via relatedEntityId)
  const maintenanceTasks = useMemo(() => {
    if (!item) return [];
    return tasks.filter(t => t.relatedEntityId === item.id).sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0));
  }, [tasks, item]);
  // Filter tasks for Usage (linked via materials)
  const usageTasks = useMemo(() => {
    if (!item) return [];
    return tasks.filter(t => t.materials?.some(m => m.inventoryId === item.id)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [tasks, item]);
  const selectedCategoryId = form.watch('categoryId');
  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name;
  const isSeed = selectedCategoryName?.toLowerCase().includes('seed');
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'broken': return 'bg-red-100 text-red-800 border-red-200';
      case 'lost': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                {item ? item.name : 'New Item'}
                {item && (
                  <Badge variant="outline" className={cn("text-xs font-normal capitalize", getStatusColor(item.status))}>
                    {item.status || 'active'}
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription>
                {item ? `${item.quantity} ${item.unit} in stock` : 'Add a new inventory item'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="maintenance" disabled={!item}>Maintenance</TabsTrigger>
            <TabsTrigger value="usage" disabled={!item}>Usage History</TabsTrigger>
          </TabsList>
          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-6 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Diesel Fuel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="maintenance">In Maintenance</SelectItem>
                            <SelectItem value="lent">Lent Out</SelectItem>
                            <SelectItem value="broken">Broken</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
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
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. lbs, gallons" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per Unit ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Stock Alert At</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="storageLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {storageLocations.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isSeed && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900 space-y-4">
                    <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Seed Specifics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="germinationRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Germination %</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="95" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lotNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lot Number</FormLabel>
                            <FormControl>
                              <Input placeholder="LOT-123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Packed For / Expiry</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                {/* Expense Logging Section */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900 space-y-4">
                  <FormField
                    control={form.control}
                    name="logExpense"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <DollarSign className="h-4 w-4" />
                            Log Purchase as Expense
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Automatically create a transaction record.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {logExpense && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <FormField
                        control={form.control}
                        name="expenseAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Cost ($)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expenseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="expenseSupplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supplier (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Farm Supply Co." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Custom Attributes
                    </h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                      <Plus className="h-3 w-3 mr-1" /> Add Attribute
                    </Button>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`customAttributes.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Name (e.g. Model)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`customAttributes.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Value (e.g. X-2000)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No custom attributes added.</p>
                  )}
                </div>
                <div className="flex justify-between pt-4 border-t">
                  {item && (
                    <Button type="button" variant="destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Item
                    </Button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>
          {/* MAINTENANCE TAB */}
          <TabsContent value="maintenance" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4 text-blue-600" />
                Service & Repair Log
              </h4>
            </div>
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4 space-y-3">
                {maintenanceTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No maintenance tasks recorded.
                    <p className="text-xs mt-1">Create a task and link it to this item to track service.</p>
                  </div>
                ) : (
                  maintenanceTasks.map(task => (
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
                              {format(task.dueDate, 'MMM d, yyyy')}
                            </span>
                          )}
                          <span>•</span>
                          <span className="capitalize">{task.status}</span>
                        </div>
                      </div>
                      {task.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ClipboardList className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          {/* USAGE TAB */}
          <TabsContent value="usage" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4 text-purple-600" />
                Consumption History
              </h4>
            </div>
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4 space-y-3">
                {usageTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No usage history found.
                  </div>
                ) : (
                  usageTasks.map(task => {
                    const material = task.materials?.find(m => m.inventoryId === item?.id);
                    return (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="font-medium truncate mb-1">{task.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(task.createdAt, 'MMM d, yyyy')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">
                            -{material?.amount} {material?.unit}
                          </div>
                          {material?.cost && (
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(material.cost)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}