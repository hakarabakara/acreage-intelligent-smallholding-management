import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ClipboardList, Edit, Trash2, Tractor, AlertTriangle, BookOpen, CheckSquare, X, Tag } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { TaskTemplate, LivestockTypeConfig, KnowledgeEntry, InventoryItem, TaskCategory } from '@shared/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ResourcePicker } from '@/components/settings/ResourcePicker';
export function OperationsSettings() {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [livestockTypes, setLivestockTypes] = useState<LivestockTypeConfig[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<TaskTemplate>>({
    title: '',
    description: '',
    priority: 'medium',
    defaultDaysDue: 0,
    checklist: [],
    safetyNotes: '',
    knowledgeEntryId: '',
    requiredResources: []
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newType, setNewType] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  // Task Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#10B981');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  useEffect(() => {
    fetchTaskTemplates();
    fetchLivestockTypes();
    fetchKnowledgeEntries();
    fetchInventory();
    fetchTaskCategories();
  }, []);
  const fetchTaskTemplates = async () => {
    try {
      const res = await api<{ items: TaskTemplate[] }>('/api/task-templates');
      setTaskTemplates(res.items);
    } catch (error) {
      console.error('Failed to load task templates', error);
    }
  };
  const fetchLivestockTypes = async () => {
    try {
      const res = await api<{ items: LivestockTypeConfig[] }>('/api/livestock-types');
      setLivestockTypes(res.items);
    } catch (error) {
      console.error('Failed to load livestock types', error);
    }
  };
  const fetchKnowledgeEntries = async () => {
    try {
      const res = await api<{ items: KnowledgeEntry[] }>('/api/knowledge?limit=1000');
      setKnowledgeEntries(res.items);
    } catch (error) {
      console.error('Failed to load knowledge entries', error);
    }
  };
  const fetchInventory = async () => {
    try {
      const res = await api<{ items: InventoryItem[] }>('/api/inventory?limit=1000');
      setInventory(res.items);
    } catch (error) {
      console.error('Failed to load inventory', error);
    }
  };
  const fetchTaskCategories = async () => {
    try {
      const res = await api<{ items: TaskCategory[] }>('/api/task-categories');
      setTaskCategories(res.items);
    } catch (error) {
      console.error('Failed to load task categories', error);
    }
  };
  const openTemplateDialog = (template?: TaskTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        title: template.title,
        description: template.description || '',
        priority: template.priority,
        defaultDaysDue: template.defaultDaysDue || 0,
        checklist: template.checklist || [],
        safetyNotes: template.safetyNotes || '',
        knowledgeEntryId: template.knowledgeEntryId || '',
        requiredResources: template.requiredResources || []
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        title: '',
        description: '',
        priority: 'medium',
        defaultDaysDue: 0,
        checklist: [],
        safetyNotes: '',
        knowledgeEntryId: '',
        requiredResources: []
      });
    }
    setNewChecklistItem('');
    setIsTemplateDialogOpen(true);
  };
  const handleSaveTemplate = async () => {
    if (!templateForm.title) return;
    try {
      if (editingTemplate) {
        const updated = await api<TaskTemplate>(`/api/task-templates/${editingTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(templateForm)
        });
        setTaskTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        toast.success('Template updated');
      } else {
        const created = await api<TaskTemplate>('/api/task-templates', {
          method: 'POST',
          body: JSON.stringify(templateForm)
        });
        setTaskTemplates(prev => [...prev, created]);
        toast.success('Template created');
      }
      setIsTemplateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save template');
    }
  };
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api(`/api/task-templates/${id}`, { method: 'DELETE' });
      setTaskTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setTemplateForm(prev => ({
      ...prev,
      checklist: [...(prev.checklist || []), newChecklistItem.trim()]
    }));
    setNewChecklistItem('');
  };
  const handleRemoveChecklistItem = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      checklist: (prev.checklist || []).filter((_, i) => i !== index)
    }));
  };
  const handleAddType = async () => {
    if (!newType.trim()) return;
    setIsAddingType(true);
    try {
      const created = await api<LivestockTypeConfig>('/api/livestock-types', {
        method: 'POST',
        body: JSON.stringify({ name: newType.trim() })
      });
      setLivestockTypes(prev => [...prev, created]);
      setNewType('');
      toast.success('Livestock type added');
    } catch (error) {
      toast.error('Failed to add type');
    } finally {
      setIsAddingType(false);
    }
  };
  const handleDeleteType = async (id: string) => {
    if (!confirm('Remove this livestock type?')) return;
    try {
      await api(`/api/livestock-types/${id}`, { method: 'DELETE' });
      setLivestockTypes(prev => prev.filter(t => t.id !== id));
      toast.success('Type removed');
    } catch (error) {
      toast.error('Failed to remove type');
    }
  };
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    try {
      const created = await api<TaskCategory>('/api/task-categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim(), color: newCategoryColor })
      });
      setTaskCategories(prev => [...prev, created]);
      setNewCategoryName('');
      toast.success('Category added');
    } catch (error) {
      toast.error('Failed to add category');
    } finally {
      setIsAddingCategory(false);
    }
  };
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api(`/api/task-categories/${id}`, { method: 'DELETE' });
      setTaskCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Task Templates</CardTitle>
            <CardDescription>Standard Operating Procedures (SOPs) for common tasks.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => openTemplateDialog()}>
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {taskTemplates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
              No templates defined. Create one to speed up task assignment.
            </div>
          ) : (
            <div className="space-y-2">
              {taskTemplates.map(template => (
                <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {template.title}
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full border uppercase",
                          template.priority === 'high' || template.priority === 'urgent' ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          {template.priority}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Due in {template.defaultDaysDue} days • {template.checklist?.length || 0} steps
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openTemplateDialog(template)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Task Categories</CardTitle>
          <CardDescription>Organize tasks by type for better labor tracking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g. Irrigation"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            <div className="w-32 space-y-2">
              <Label>Color</Label>
              <div className="flex gap-1">
                {['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#6B7280'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      newCategoryColor === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategoryColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleAddCategory} disabled={isAddingCategory || !newCategoryName.trim()}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {taskCategories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: cat.color || '#6B7280' }}>
                    <Tag className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => handleDeleteCategory(cat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {taskCategories.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No categories defined.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Livestock Configuration</CardTitle>
          <CardDescription>Define the types of animals you manage on your farm.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New animal type (e.g. Alpaca)"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
            />
            <Button onClick={handleAddType} disabled={isAddingType || !newType.trim()}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {livestockTypes.map(type => (
              <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <Tractor className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{type.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => handleDeleteType(type.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {livestockTypes.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No custom types defined.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Task Template'}</DialogTitle>
            <DialogDescription>Create a reusable template for common tasks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Title</Label>
                <Input
                  placeholder="e.g. Daily Feeding"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={templateForm.priority}
                    onValueChange={(v: any) => setTemplateForm({ ...templateForm, priority: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Due (Days)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={templateForm.defaultDaysDue}
                    onChange={(e) => setTemplateForm({ ...templateForm, defaultDaysDue: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Standard operating procedure details..."
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                />
              </div>
            </div>
            {/* Actionable Details Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                Actionable Details
              </h4>
              <div className="space-y-2">
                <Label className="text-xs">Checklist Steps</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add step (e.g. Check water level)"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddChecklistItem} disabled={!newChecklistItem.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {templateForm.checklist?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm group">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-3 w-3 text-muted-foreground" />
                        <span>{item}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveChecklistItem(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(!templateForm.checklist || templateForm.checklist.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">No steps added.</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Safety Notes
                </Label>
                <Textarea
                  placeholder="Warnings or safety precautions..."
                  value={templateForm.safetyNotes}
                  onChange={(e) => setTemplateForm({ ...templateForm, safetyNotes: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Required Resources (Tools/Inputs)</Label>
                <ResourcePicker
                  selected={templateForm.requiredResources || []}
                  onChange={(resources) => setTemplateForm({ ...templateForm, requiredResources: resources })}
                  inventory={inventory}
                  placeholder="Select from inventory or add custom..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-blue-500" />
                  Link Knowledge Guide
                </Label>
                <Select
                  value={templateForm.knowledgeEntryId}
                  onValueChange={(v) => setTemplateForm({ ...templateForm, knowledgeEntryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select article..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {knowledgeEntries.map(entry => (
                      <SelectItem key={entry.id} value={entry.id}>{entry.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={!templateForm.title}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}