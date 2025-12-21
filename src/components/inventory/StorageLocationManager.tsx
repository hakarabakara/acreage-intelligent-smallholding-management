import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit, MapPin, Save, X } from 'lucide-react';
import type { StorageLocation } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
interface StorageLocationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  locations: StorageLocation[];
  onUpdate: () => void;
}
export function StorageLocationManager({ isOpen, onClose, locations, onUpdate }: StorageLocationManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleEdit = (loc: StorageLocation) => {
    setEditingId(loc.id);
    setFormData({ name: loc.name, description: loc.description || '' });
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };
  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api(`/api/storage-locations/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('Location updated');
      } else {
        await api('/api/storage-locations', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Location added');
      }
      onUpdate();
      handleCancelEdit();
    } catch (error) {
      toast.error('Failed to save location');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) return;
    try {
      await api(`/api/storage-locations/${id}`, { method: 'DELETE' });
      toast.success('Location deleted');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete location');
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Storage Locations</DialogTitle>
          <DialogDescription>
            Define areas where inventory items are stored.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Form */}
          <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Edit Location' : 'Add New Location'}
            </h4>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="loc-name" className="text-xs">Name</Label>
                <Input
                  id="loc-name"
                  placeholder="e.g. Barn A, Shelf 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="loc-desc" className="text-xs">Description (Optional)</Label>
                <Input
                  id="loc-desc"
                  placeholder="e.g. Near the entrance"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {editingId && (
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={!formData.name.trim() || isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Add')}
              </Button>
            </div>
          </div>
          {/* List */}
          <div className="space-y-2">
            <Label>Existing Locations</Label>
            <ScrollArea className="h-[250px] border rounded-md">
              <div className="p-2 space-y-1">
                {locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No locations defined.
                  </div>
                ) : (
                  locations.map(loc => (
                    <div
                      key={loc.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border transition-colors",
                        editingId === loc.id ? "bg-accent border-accent-foreground/20" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{loc.name}</div>
                          {loc.description && (
                            <div className="text-xs text-muted-foreground truncate">{loc.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEdit(loc)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDelete(loc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}