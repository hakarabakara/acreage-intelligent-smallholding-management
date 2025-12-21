import React, { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuickEntry } from '@/hooks/use-quick-entry';
import { useScratchpadStore } from '@/lib/scratchpad-store';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Crop } from '@shared/types';
import { Loader2 } from 'lucide-react';
export function QuickEntrySheets() {
  const isHarvestOpen = useQuickEntry(s => s.isHarvestOpen);
  const closeHarvest = useQuickEntry(s => s.closeHarvest);
  const isTaskOpen = useQuickEntry(s => s.isTaskOpen);
  const closeTask = useQuickEntry(s => s.closeTask);
  const isWeatherOpen = useQuickEntry(s => s.isWeatherOpen);
  const closeWeather = useQuickEntry(s => s.closeWeather);
  const isNoteOpen = useQuickEntry(s => s.isNoteOpen);
  const closeNote = useQuickEntry(s => s.closeNote);
  return (
    <>
      <QuickHarvestSheet open={isHarvestOpen} onClose={closeHarvest} />
      <QuickTaskSheet open={isTaskOpen} onClose={closeTask} />
      <QuickWeatherSheet open={isWeatherOpen} onClose={closeWeather} />
      <QuickNoteSheet open={isNoteOpen} onClose={closeNote} />
    </>
  );
}
function QuickHarvestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ cropId: '', amount: '', unit: 'lbs' });
  useEffect(() => {
    if (open) {
      setLoading(true);
      api<{ items: Crop[] }>('/api/crops')
        .then(res => setCrops(res.items.filter(c => c.status !== 'harvested')))
        .catch(() => toast.error('Failed to load crops'))
        .finally(() => setLoading(false));
    }
  }, [open]);
  const handleSubmit = async () => {
    if (!formData.cropId || !formData.amount) return;
    setSubmitting(true);
    try {
      await api('/api/harvests', {
        method: 'POST',
        body: JSON.stringify({
          cropId: formData.cropId,
          amount: Number(formData.amount),
          unit: formData.unit,
          date: Date.now(),
          quality: 'A' // Default for quick entry
        })
      });
      toast.success('Harvest logged');
      setFormData({ cropId: '', amount: '', unit: 'lbs' });
      onClose();
    } catch (e) {
      toast.error('Failed to log harvest');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Quick Harvest</DrawerTitle>
            <DrawerDescription>Log a harvest from the field.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Crop</Label>
              <Select value={formData.cropId} onValueChange={(v) => setFormData({ ...formData, cropId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading..." : "Select crop"} />
                </SelectTrigger>
                <SelectContent>
                  {crops.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.variety})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="lbs"
                />
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={submitting || !formData.cropId || !formData.amount}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Harvest'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
function QuickTaskSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          priority,
          status: 'todo',
          createdAt: Date.now()
        })
      });
      toast.success('Task created');
      setTitle('');
      setPriority('medium');
      onClose();
    } catch (e) {
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Quick Task</DrawerTitle>
            <DrawerDescription>Add a new task on the go.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Task'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
function QuickWeatherSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [condition, setCondition] = useState('sunny');
  const [temp, setTemp] = useState('');
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api('/api/weather', {
        method: 'POST',
        body: JSON.stringify({
          date: Date.now(),
          condition,
          tempHigh: temp ? Number(temp) : undefined,
          notes: 'Quick log from field'
        })
      });
      toast.success('Weather logged');
      setTemp('');
      onClose();
    } catch (e) {
      toast.error('Failed to log weather');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Log Weather</DrawerTitle>
            <DrawerDescription>Record current conditions.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                  <SelectItem value="stormy">Stormy</SelectItem>
                  <SelectItem value="windy">Windy</SelectItem>
                  <SelectItem value="snowy">Snowy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temperature (°F)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="Current temp"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Log'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
function QuickNoteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [note, setNote] = useState('');
  const appendNote = useScratchpadStore((state) => state.appendNote);
  const handleSubmit = () => {
    if (!note.trim()) return;
    appendNote(note.trim());
    toast.success('Note added to scratchpad');
    setNote('');
    onClose();
  };
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Quick Note</DrawerTitle>
            <DrawerDescription>Jot down an observation or idea.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type your note here..."
              className="min-h-[150px]"
            />
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={!note.trim()}>
              Save Note
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}