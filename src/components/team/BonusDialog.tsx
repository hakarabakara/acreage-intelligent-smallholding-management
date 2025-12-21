import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';
import type { BonusRecord } from '@shared/types';
const bonusSchema = z.object({
  date: z.string().min(1, 'Date required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  reason: z.string().min(2, 'Reason required'),
  metric: z.string().optional(),
});
type BonusFormValues = z.infer<typeof bonusSchema>;
interface BonusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bonus: BonusRecord) => void;
}
export function BonusDialog({ isOpen, onClose, onSave }: BonusDialogProps) {
  const form = useForm<BonusFormValues>({
    resolver: zodResolver(bonusSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      reason: '',
      metric: '',
    },
  });
  useEffect(() => {
    if (isOpen) {
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        reason: '',
        metric: '',
      });
    }
  }, [isOpen, form]);
  const onSubmit = (data: BonusFormValues) => {
    onSave({
      id: crypto.randomUUID(),
      date: new Date(data.date).getTime(),
      amount: Number(data.amount),
      reason: data.reason,
      metric: data.metric,
    });
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Performance Bonus</DialogTitle>
          <DialogDescription>
            Record a bonus for this team member based on farm performance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Harvest Efficiency" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="metric"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Performance Metric (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 10% above yield target" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Add Bonus
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}