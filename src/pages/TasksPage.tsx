import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, Calendar, User as UserIcon, Loader2, Trash2, LayoutGrid, List, Edit, DollarSign, Briefcase, MapPin, BookOpen, Lightbulb } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, User, TaskStatus, Contact, Field, TaskJournalEntry } from '@shared/types';
import { toast } from 'sonner';
import { useForm, useFieldArray, useWatch, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskBoard } from '@/components/task/TaskBoard';
import { TaskJournalView } from '@/components/task/TaskJournalView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
const assignmentSchema = z.object({
  contactId: z.string().min(1, 'Contact required'),
  cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Must be a non-negative number'),
});
const taskSchema = z.object({
  title: z.string().min(2, 'Title required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  relatedEntityId: z.string().optional(),
  externalAssignments: z.array(assignmentSchema).optional(),
});
type TaskFormValues = z.infer<typeof taskSchema>;
export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [activeTab, setActiveTab] = useState('tasks');
  // Journal State
  const [newJournalEntry, setNewJournalEntry] = useState('');
  const [journalCategory, setJournalCategory] = useState<'general' | 'contractor_feedback' | 'lesson_learned'>('general');
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      priority: 'medium',
      assigneeId: '',
      dueDate: '',
      relatedEntityId: '',
      externalAssignments: [],
    },
  });
  const { fields: assignmentFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'externalAssignments',
  });
  const watchedAssignments = useWatch({
    control: form.control,
    name: 'externalAssignments',
  });
  const totalCost = (watchedAssignments || []).reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, usersRes, contactsRes, fieldsRes] = await Promise.all([
        api<{ items: Task[] }>('/api/tasks'),
        api<{ items: User[] }>('/api/users'),
        api<{ items: Contact[] }>('/api/contacts'),
        api<{ items: Field[] }>('/api/fields')
      ]);
      setTasks(tasksRes.items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setUsers(usersRes.items);
      setContacts(contactsRes.items);
      setFields(fieldsRes.items);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const openDialog = (task?: Task) => {
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
          cost: a.cost.toString()
        })) || [],
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
      });
    }
    setIsDialogOpen(true);
  };
  const onSubmit: SubmitHandler<TaskFormValues> = async (data) => {
    try {
      const payload: any = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
        relatedEntityId: data.relatedEntityId === 'unassigned' ? undefined : data.relatedEntityId,
        assigneeId: data.assigneeId === 'unassigned' ? undefined : data.assigneeId,
        externalAssignments: data.externalAssignments?.map(a => ({
          contactId: a.contactId,
          cost: Number(a.cost)
        })),
      };
      // Handle Journal Entry
      if (newJournalEntry.trim()) {
        const entry: TaskJournalEntry = {
          id: crypto.randomUUID(),
          content: newJournalEntry.trim(),
          createdAt: Date.now(),
          category: journalCategory,
          // In a real app, we'd attach the current user ID here
        };
        // If editing, append to existing. If new, create array.
        // Note: For existing tasks, we rely on the backend to merge or we send the full list.
        // Since we don't have the full list in 'data', we need to handle this carefully.
        // For simplicity in this phase, we'll assume the backend handles appending if we send a special field or we merge here.
        // Let's merge here if editing.
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
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task');
    }
  };
  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTaskStatus(task.id, newStatus);
  };
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await api(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      toast.error('Failed to update status');
      fetchData();
    }
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
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return null;
    }
  };
  return (
    <AppLayout
      title="Tasks & Workforce"
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      }
    >
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update task details and assignment.' : 'Fill out the form below to assign a new task.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto pr-2">
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
                      <FormLabel>Related Field</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {fields.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* External Contractors Section */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> External Contractors
                  </h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ contactId: '', cost: '0' })}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {assignmentFields.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No external contractors assigned.</p>
                )}
                <div className="space-y-3">
                  {assignmentFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <FormField
                        control={form.control}
                        name={`externalAssignments.${index}.contactId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select contact" />
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
                      <FormField
                        control={form.control}
                        name={`externalAssignments.${index}.cost`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">$</span>
                                <Input type="number" className="pl-5" placeholder="Cost" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                {totalCost > 0 && (
                  <div className="mt-3 pt-3 border-t flex justify-end">
                    <span className="text-sm font-medium text-emerald-600">Total Est. Cost: ${totalCost.toFixed(2)}</span>
                  </div>
                )}
              </div>
              {/* Journal Section */}
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
          <TabsContent value="tasks">
            <div className="flex justify-end mb-4">
              <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
                <ToggleGroupItem value="list" aria-label="List View"><List className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="board" aria-label="Board View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
              </ToggleGroup>
            </div>
            {viewMode === 'board' ? (
              <div className="h-[calc(100vh-16rem)]">
                <TaskBoard
                  tasks={tasks}
                  users={users}
                  fields={fields}
                  onStatusChange={updateTaskStatus}
                  onDeleteTask={deleteTask}
                  onEditTask={openDialog}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.length === 0 ? (
                   <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed">
                     <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                     <h3 className="text-lg font-medium">All caught up!</h3>
                     <p className="text-muted-foreground mb-4">No pending tasks found.</p>
                     <Button onClick={() => openDialog()} variant="outline">Create Task</Button>
                   </div>
                ) : (
                  tasks.map((task) => {
                    const fieldName = fields.find(f => f.id === task.relatedEntityId)?.name;
                    const contractorCount = task.externalAssignments?.length || 0;
                    const totalTaskCost = (task.externalAssignments?.reduce((sum, a) => sum + a.cost, 0) || 0) + (task.cost || 0);
                    const journalCount = task.journal?.length || 0;
                    return (
                      <Card
                        key={task.id}
                        className={cn(
                          "transition-all duration-200 hover:shadow-md cursor-pointer group",
                          task.status === 'done' ? "opacity-60 bg-neutral-50 dark:bg-neutral-900" : "bg-white dark:bg-card"
                        )}
                        onClick={() => toggleStatus(task)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
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
                              {fieldName && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{fieldName}</span>
                                </div>
                              )}
                              {contractorCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{contractorCount} Contractor{contractorCount > 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {totalTaskCost > 0 && (
                                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <DollarSign className="h-3 w-3" />
                                  <span>${totalTaskCost}</span>
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
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDialog(task);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </AppLayout>
  );
}