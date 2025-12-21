import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, RotateCw, ArrowRight, Trash2, Edit, MoveUp, MoveDown, GripVertical } from 'lucide-react';
import type { Rotation, Field } from '@shared/types';
import { cn } from '@/lib/utils';
interface RotationManagerProps {
  rotations: Rotation[];
  fields: Field[];
  onCreate: (rotation: Partial<Rotation>) => Promise<void>;
  onUpdate: (id: string, rotation: Partial<Rotation>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
export function RotationManager({ rotations, fields, onCreate, onUpdate, onDelete }: RotationManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
  const [formData, setFormData] = useState<Partial<Rotation>>({
    name: '',
    description: '',
    type: 'grazing',
    steps: []
  });
  const openDialog = (rotation?: Rotation) => {
    if (rotation) {
      setEditingRotation(rotation);
      setFormData({
        name: rotation.name,
        description: rotation.description || '',
        type: rotation.type,
        steps: [...rotation.steps]
      });
    } else {
      setEditingRotation(null);
      setFormData({
        name: '',
        description: '',
        type: 'grazing',
        steps: []
      });
    }
    setIsDialogOpen(true);
  };
  const handleSave = async () => {
    if (!formData.name) return;
    try {
      if (editingRotation) {
        await onUpdate(editingRotation.id, formData);
      } else {
        await onCreate(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save rotation', error);
    }
  };
  const addStep = (fieldId: string) => {
    if (!fieldId) return;
    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), fieldId]
    }));
  };
  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: (prev.steps || []).filter((_, i) => i !== index)
    }));
  };
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const steps = [...(formData.steps || [])];
    if (direction === 'up' && index > 0) {
      [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
    } else if (direction === 'down' && index < steps.length - 1) {
      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
    }
    setFormData(prev => ({ ...prev, steps }));
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Rotation Plans</h3>
          <p className="text-sm text-muted-foreground">Define sequences for grazing or crop cycles.</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Rotation
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rotations.map(rotation => (
          <Card key={rotation.id} className="group hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <RotateCw className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{rotation.name}</CardTitle>
                    <CardDescription className="capitalize">{rotation.type} Rotation</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(rotation)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(rotation.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{rotation.description}</p>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sequence</div>
                <div className="flex flex-wrap gap-2 items-center">
                  {rotation.steps.map((stepId, idx) => {
                    const field = fields.find(f => f.id === stepId);
                    return (
                      <React.Fragment key={idx}>
                        <Badge variant="outline" className="bg-background">
                          {field?.name || 'Unknown Field'}
                        </Badge>
                        {idx < rotation.steps.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </React.Fragment>
                    );
                  })}
                  {rotation.steps.length === 0 && (
                    <span className="text-sm text-muted-foreground italic">No steps defined</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rotations.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed rounded-lg">
            <RotateCw className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No rotations defined</h3>
            <p className="text-muted-foreground mb-4">Create a rotation plan to automate field sequencing.</p>
            <Button onClick={() => openDialog()} variant="outline">Create Rotation</Button>
          </div>
        )}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRotation ? 'Edit Rotation' : 'Create Rotation'}</DialogTitle>
            <DialogDescription>
              Define the sequence of fields for this rotation cycle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  placeholder="e.g. Summer Grazing" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v: any) => setFormData({...formData, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grazing">Grazing</SelectItem>
                    <SelectItem value="crop">Crop</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe the purpose of this rotation..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Rotation Steps</Label>
                <Select onValueChange={addStep}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Add Field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                  {(formData.steps || []).map((stepId, idx) => {
                    const field = fields.find(f => f.id === stepId);
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-md group">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-0.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 hover:bg-transparent" 
                              onClick={() => moveStep(idx, 'up')}
                              disabled={idx === 0}
                            >
                              <MoveUp className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 hover:bg-transparent" 
                              onClick={() => moveStep(idx, 'down')}
                              disabled={idx === (formData.steps?.length || 0) - 1}
                            >
                              <MoveDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">
                              {idx + 1}
                            </Badge>
                            <span className="font-medium">{field?.name || 'Unknown Field'}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => removeStep(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  {(formData.steps || []).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No fields added to rotation yet.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name}>Save Rotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}