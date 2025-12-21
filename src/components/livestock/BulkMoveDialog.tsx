import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import type { Field } from '@shared/types';
interface BulkMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (action: 'update', data: any) => Promise<void>;
  count: number;
  fields: Field[];
}
export function BulkMoveDialog({ isOpen, onClose, onSave, count, fields }: BulkMoveDialogProps) {
  const [actionType, setActionType] = useState<'move' | 'status'>('move');
  const [locationId, setLocationId] = useState<string>('');
  const [status, setStatus] = useState<string>('healthy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data: any = {};
      if (actionType === 'move') {
        data.locationId = locationId;
      } else {
        data.status = status;
      }
      await onSave('update', data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Update Livestock</DialogTitle>
          <DialogDescription>
            Applying changes to {count} selected animals.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <RadioGroup value={actionType} onValueChange={(v: any) => setActionType(v)} className="grid grid-cols-2 gap-4">
            <div>
              <RadioGroupItem value="move" id="move" className="peer sr-only" />
              <Label
                htmlFor="move"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="text-sm font-medium">Move Herd</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="status" id="status" className="peer sr-only" />
              <Label
                htmlFor="status"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="text-sm font-medium">Update Status</span>
              </Label>
            </div>
          </RadioGroup>
          {actionType === 'move' ? (
            <div className="space-y-2">
              <Label>New Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {fields.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="quarantine">Quarantine</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || (actionType === 'move' && !locationId)}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}