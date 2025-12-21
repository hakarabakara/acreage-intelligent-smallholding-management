import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Crop } from '@shared/types';
import { format } from 'date-fns';
const harvestSchema = z.object({
  date: z.string().min(1, 'Date required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  unit: z.string().min(1, 'Unit required'),
  quality: z.enum(['A', 'B', 'C', 'compost']),
  notes: z.string().optional(),
});
type HarvestFormValues = z.infer<typeof harvestSchema>;
interface HarvestDialogProps {
  crop: Crop | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HarvestFormValues) => Promise<void>;
}
export function HarvestDialog({ crop, isOpen, onClose, onSave }: HarvestDialogProps) {
  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      unit: crop?.yieldUnit || 'lbs',
      quality: 'A',
      notes: '',
    },
  });
  // Reset form when crop changes
  React.useEffect(() => {
    if (crop) {
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        unit: crop.yieldUnit || 'lbs',
        quality: 'A',
        notes: '',
      });
    }
  }, [crop, form]);
  const onSubmit = async (data: HarvestFormValues) => {
    await onSave(data);
    form.reset();
  };
  if (!crop) return null;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
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