import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm, useFieldArray, useWatch, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Trash2, Package } from 'lucide-react';
import { format } from 'date-fns';
import type { Order, Customer, InventoryItem } from '@shared/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
// Define schema for validation (numbers)
const orderItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  unitPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Must be a non-negative number'),
  inventoryId: z.string().optional(),
  useInventory: z.boolean().optional(),
});
const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  date: z.string().min(1, 'Date required'),
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']),
  paymentStatus: z.enum(['unpaid', 'paid', 'partial']),
  items: z.array(orderItemSchema).min(1, 'Add at least one item'),
  notes: z.string().optional(),
  channel: z.string().optional(),
});
// Explicitly define form values to handle string inputs for numbers
type OrderFormValues = z.infer<typeof orderSchema>;
interface OrderDialogProps {
  order?: Order | null;
  customers: Customer[];
  inventory?: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Order>) => Promise<void>;
}
export function OrderDialog({ order, customers, inventory = [], isOpen, onClose, onSave }: OrderDialogProps) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
      paymentStatus: 'unpaid',
      items: [{ description: '', quantity: '1', unitPrice: '0', useInventory: false, inventoryId: '' }],
      notes: '',
      channel: 'Direct',
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  const items = useWatch({
    control: form.control,
    name: 'items',
  });
  const calculateTotal = () => {
    return (items || []).reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  };
  const totalAmount = calculateTotal();
  useEffect(() => {
    if (isOpen) {
      if (order) {
        form.reset({
          customerId: order.customerId,
          date: format(order.date, 'yyyy-MM-dd'),
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: order.items.map(i => ({
            description: i.description,
            quantity: i.quantity.toString(),
            unitPrice: i.unitPrice.toString(),
            inventoryId: i.inventoryId || '',
            useInventory: !!i.inventoryId
          })),
          notes: order.notes || '',
          channel: order.channel || 'Direct',
        });
      } else {
        form.reset({
          customerId: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          status: 'pending',
          paymentStatus: 'unpaid',
          items: [{ description: '', quantity: '1', unitPrice: '0', useInventory: false, inventoryId: '' }],
          notes: '',
          channel: 'Direct',
        });
      }
    }
  }, [order, isOpen, form]);
  const handleInventorySelect = (index: number, itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      form.setValue(`items.${index}.inventoryId`, itemId);
      form.setValue(`items.${index}.description`, item.name);
      if (item.unitCost) {
        // Assuming unitCost is cost price, maybe we want a markup?
        // For now, let's just prefill it, user can edit.
        // Or if we had a 'salesPrice' on inventory, we'd use that.
        // Let's just use unitCost as a baseline or 0 if not set.
        // Actually, usually sales price is different. Let's leave price as is or 0 unless we want to suggest cost.
        // Let's not overwrite price if it's already set, or set to 0.
        // Actually, let's just set description.
      }
    }
  };
  const onSubmit: SubmitHandler<OrderFormValues> = async (data) => {
    const processedItems = data.items.map(item => ({
      id: crypto.randomUUID(),
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.quantity) * Number(item.unitPrice),
      inventoryId: item.useInventory ? item.inventoryId : undefined
    }));
    const finalTotal = processedItems.reduce((acc, item) => acc + item.total, 0);
    await onSave({
      customerId: data.customerId,
      status: data.status,
      paymentStatus: data.paymentStatus,
      notes: data.notes,
      date: new Date(data.date).getTime(),
      items: processedItems,
      totalAmount: finalTotal,
      channel: data.channel
    });
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{order ? 'Edit Order' : 'Create New Order'}</DialogTitle>
          <DialogDescription>
            Manage sales details and line items.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 p-6 pt-2">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map(c => (
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
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date</FormLabel>
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Channel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Direct">Direct / Farm Stand</SelectItem>
                          <SelectItem value="Wholesale">Wholesale</SelectItem>
                          <SelectItem value="Market">Farmers Market</SelectItem>
                          <SelectItem value="Online">Online Store</SelectItem>
                          <SelectItem value="Restaurant">Restaurant</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Order Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ description: '', quantity: '1', unitPrice: '0', useInventory: false, inventoryId: '' })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, index) => {
                      const useInventory = form.watch(`items.${index}.useInventory`);
                      return (
                        <Card key={field.id} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={useInventory}
                                  onCheckedChange={(checked) => {
                                    form.setValue(`items.${index}.useInventory`, checked);
                                    if (!checked) {
                                      form.setValue(`items.${index}.inventoryId`, '');
                                    }
                                  }}
                                  id={`use-inv-${index}`}
                                />
                                <Label htmlFor={`use-inv-${index}`} className="text-xs cursor-pointer flex items-center gap-1">
                                  <Package className="h-3 w-3" /> From Inventory
                                </Label>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex gap-3 items-start">
                              <div className="flex-1 space-y-2">
                                {useInventory ? (
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.inventoryId`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <Select
                                          onValueChange={(val) => handleInventorySelect(index, val)}
                                          value={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select item..." />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {inventory.map(i => (
                                              <SelectItem key={i.id} value={i.id}>
                                                {i.name} ({i.quantity} {i.unit})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                ) : (
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.description`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input placeholder="Item description" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem className="w-20">
                                    <FormControl>
                                      <Input type="number" placeholder="Qty" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                  <FormItem className="w-24">
                                    <FormControl>
                                      <div className="relative">
                                        <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">$</span>
                                        <Input type="number" className="pl-5" placeholder="Price" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="w-20 pt-2 text-right font-medium text-sm">
                                ${((Number(items?.[index]?.quantity) || 0) * (Number(items?.[index]?.unitPrice) || 0)).toFixed(2)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground mr-4">Total Amount:</span>
                      <span className="text-2xl font-bold text-emerald-600">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Internal notes about this order..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t bg-background">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}