import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';
import type { ResourceLog } from '@shared/types';
const resourceSchema = z.object({
  date: z.string().min(1, 'Date required'),
  type: z.enum(['energy', 'water']),
  flow: z.enum(['consumption', 'production']),
  source: z.string().min(1, 'Source required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  unit: z.string().min(1, 'Unit required'),
  notes: z.string().optional(),
});
type ResourceFormValues = z.infer<typeof resourceSchema>;
interface ResourceDialogProps {
  log?: ResourceLog | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ResourceLog>) => Promise<void>;
}
export function ResourceDialog({ log, isOpen, onClose, onSave }: ResourceDialogProps) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'energy',
      flow: 'consumption',
      source: '',
      amount: '',
      unit: 'kWh',
      notes: '',
    },
  });
  const type = form.watch('type');
  // Auto-update unit based on type if not manually changed (simple heuristic)
  useEffect(() => {
    if (type === 'energy') {
      form.setValue('unit', 'kWh');
    } else {
      form.setValue('unit', 'liters');
    }
  }, [type, form]);
  useEffect(() => {
    if (isOpen) {
      if (log) {
        form.reset({
          date: format(log.date, 'yyyy-MM-dd'),
          type: log.type,
          flow: log.flow,
          source: log.source,
          amount: log.amount.toString(),
          unit: log.unit,
          notes: log.notes || '',
        });
      } else {
        form.reset({
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'energy',
          flow: 'consumption',
          source: '',
          amount: '',
          unit: 'kWh',
          notes: '',
        });
      }
    }
  }, [log, isOpen, form]);
  const onSubmit = async (data: ResourceFormValues) => {
    await onSave({
      ...data,
      date: new Date(data.date).getTime(),
      amount: Number(data.amount),
    });
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{log ? 'Edit Resource Log' : 'Log Resource Usage'}</DialogTitle>
          <DialogDescription>
            Track energy or water consumption and production.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Resource Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="energy">Energy</SelectItem>
                        <SelectItem value="water">Water</SelectItem>
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
                name="flow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flow</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consumption">Consumption</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder={type === 'energy' ? 'e.g. Grid, Solar' : 'e.g. Well, Rainwater'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                      <Input placeholder="e.g. kWh, liters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Log'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}