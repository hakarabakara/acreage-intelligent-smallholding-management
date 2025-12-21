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
import type { CropVariety } from '@shared/types';
const varietySchema = z.object({
  name: z.string().min(2, 'Name required'),
  variety: z.string().min(1, 'Variety required'),
  daysToMaturity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  plantingMethod: z.enum(['direct', 'transplant']).optional(),
  preferredSeason: z.string().optional(),
  notes: z.string().optional(),
});
type VarietyFormValues = z.infer<typeof varietySchema>;
interface CropVarietyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CropVariety>) => Promise<void>;
  variety?: CropVariety | null;
}
export function CropVarietyDialog({ isOpen, onClose, onSave, variety }: CropVarietyDialogProps) {
  const form = useForm<VarietyFormValues>({
    resolver: zodResolver(varietySchema),
    defaultValues: {
      name: '',
      variety: '',
      daysToMaturity: '60',
      plantingMethod: 'direct',
      preferredSeason: '',
      notes: '',
    },
  });
  useEffect(() => {
    if (isOpen) {
      if (variety) {
        form.reset({
          name: variety.name,
          variety: variety.variety,
          daysToMaturity: variety.daysToMaturity.toString(),
          plantingMethod: variety.plantingMethod || 'direct',
          preferredSeason: variety.preferredSeason || '',
          notes: variety.notes || '',
        });
      } else {
        form.reset({
          name: '',
          variety: '',
          daysToMaturity: '60',
          plantingMethod: 'direct',
          preferredSeason: '',
          notes: '',
        });
      }
    }
  }, [isOpen, variety, form]);
  const onSubmit = async (data: VarietyFormValues) => {
    await onSave({
      ...data,
      daysToMaturity: Number(data.daysToMaturity),
    });
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{variety ? 'Edit Variety' : 'Add Crop Variety'}</DialogTitle>
          <DialogDescription>
            Define a crop template for quick planning.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Tomato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="variety"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variety</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Roma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="daysToMaturity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days to Maturity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plantingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="direct">Direct Sow</SelectItem>
                        <SelectItem value="transplant">Transplant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="preferredSeason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Season (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Spring/Summer" {...field} />
                  </FormControl>
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
                    <Textarea placeholder="Growing tips..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Variety'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}