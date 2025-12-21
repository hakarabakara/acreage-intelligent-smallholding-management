import React from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Plus, Trash2, ListTodo } from 'lucide-react';
interface TaskChecklistProps {
  control: Control<any>;
  name: string;
}
export function TaskChecklist({ control, name }: TaskChecklistProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-emerald-600" />
          Checklist
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ id: crypto.randomUUID(), text: '', completed: false })}
        >
          <Plus className="h-3 w-3 mr-1" /> Add Item
        </Button>
      </div>
      {fields.length === 0 && (
        <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10 text-xs text-muted-foreground">
          No checklist items added.
        </div>
      )}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2 group">
            <FormField
              control={control}
              name={`${name}.${index}.completed`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${name}.${index}.text`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Checklist item..."
                      className="h-8 text-sm"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}