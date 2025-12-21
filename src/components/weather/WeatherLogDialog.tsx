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
import type { WeatherLog } from '@shared/types';
const weatherSchema = z.object({
  date: z.string().min(1, 'Date required'),
  condition: z.enum(['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'windy']),
  tempHigh: z.string().optional(),
  tempLow: z.string().optional(),
  precipitation: z.string().optional(),
  humidity: z.string().optional(),
  windSpeed: z.string().optional(),
  notes: z.string().optional(),
});
type WeatherFormValues = z.infer<typeof weatherSchema>;
interface WeatherLogDialogProps {
  log?: WeatherLog | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<WeatherLog>) => Promise<void>;
  defaultDate?: Date;
}
export function WeatherLogDialog({ log, isOpen, onClose, onSave, defaultDate }: WeatherLogDialogProps) {
  const form = useForm<WeatherFormValues>({
    resolver: zodResolver(weatherSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      condition: 'sunny',
      tempHigh: '',
      tempLow: '',
      precipitation: '',
      humidity: '',
      windSpeed: '',
      notes: '',
    },
  });
  useEffect(() => {
    if (isOpen) {
      if (log) {
        form.reset({
          date: format(log.date, 'yyyy-MM-dd'),
          condition: log.condition,
          tempHigh: log.tempHigh?.toString() || '',
          tempLow: log.tempLow?.toString() || '',
          precipitation: log.precipitation?.toString() || '',
          humidity: log.humidity?.toString() || '',
          windSpeed: log.windSpeed?.toString() || '',
          notes: log.notes || '',
        });
      } else {
        form.reset({
          date: format(defaultDate || new Date(), 'yyyy-MM-dd'),
          condition: 'sunny',
          tempHigh: '',
          tempLow: '',
          precipitation: '',
          humidity: '',
          windSpeed: '',
          notes: '',
        });
      }
    }
  }, [log, isOpen, form, defaultDate]);
  const onSubmit = async (data: WeatherFormValues) => {
    await onSave({
      ...data,
      date: new Date(data.date).getTime(),
      tempHigh: data.tempHigh ? Number(data.tempHigh) : undefined,
      tempLow: data.tempLow ? Number(data.tempLow) : undefined,
      precipitation: data.precipitation ? Number(data.precipitation) : undefined,
      humidity: data.humidity ? Number(data.humidity) : undefined,
      windSpeed: data.windSpeed ? Number(data.windSpeed) : undefined,
    });
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{log ? 'Edit Weather Log' : 'Log Weather'}</DialogTitle>
          <DialogDescription>
            Record daily weather conditions for your farm records.
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
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sunny">Sunny</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="rainy">Rainy</SelectItem>
                      <SelectItem value="stormy">Stormy</SelectItem>
                      <SelectItem value="snowy">Snowy</SelectItem>
                      <SelectItem value="windy">Windy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tempHigh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>High Temp (°F)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 75" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tempLow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Temp (°F)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 55" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="precipitation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precip (in)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="humidity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Humidity %</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="windSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wind (mph)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observations..." {...field} />
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