import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CheckCircle2, Circle, Plus, Calendar, User as UserIcon, Loader2, Trash2, LayoutGrid, List, Edit, DollarSign, Briefcase, MapPin, BookOpen, Lightbulb, FileText, Package, Search, Filter, X, Wrench, Repeat, Copy, Square, ListTodo } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, User, TaskStatus, Contact, Field, TaskJournalEntry, TaskTemplate, InventoryItem, TaskMaterial, InventoryCategory, KnowledgeEntry, TaskChecklistItem, TaskCategory } from '@shared/types';
import { toast } from 'sonner';
import { useForm, useFieldArray, useWatch, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskBoard } from '@/components/task/TaskBoard';
import { TaskJournalView } from '@/components/task/TaskJournalView';
import { TaskMaterials } from '@/components/task/TaskMaterials';
import { TaskChecklist } from '@/components/task/TaskChecklist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useFarmStore } from '@/lib/farm-store';
import { useFormatting } from '@/hooks/use-formatting';
import { useSearchParams } from 'react-router-dom';
import { SelectionBar } from '@/components/ui/selection-bar';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { EmptyState } from '@/components/ui/empty-state';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PrintButton } from '@/components/ui/print-button';
const assignmentSchema = z.object({
  contactId: z.string().min(1, 'Contact required'),
  cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Must be a non-negative number'),
  duration: z.string().optional(),
  rate: z.string().optional(),
  rateUnit: z.string().optional(),
});
const materialSchema = z.object({
  inventoryId: z.string().min(1, 'Item required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be positive'),
  name: z.string().optional(),
  unit: z.string().optional(),
  cost: z.number().optional(),
});
const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Item text required"),
  completed: z.boolean()
});
const taskSchema = z.object({
  title: z.string().min(2, 'Title required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  relatedEntityId: z.string().optional(),
  externalAssignments: z.array(assignmentSchema).optional(),
  materials: z.array(materialSchema).optional(),
  checklist: z.array(checklistItemSchema).optional(),
  description: z.string().optional(),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurrenceEndsOn: z.string().optional(),
});
type TaskFormValues = z.infer<typeof taskSchema>;
export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [activeTab, setActiveTab] = useState('tasks');
  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  // Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  // Journal State
  const [newJournalEntry, setNewJournalEntry] = useState('');
  const [journalCategory, setJournalCategory] = useState<'general' | 'contractor_feedback' | 'lesson_learned'>('general');
  // Currency
  const settings = useFarmStore((state) => state.settings);
  const currencySymbol = settings?.currency || 'USD';
  const { formatCurrency } = useFormatting();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      priority: 'medium',
      assigneeId: '',
      dueDate: '',
      relatedEntityId: '',
      externalAssignments: [],
      materials: [],
      checklist: [],
      description: '',
      recurrence: undefined,
      recurrenceEndsOn: '',
    },
  });
  const { fields: assignmentFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'externalAssignments',
  });
  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control: form.control,
    name: 'materials',
  });
  const watchedAssignments = useWatch({
    control: form.control,
    name: 'externalAssignments',
  });
  const totalCost = (watchedAssignments || []).reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, usersRes, contactsRes, fieldsRes, templatesRes, inventoryRes, catRes, knowledgeRes, taskCatsRes] = await Promise.all([
        api<{ items: Task[] }>('/api/tasks'),
        api<{ items: User[] }>('/api/users'),
        api<{ items: Contact[] }>('/api/contacts'),
        api<{ items: Field[] }>('/api/fields'),
        api<{ items: TaskTemplate[] }>('/api/task-templates'),
        api<{ items: InventoryItem[] }>('/api/inventory'),
        api<{ items: InventoryCategory[] }>('/api/inventory-categories'),
        api<{ items: KnowledgeEntry[] }>('/api/knowledge?limit=1000'),
        api<{ items: TaskCategory[] }>('/api/task-categories')
      ]);
      setTasks(tasksRes.items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setUsers(usersRes.items);
      setContacts(contactsRes.items);
      setFields(fieldsRes.items);
      setTemplates(templatesRes.items);
      setInventory(inventoryRes.items);
      setCategories(catRes.items);
      setKnowledgeEntries(knowledgeRes.items);
      setTaskCategories(taskCatsRes.items);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const openDialog = useCallback((task?: Task) => {
    setNewJournalEntry('');
    setJournalCategory('general');
    if (task) {
      setEditingTask(task);
      form.reset({
        title: task.title,
        priority: task.priority,
        assigneeId: task.assigneeId || 'unassigned',
        dueDate: task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '',
        relatedEntityId: task.relatedEntityId || 'unassigned',
        externalAssignments: task.externalAssignments?.map(a => ({
          contactId: a.contactId,
          cost: a.cost.toString(),
          duration: a.duration?.toString() || '',
          rate: a.rate?.toString() || '',
          rateUnit: a.rateUnit || ''
        })) || [],
        materials: task.materials?.map(m => ({
          inventoryId: m.inventoryId,
          amount: m.amount.toString(),
          name: m.name,
          unit: m.unit,
          cost: m.cost
        })) || [],
        checklist: task.checklist || [],
        description: task.description || '',
        recurrence: task.recurrence,
        recurrenceEndsOn: task.recurrenceEndsOn ? format(task.recurrenceEndsOn, 'yyyy-MM-dd') : '',
      });
    } else {
      setEditingTask(null);
      form.reset({
        title: '',
        priority: 'medium',
        assigneeId: 'unassigned',
        dueDate: '',
        relatedEntityId: 'unassigned',
        externalAssignments: [],
        materials: [],
        checklist: [],
        description: '',
        recurrence: undefined,
        recurrenceEndsOn: '',
      });
    }
    setIsDialogOpen(true);
  }, [form]);
  useEffect(() => {
    if (!isLoading && tasks.length > 0) {
      const taskId = searchParams.get('taskId');
      if (taskId && !isDialogOpen) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          openDialog(task);
        }
      }
    }
  }, [isLoading, tasks, searchParams, openDialog, isDialogOpen]);
  // Filter Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Text Search
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      // Priority Filter
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
      // Assignee Filter
      const matchesAssignee = assigneeFilter.length === 0 ||
        (task.assigneeId && assigneeFilter.includes(task.assigneeId)) ||
        (!task.assigneeId && assigneeFilter.includes('unassigned'));
      // Status Filter
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status);
      return matchesSearch && matchesPriority && matchesAssignee && matchesStatus;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter, statusFilter]);
  // Filter Options
  const assigneeOptions = useMemo(() => {
    const options = users.map(u => ({ label: u.name, value: u.id }));
    options.unshift({ label: 'Unassigned', value: 'unassigned' });
    return options;
  }, [users]);
  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];
  const statusOptions = [
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Review', value: 'review' },
    { label: 'Done', value: 'done' },
  ];
  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter([]);
    setAssigneeFilter([]);
    setStatusFilter([]);
  };
  const activeFilterCount = (searchQuery ? 1 : 0) + priorityFilter.length + assigneeFilter.length + statusFilter.length;
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    form.setValue('title', template.title);
    form.setValue('priority', template.priority);
    if (template.defaultAssigneeId) {
      form.setValue('assigneeId', template.defaultAssigneeId);
    }
    if (template.defaultDaysDue !== undefined && template.defaultDaysDue > 0) {
      const dueDate = addDays(new Date(), template.defaultDaysDue);
      form.setValue('dueDate', format(dueDate, 'yyyy-MM-dd'));
    }
    // Construct Rich Description
    let richDescription = template.description || '';
    if (template.safetyNotes) {
      richDescription += `\n\n⚠️ SAFETY NOTES:\n${template.safetyNotes}`;
    }
    if (template.knowledgeEntryId) {
      const entry = knowledgeEntries.find(k => k.id === template.knowledgeEntryId);
      if (entry) {
        richDescription += `\n\n📖 REFERENCE GUIDE: ${entry.title} (Check Knowledge Base)`;
      }
    }
    // Populate Checklist
    if (template.checklist && template.checklist.length > 0) {
      const checklistItems = template.checklist.map(text => ({
        id: crypto.randomUUID(),
        text,
        completed: false
      }));
      form.setValue('checklist', checklistItems);
    } else {
      form.setValue('checklist', []);
    }
    // Smart Material Matching
    const missingResources: string[] = [];
    // Clear existing materials first
    form.setValue('materials', []);
    if (template.requiredResources && template.requiredResources.length > 0) {
      template.requiredResources.forEach(resourceName => {
        // Fuzzy match inventory
        const match = inventory.find(i => i.name.toLowerCase().includes(resourceName.toLowerCase()));
        if (match) {
          appendMaterial({
            inventoryId: match.id,
            amount: '1', // Default to 1 unit
            name: match.name,
            unit: match.unit,
            cost: match.unitCost ? match.unitCost : 0
          });
        } else {
          missingResources.push(resourceName);
        }
      });
      if (missingResources.length > 0) {
        richDescription += `\n\nMISSING RESOURCES:\n${missingResources.map(r => `- ${r}`).join('\n')}`;
      }
    }
    form.setValue('description', richDescription);
    toast.success('Template loaded with actionable details');
  };
  const handleContactChange = (index: number, contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      const currentValues = form.getValues(`externalAssignments.${index}`);
      const rate = contact.defaultRate?.toString() || '';
      const rateUnit = contact.rateUnit || '';
      form.setValue(`externalAssignments.${index}.contactId`, contactId);
      form.setValue(`externalAssignments.${index}.rate`, rate);
      form.setValue(`externalAssignments.${index}.rateUnit`, rateUnit);
      if (rate && currentValues.duration) {
        const cost = (Number(rate) * Number(currentValues.duration)).toString();
        form.setValue(`externalAssignments.${index}.cost`, cost);
      }
    }
  };
  const handleDurationOrRateChange = (index: number) => {
    const values = form.getValues(`externalAssignments.${index}`);
    const rate = Number(values.rate);
    const duration = Number(values.duration);
    if (!isNaN(rate) && !isNaN(duration) && rate > 0 && duration > 0) {
      const cost = (rate * duration).toString();
      form.setValue(`externalAssignments.${index}.cost`, cost);
    }
  };
  const onSubmit: SubmitHandler<TaskFormValues> = async (data) => {
    try {
      const processedMaterials: TaskMaterial[] = (data.materials || []).map(m => {
        const item = inventory.find(i => i.id === m.inventoryId);
        const amount = Number(m.amount);
        const unitCost = item?.unitCost || 0;
        return {
          inventoryId: m.inventoryId,
          name: item?.name || 'Unknown Item',
          amount: amount,
          unit: item?.unit || 'units',
          cost: amount * unitCost
        };
      });
      if (!editingTask) {
        for (const mat of processedMaterials) {
          const item = inventory.find(i => i.id === mat.inventoryId);
          if (item) {
            const newQuantity = Math.max(0, item.quantity - mat.amount);
            await api(`/api/inventory/${item.id}`, {
              method: 'PUT',
              body: JSON.stringify({ quantity: newQuantity })
            });
          }
        }
      }
      const payload: any = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
        relatedEntityId: data.relatedEntityId === 'unassigned' ? undefined : data.relatedEntityId,
        assigneeId: data.assigneeId === 'unassigned' ? undefined : data.assigneeId,
        externalAssignments: data.externalAssignments?.map(a => ({
          contactId: a.contactId,
          cost: Number(a.cost),
          duration: a.duration ? Number(a.duration) : undefined,
          rate: a.rate ? Number(a.rate) : undefined,
          rateUnit: a.rateUnit
        })),
        materials: processedMaterials,
        checklist: data.checklist,
        recurrence: data.recurrence,
        recurrenceEndsOn: data.recurrenceEndsOn ? new Date(data.recurrenceEndsOn).getTime() : undefined,
      };
      if (newJournalEntry.trim()) {
        const entry: TaskJournalEntry = {
          id: crypto.randomUUID(),
          content: newJournalEntry.trim(),
          createdAt: Date.now(),
          category: journalCategory,
        };
        if (editingTask) {
          payload.journal = [...(editingTask.journal || []), entry];
        } else {
          payload.journal = [entry];
        }
      }
      if (editingTask) {
        const updated = await api<Task>(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        toast.success('Task updated');
      } else {
        const created = await api<Task>('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setTasks(prev => [created, ...prev]);
        toast.success('Task created');
        if (processedMaterials.length > 0) {
          toast.success('Inventory deducted for materials');
          const invRes = await api<{ items: InventoryItem[] }>('/api/inventory');
          setInventory(invRes.items);
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task');
    }
  };
  const calculateNextDate = (currentDate: number, recurrence: string): Date => {
    const date = new Date(currentDate);
    switch (recurrence) {
      case 'daily': return addDays(date, 1);
      case 'weekly': return addWeeks(date, 1);
      case 'monthly': return addMonths(date, 1);
      case 'yearly': return addYears(date, 1);
      default: return date;
    }
  };
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      // Find the task to check for recurrence logic
      const task = tasks.find(t => t.id === taskId);
      await api(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      // Handle Recurrence if completing
      if (newStatus === 'done' && task?.recurrence && task.dueDate) {
        const nextDate = calculateNextDate(task.dueDate, task.recurrence);
        // Check end date
        if (task.recurrenceEndsOn && nextDate.getTime() > task.recurrenceEndsOn) {
           return; // Recurrence ended
        }
        // Create next task
        const newTaskPayload = {
            ...task,
            id: undefined, // Let backend generate
            status: 'todo',
            dueDate: nextDate.getTime(),
            createdAt: Date.now(),
            // Keep recurrence settings for the next one too
        };
        // Clean up fields that shouldn't be copied directly if they are specific to the instance
        const { id, transactionId, ...rest } = newTaskPayload;
        const created = await api<Task>('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(rest)
        });
        setTasks(prev => [created, ...prev]);
        toast.success('Next recurring task created');
      }
    } catch (error) {
      toast.error('Failed to update status');
      fetchData();
    }
  };
  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTaskStatus(task.id, newStatus);
  };
  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };
  const duplicateTask = async (task: Task) => {
    try {
      // Create a copy without ID and with 'todo' status
      // Also strip transactionId to avoid linking to the old transaction
      const { id, transactionId, createdAt, ...rest } = task;
      const newTask = {
        ...rest,
        title: `${rest.title} (Copy)`,
        status: 'todo' as const,
        createdAt: Date.now()
      };
      const created = await api<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask)
      });
      setTasks(prev => [created, ...prev]);
      toast.success('Task duplicated');
    } catch (error) {
      toast.error('Failed to duplicate task');
    }
  };
  // Bulk Actions
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTaskIds(newSet);
  };
  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };
  const handleBulkAction = async (action: 'delete' | 'status', status?: string) => {
    if (selectedTaskIds.size === 0) return;
    if (action === 'delete') {
        if (!confirm(`Delete ${selectedTaskIds.size} tasks?`)) return;
    }
    try {
        const ids = Array.from(selectedTaskIds);
        await api('/api/tasks/bulk', {
            method: 'POST',
            body: JSON.stringify({ ids, action, status })
        });
        if (action === 'delete') {
            setTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id)));
            toast.success(`Deleted ${ids.length} tasks`);
        } else if (action === 'status' && status) {
            setTasks(prev => prev.map(t => selectedTaskIds.has(t.id) ? { ...t, status: status as TaskStatus } : t));
            toast.success(`Updated ${ids.length} tasks`);
        }
        clearSelection();
    } catch (error) {
        toast.error('Bulk action failed');
    }
  };
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return null;
    }
  };
  // Filter inventory for Equipment & Assets
  const equipmentItems = useMemo(() => {
    return inventory.filter(item => {
      const categoryName = categories.find(c => c.id === item.categoryId)?.name.toLowerCase() || item.category.toLowerCase();
      return ['equipment', 'tools', 'machinery', 'vehicle'].some(keyword => categoryName.includes(keyword));
    });
  }, [inventory, categories]);
  return (
    <AppLayout
      title="Tasks & Workforce"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      }
    >
      {/* Printable Job Cards Section - Hidden on screen */}
      <div className="hidden print:block space-y-8 p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Job Cards</h1>
          <p className="text-sm text-gray-500">Generated on {format(new Date(), 'PPP')}</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {filteredTasks.map(task => {
             const fieldName = fields.find(f => f.id === task.relatedEntityId)?.name;
             const assigneeName = users.find(u => u.id === task.assigneeId)?.name || 'Unassigned';
             return (
               <div key={task.id} className="border-2 border-black p-6 rounded-lg break-inside-avoid print-break-inside-avoid">
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="text-xl font-bold">{task.title}</h3>
                   <span className="border border-black px-2 py-1 text-sm font-bold uppercase">{task.priority}</span>
                 </div>
                 <div className="space-y-2 mb-6">
                   <div className="flex items-center gap-2">
                     <span className="font-bold">Due:</span> {task.dueDate ? format(task.dueDate, 'MMM d, yyyy') : 'No Date'}
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="font-bold">Assignee:</span> {assigneeName}
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="font-bold">Location:</span> {fieldName || 'General'}
                   </div>
                 </div>
                 {task.description && (
                   <div className="mb-6 p-3 bg-gray-100 border border-gray-300 rounded">
                     <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                   </div>
                 )}
                 {task.checklist && task.checklist.length > 0 && (
                   <div className="mb-6">
                     <h4 className="font-bold mb-2">Checklist:</h4>
                     <ul className="list-none space-y-2">
                       {task.checklist.map(item => (
                         <li key={item.id} className="flex items-center gap-2">
                           <div className="w-4 h-4 border border-black"></div>
                           <span>{item.text}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
                 <div className="border-t-2 border-black pt-4 mt-auto">
                   <div className="flex items-center gap-3 mb-2">
                     <Square className="h-6 w-6" />
                     <span className="font-bold">Task Completed</span>
                   </div>
                   <div className="flex justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-300">
                     <span>Signature: _______________________</span>
                     <span>Date: _______________</span>
                   </div>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update task details and assignment.' : 'Fill out the form below to assign a new task.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto pr-2">
              {!editingTask && templates.length > 0 && (
                <div className="bg-muted/30 p-3 rounded-lg border mb-2">
                  <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Load Template (Optional)
                  </Label>
                  <Select onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="bg-background h-8 text-sm">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="What needs to be done?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Details, instructions, location notes..." className="h-20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recurrenceEndsOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence Ends On</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee (Internal)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relatedEntityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Entity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          <SelectGroup>
                            <SelectLabel>Fields & Locations</SelectLabel>
                            {fields.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                          </SelectGroup>
                          {equipmentItems.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Equipment & Assets</SelectLabel>
                              {equipmentItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Tabs defaultValue="checklist" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  <TabsTrigger value="contractors">Contractors</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                </TabsList>
                <TabsContent value="checklist" className="mt-4">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <TaskChecklist control={form.control} name="checklist" />
                  </div>
                </TabsContent>
                <TabsContent value="contractors" className="mt-4">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> External Contractors
                      </h4>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ contactId: '', cost: '0', duration: '', rate: '', rateUnit: '' })}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {assignmentFields.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No external contractors assigned.</p>
                    )}
                    <div className="space-y-3">
                      {assignmentFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-background p-2 rounded border">
                          <div className="col-span-4">
                            <FormField
                              control={form.control}
                              name={`externalAssignments.${index}.contactId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Label className="text-xs">Contractor</Label>
                                  <Select
                                    onValueChange={(val) => handleContactChange(index, val)}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Select..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {contacts.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-2">
                            <FormField
                              control={form.control}
                              name={`externalAssignments.${index}.rate`}
                              render={({ field }) => (
                                <FormItem>
                                  <Label className="text-xs">Rate</Label>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      className="h-8 text-xs"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        handleDurationOrRateChange(index);
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-2">
                            <FormField
                              control={form.control}
                              name={`externalAssignments.${index}.duration`}
                              render={({ field }) => (
                                <FormItem>
                                  <Label className="text-xs">Duration</Label>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      className="h-8 text-xs"
                                      placeholder="Hrs/Days"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        handleDurationOrRateChange(index);
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-3">
                            <FormField
                              control={form.control}
                              name={`externalAssignments.${index}.cost`}
                              render={({ field }) => (
                                <FormItem>
                                  <Label className="text-xs">Total Cost</Label>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-2 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                                      <Input type="number" className="pl-8 h-8 text-xs font-medium" placeholder="0.00" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-1 flex items-end justify-center pb-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalCost > 0 && (
                      <div className="mt-3 pt-3 border-t flex justify-end">
                        <span className="text-sm font-medium text-emerald-600">Total Labor Cost: {formatCurrency(totalCost)}</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="materials" className="mt-4">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <TaskMaterials control={form.control} inventory={inventory} />
                  </div>
                </TabsContent>
              </Tabs>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-medium">Journal & Notes</h4>
                </div>
                {editingTask && editingTask.journal && editingTask.journal.length > 0 && (
                  <div className="mb-4 space-y-2 max-h-[150px] overflow-y-auto pr-2">
                    {editingTask.journal.map(entry => (
                      <div key={entry.id} className="text-xs bg-background p-2 rounded border">
                        <div className="flex justify-between mb-1">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{entry.category.replace('_', ' ')}</Badge>
                          <span className="text-muted-foreground">{format(entry.createdAt, 'MMM d')}</span>
                        </div>
                        <p>{entry.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select value={journalCategory} onValueChange={(v: any) => setJournalCategory(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Note</SelectItem>
                        <SelectItem value="contractor_feedback">Contractor Feedback</SelectItem>
                        <SelectItem value="lesson_learned">Lesson Learned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Add a new note, observation, or feedback..."
                    value={newJournalEntry}
                    onChange={(e) => setNewJournalEntry(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <List className="h-4 w-4" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Insights & Journal
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tasks" className="space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-lg border">
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  <div className="w-40 flex-shrink-0">
                    <MultiSelect
                      options={priorityOptions}
                      selected={priorityFilter}
                      onChange={setPriorityFilter}
                      placeholder="Priority"
                    />
                  </div>
                  <div className="w-48 flex-shrink-0">
                    <MultiSelect
                      options={assigneeOptions}
                      selected={assigneeFilter}
                      onChange={setAssigneeFilter}
                      placeholder="Assignee"
                    />
                  </div>
                  <div className="w-40 flex-shrink-0">
                    <MultiSelect
                      options={statusOptions}
                      selected={statusFilter}
                      onChange={setStatusFilter}
                      placeholder="Status"
                    />
                  </div>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
                  <ToggleGroupItem value="list" aria-label="List View"><List className="h-4 w-4" /></ToggleGroupItem>
                  <ToggleGroupItem value="board" aria-label="Board View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            {viewMode === 'board' ? (
              <div className="h-[calc(100vh-16rem)]">
                <TaskBoard
                  tasks={filteredTasks}
                  users={users}
                  fields={fields}
                  categories={taskCategories}
                  onStatusChange={updateTaskStatus}
                  onDeleteTask={deleteTask}
                  onEditTask={openDialog}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                   <EmptyState
                     icon={CheckCircle2}
                     title="No tasks found"
                     description="Try adjusting your filters or create a new task."
                     action={
                       <Button onClick={() => openDialog()} variant="outline">Create Task</Button>
                     }
                   />
                ) : (
                  filteredTasks.map((task) => {
                    const fieldName = fields.find(f => f.id === task.relatedEntityId)?.name;
                    const inventoryName = inventory.find(i => i.id === task.relatedEntityId)?.name;
                    const relatedName = fieldName || inventoryName;
                    const isEquipment = !!inventoryName;
                    const contractorCount = task.externalAssignments?.length || 0;
                    const totalTaskCost = (task.externalAssignments?.reduce((sum, a) => sum + a.cost, 0) || 0) + (task.cost || 0) + (task.materials?.reduce((sum, m) => sum + m.cost, 0) || 0);
                    const journalCount = task.journal?.length || 0;
                    const materialCount = task.materials?.length || 0;
                    const isSelected = selectedTaskIds.has(task.id);
                    const checklistTotal = task.checklist?.length || 0;
                    const checklistCompleted = task.checklist?.filter(i => i.completed).length || 0;
                    const category = taskCategories.find(c => c.id === task.categoryId);
                    return (
                      <Card
                        key={task.id}
                        className={cn(
                          "transition-all duration-200 hover:shadow-md cursor-pointer group",
                          task.status === 'done' ? "opacity-60 bg-neutral-50 dark:bg-neutral-900" : "bg-white dark:bg-card",
                          isSelected && "border-emerald-500 bg-emerald-50/10"
                        )}
                        onClick={() => toggleStatus(task)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                             <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelection(task.id)}
                                className="mr-4"
                             />
                          </div>
                          <div className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            task.status === 'done'
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-muted-foreground/30 group-hover:border-emerald-500"
                          )}>
                            {task.status === 'done' && <CheckCircle2 className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={cn(
                                "font-medium truncate",
                                task.status === 'done' && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </h3>
                              {getPriorityBadge(task.priority)}
                              {category && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs text-white border-none"
                                  style={{ backgroundColor: category.color || '#6B7280' }}
                                >
                                  {category.name}
                                </Badge>
                              )}
                              {task.recurrence && (
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                  <Repeat className="h-3 w-3" /> {task.recurrence}
                                </Badge>
                              )}
                              {checklistTotal > 0 && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                  <ListTodo className="h-3 w-3" /> {checklistCompleted}/{checklistTotal}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(task.dueDate, 'MMM d')}</span>
                                </div>
                              )}
                              {task.assigneeId && (
                                <div className="flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" />
                                  <span>{users.find(u => u.id === task.assigneeId)?.name || 'Unknown'}</span>
                                </div>
                              )}
                              {relatedName && (
                                <div className="flex items-center gap-1">
                                  {isEquipment ? <Wrench className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                  <span>{relatedName}</span>
                                </div>
                              )}
                              {contractorCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{contractorCount} Contractor{contractorCount > 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {materialCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  <span>{materialCount} Material{materialCount > 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {totalTaskCost > 0 && (
                                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <DollarSign className="h-3 w-3" />
                                  <span>{formatCurrency(totalTaskCost)}</span>
                                </div>
                              )}
                              {journalCount > 0 && (
                                <div className="flex items-center gap-1 text-blue-600 font-medium">
                                  <BookOpen className="h-3 w-3" />
                                  <span>{journalCount} Note{journalCount > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDialog(task)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicateTask(task)}>
                                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteTask(task.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="insights">
            <TaskJournalView tasks={tasks} users={users} />
          </TabsContent>
        </Tabs>
      )}
      <SelectionBar
        count={selectedTaskIds.size}
        onClear={clearSelection}
        label="tasks selected"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => handleBulkAction('status', 'done')}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Done
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkAction('status', 'todo')}>
              <Circle className="h-4 w-4 mr-2" /> Mark Todo
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </>
        }
      />
    </AppLayout>
  );
}