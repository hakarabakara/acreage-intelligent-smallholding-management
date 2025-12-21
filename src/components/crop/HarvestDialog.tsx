import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Crop, InventoryItem, InventoryCategory } from '@shared/types';
import { format } from 'date-fns';
import { Warehouse, Tag } from 'lucide-react';
const harvestSchema = z.object({
  date: z.string().min(1, 'Date required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  unit: z.string().min(1, 'Unit required'),
  quality: z.enum(['A', 'B', 'C', 'compost']),
  notes: z.string().optional(),
  // Inventory Integration
  addToInventory: z.boolean().optional(),
  inventoryMode: z.enum(['existing', 'new']).optional(),
  inventoryId: z.string().optional(),
  newInventoryName: z.string().optional(),
  newInventoryCategoryId: z.string().optional(),
  newInventoryLotNumber: z.string().optional(),
});
type HarvestFormValues = z.infer<typeof harvestSchema>;
interface HarvestDialogProps {
  crop: Crop | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  inventory?: InventoryItem[];
  categories?: InventoryCategory[];
}
export function HarvestDialog({ crop, isOpen, onClose, onSave, inventory = [], categories = [] }: HarvestDialogProps) {
  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      unit: crop?.yieldUnit || 'lbs',
      quality: 'A',
      notes: '',
      addToInventory: false,
      inventoryMode: 'new',
      inventoryId: '',
      newInventoryName: '',
      newInventoryCategoryId: '',
      newInventoryLotNumber: '',
    },
  });
  const addToInventory = form.watch('addToInventory');
  const inventoryMode = form.watch('inventoryMode');
  // Reset form when crop changes
  useEffect(() => {
    if (crop) {
      // Auto-generate lot number: LOT-YYYYMMDD-CROPNAME
      const dateStr = format(new Date(), 'yyyyMMdd');
      const cropName = crop.name.replace(/\s+/g, '').toUpperCase().slice(0, 4);
      const autoLot = `LOT-${dateStr}-${cropName}`;
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        unit: crop.yieldUnit || 'lbs',
        quality: 'A',
        notes: '',
        addToInventory: false,
        inventoryMode: 'new',
        inventoryId: '',
        newInventoryName: `${crop.name} (${crop.variety})`,
        newInventoryCategoryId: categories.find(c => c.name.toLowerCase() === 'produce')?.id || '',
        newInventoryLotNumber: autoLot,
      });
    }
  }, [crop, form, categories]);
  const onSubmit = async (data: HarvestFormValues) => {
    await onSave({
      ...data,
      lotNumber: data.addToInventory && data.inventoryMode === 'new' ? data.newInventoryLotNumber : undefined
    });
    form.reset();
  };
  if (!crop) return null;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Harvest: {crop.name}</DialogTitle>
          <DialogDescription>
            Record the yield for {crop.variety || 'this crop'}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harvest Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0.0" {...field} />
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
                      <Input placeholder="lbs, kg, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Grade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">Grade A (Premium)</SelectItem>
                      <SelectItem value="B">Grade B (Standard)</SelectItem>
                      <SelectItem value="C">Grade C (Processing)</SelectItem>
                      <SelectItem value="compost">Compost / Waste</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Inventory Integration Section */}
            <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
              <FormField
                control={form.control}
                name="addToInventory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-emerald-600" />
                        Add to Inventory
                      </FormLabel>
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
              {addToInventory && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <Tabs value={inventoryMode} onValueChange={(v: any) => form.setValue('inventoryMode', v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="new">Create New Item</TabsTrigger>
                      <TabsTrigger value="existing">Update Existing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new" className="space-y-3 mt-3">
                      <FormField
                        control={form.control}
                        name="newInventoryName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Carrots (Nantes)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="newInventoryCategoryId"
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
                          name="newInventoryLotNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                <Tag className="h-3 w-3" /> Lot #
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="LOT-..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="existing" className="space-y-3 mt-3">
                      <FormField
                        control={form.control}
                        name="inventoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Item</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose item to update..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {inventory.map(i => (
                                  <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any observations about this harvest..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Harvest Log'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}