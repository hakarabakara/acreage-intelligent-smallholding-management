import React, { useEffect } from 'react';
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
import { format } from 'date-fns';
import type { JournalEntry, Field, Livestock } from '@shared/types';
import { TagInput } from '@/components/ui/tag-input';
const journalSchema = z.object({
  date: z.string().min(1, 'Date required'),
  content: z.string().min(2, 'Content required'),
  category: z.enum(['observation', 'weather', 'incident', 'general']),
  relatedEntityType: z.enum(['field', 'livestock', 'crop', 'task', 'other']).optional(),
  relatedEntityId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
type JournalFormValues = z.infer<typeof journalSchema>;
interface JournalEntryDialogProps {
  entry?: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<JournalEntry>) => Promise<void>;
  fields?: Field[];
  livestock?: Livestock[];
}
export function JournalEntryDialog({ entry, isOpen, onClose, onSave, fields = [], livestock = [] }: JournalEntryDialogProps) {
  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      content: '',
      category: 'observation',
      relatedEntityType: undefined,
      relatedEntityId: '',
      tags: [],
    },
  });
  const relatedEntityType = form.watch('relatedEntityType');
  useEffect(() => {
    if (isOpen) {
      if (entry) {
        form.reset({
          date: format(entry.date, 'yyyy-MM-dd'),
          content: entry.content,
          category: entry.category,
          relatedEntityType: entry.relatedEntityType,
          relatedEntityId: entry.relatedEntityId || '',
          tags: entry.tags || [],
        });
      } else {
        form.reset({
          date: format(new Date(), 'yyyy-MM-dd'),
          content: '',
          category: 'observation',
          relatedEntityType: undefined,
          relatedEntityId: '',
          tags: [],
        });
      }
    }
  }, [entry, isOpen, form]);
  const onSubmit = async (data: JournalFormValues) => {
    await onSave({
      ...data,
      date: new Date(data.date).getTime(),
      relatedEntityId: data.relatedEntityType ? data.relatedEntityId : undefined,
    });
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
          <DialogDescription>
            Record observations, events, or notes for your farm records.
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
                name="category"
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
                        <SelectItem value="observation">Observation</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did you observe today?"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
              <h4 className="text-sm font-medium">Related Entity (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="relatedEntityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="field">Field</SelectItem>
                          <SelectItem value="livestock">Livestock</SelectItem>
                          {/* Add other types if needed */}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {relatedEntityType && (
                  <FormField
                    control={form.control}
                    name="relatedEntityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Item</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose item..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {relatedEntityType === 'field' && fields.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                            {relatedEntityType === 'livestock' && livestock.map(l => (
                              <SelectItem key={l.id} value={l.id}>{l.tag} ({l.type})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add tags (e.g. repair, urgent)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}