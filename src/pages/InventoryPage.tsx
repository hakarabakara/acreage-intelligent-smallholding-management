import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Warehouse, AlertTriangle, Package, Loader2, Trash2, Minus, Sprout, Settings2, MapPin, Tag } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { InventoryItem, InventoryCategory } from '@shared/types';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
const inventorySchema = z.object({
  name: z.string().min(2, 'Name required'),
  categoryId: z.string().min(1, 'Category required'),
  quantity: z.string().refine((val) => !isNaN(Number(val)), 'Must be a number'),
  unit: z.string().min(1, 'Unit required'),
  lowStockThreshold: z.string().refine((val) => !isNaN(Number(val)), 'Must be a number'),
  storageLocation: z.string().optional(),
  // Seed specific
  germinationRate: z.string().optional(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  // Custom Attributes
  customAttributes: z.array(z.object({
    key: z.string().min(1, "Name required"),
    value: z.string().min(1, "Value required")
  })).optional(),
});
type InventoryFormValues = z.infer<typeof inventorySchema>;
export function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: '',
      categoryId: '',
      quantity: '0',
      unit: 'units',
      lowStockThreshold: '1',
      storageLocation: '',
      germinationRate: '',
      lotNumber: '',
      expiryDate: '',
      customAttributes: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customAttributes',
  });
  const selectedCategoryId = form.watch('categoryId');
  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name;
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [invRes, catRes] = await Promise.all([
        api<{ items: InventoryItem[] }>('/api/inventory'),
        api<{ items: InventoryCategory[] }>('/api/inventory-categories')
      ]);
      setInventory(invRes.items);
      setCategories(catRes.items);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const onSubmit = async (data: InventoryFormValues) => {
    try {
      const category = categories.find(c => c.id === data.categoryId);
      await api('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          category: category?.name || 'other', // Fallback for legacy field
          quantity: Number(data.quantity),
          lowStockThreshold: Number(data.lowStockThreshold),
          germinationRate: data.germinationRate ? Number(data.germinationRate) : undefined,
          expiryDate: data.expiryDate ? new Date(data.expiryDate).getTime() : undefined,
          customAttributes: data.customAttributes || [],
        }),
      });
      toast.success('Item added to inventory');
      setIsDialogOpen(false);
      form.reset({
        name: '',
        categoryId: '',
        quantity: '0',
        unit: 'units',
        lowStockThreshold: '1',
        storageLocation: '',
        germinationRate: '',
        lotNumber: '',
        expiryDate: '',
        customAttributes: [],
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await api<InventoryCategory>('/api/inventory-categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      setCategories(prev => [...prev, created]);
      setNewCategoryName('');
      toast.success('Category added');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Items using it may need updating.')) return;
    try {
      await api(`/api/inventory-categories/${id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };
  const updateQuantity = async (item: InventoryItem, change: number) => {
    const newQuantity = Math.max(0, item.quantity + change);
    try {
      // Optimistic update
      setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
      await api(`/api/inventory/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQuantity }),
      });
    } catch (error) {
      toast.error('Failed to update quantity');
      fetchData(); // Revert
    }
  };
  const deleteItem = async (id: string) => {
    try {
      await api(`/api/inventory/${id}`, { method: 'DELETE' });
      setInventory(prev => prev.filter(i => i.id !== id));
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };
  return (
    <AppLayout
      title="Inventory & Resources"
      actions={
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings2 className="mr-2 h-4 w-4" /> Categories
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogDescription>Add or remove inventory categories.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>Add</Button>
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{cat.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>
                  Track a new resource, feed, or equipment item in your inventory.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                    name="storageLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Barn A, Shelf 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Custom Attributes Section */}
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
                  {/* SEED SPECIFIC FIELDS */}
                  {selectedCategoryName?.toLowerCase() === 'seed' && (
                    <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <Sprout className="h-4 w-4" />
                        <h4 className="font-medium text-sm">Seed Details</h4>
                      </div>
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
                  <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      Add Item
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed">
          <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Inventory is empty</h3>
          <p className="text-muted-foreground mb-4">Track your seeds, feed, and equipment here.</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">Add Item</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => {
            const isLowStock = item.quantity <= item.lowStockThreshold;
            // Resolve category name: use linked category if available, else fallback to legacy string
            const categoryName = categories.find(c => c.id === item.categoryId)?.name || item.category;
            return (
              <Card key={item.id} className={cn(
                "group hover:shadow-lg transition-all duration-200 border-border/60",
                isLowStock && "border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                        {item.name}
                        {isLowStock && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      </CardTitle>
                      <CardDescription className="mt-1 capitalize">
                        {categoryName}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <div className="text-3xl font-bold tracking-tight">{item.quantity}</div>
                      <div className="text-sm text-muted-foreground">{item.unit}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {item.storageLocation && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{item.storageLocation}</span>
                    </div>
                  )}
                  {categoryName?.toLowerCase() === 'seed' && (item.germinationRate || item.expiryDate) && (
                    <div className="mb-4 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded text-xs space-y-1">
                      {item.germinationRate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Germination:</span>
                          <span className="font-medium">{item.germinationRate}%</span>
                        </div>
                      )}
                      {item.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expires:</span>
                          <span className="font-medium">{format(item.expiryDate, 'MMM yyyy')}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Display Custom Attributes */}
                  {item.customAttributes && item.customAttributes.length > 0 && (
                    <div className="mb-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                      {item.customAttributes.map((attr, idx) => (
                        <div key={idx} className="flex flex-col">
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{attr.key}</span>
                          <span className="font-medium truncate" title={attr.value}>{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>Threshold: {item.lowStockThreshold}</span>
                    </div>
                    {isLowStock && <span className="text-amber-600 font-medium">Low Stock Alert</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}