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
import type { ComplianceLog } from '@shared/types';
const complianceSchema = z.object({
  title: z.string().min(2, 'Title required'),
  type: z.enum(['inspection', 'certification', 'training', 'incident', 'maintenance']),
  date: z.string().min(1, 'Date required'),
  description: z.string().min(2, 'Description required'),
  status: z.enum(['pass', 'fail', 'pending', 'warning']),
  inspector: z.string().optional(),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
});
type ComplianceFormValues = z.infer<typeof complianceSchema>;
interface ComplianceDialogProps {
  log?: ComplianceLog | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ComplianceLog>) => Promise<void>;
}
export function ComplianceDialog({ log, isOpen, onClose, onSave }: ComplianceDialogProps) {
  const form = useForm<ComplianceFormValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      title: '',
      type: 'inspection',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      status: 'pending',
      inspector: '',
      nextDueDate: '',
      notes: '',
    },
  });
  useEffect(() => {
    if (isOpen) {
      if (log) {
        form.reset({
          title: log.title,
          type: log.type,
          date: format(log.date, 'yyyy-MM-dd'),
          description: log.description,
          status: log.status,
          inspector: log.inspector || '',
          nextDueDate: log.nextDueDate ? format(log.nextDueDate, 'yyyy-MM-dd') : '',
          notes: log.notes || '',
        });
      } else {
        form.reset({
          title: '',
          type: 'inspection',
          date: format(new Date(), 'yyyy-MM-dd'),
          description: '',
          status: 'pending',
          inspector: '',
          nextDueDate: '',
          notes: '',
        });
      }
    }
  }, [log, isOpen, form]);
  const onSubmit = async (data: ComplianceFormValues) => {
    await onSave({
      ...data,
      date: new Date(data.date).getTime(),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate).getTime() : undefined,
    });
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{log ? 'Edit Compliance Log' : 'New Compliance Log'}</DialogTitle>
          <DialogDescription>
            Record inspections, certifications, or safety incidents.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual Safety Audit" {...field} />
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
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="certification">Certification</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about the event..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inspector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector / Auditor (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <Textarea placeholder="Additional internal notes..." {...field} />
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