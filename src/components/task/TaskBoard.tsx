import React from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, User as UserIcon, Trash2, Edit, MapPin, Briefcase, DollarSign, Repeat, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, User, Field, TaskCategory } from '@shared/types';
interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  fields: Field[];
  categories: TaskCategory[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}
const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-900' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/20' },
  { id: 'review', title: 'Review', color: 'bg-purple-50 dark:bg-purple-950/20' },
  { id: 'done', title: 'Done', color: 'bg-emerald-50 dark:bg-emerald-950/20' },
];
export function TaskBoard({ tasks, users, fields, categories, onStatusChange, onDeleteTask, onEditTask }: TaskBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    // Find the task to check current status
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      onStatusChange(taskId, newStatus);
    }
  };
  const activeTask = tasks.find(t => t.id === activeId);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <TaskColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            tasks={tasks.filter((t) => t.status === col.id)}
            users={users}
            fields={fields}
            categories={categories}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard 
            task={activeTask} 
            users={users} 
            fields={fields} 
            categories={categories}
            onDeleteTask={() => {}} 
            onEditTask={() => {}} 
            isOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
interface TaskColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  users: User[];
  fields: Field[];
  categories: TaskCategory[];
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
}
function TaskColumn({ id, title, color, tasks, users, fields, categories, onDeleteTask, onEditTask }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 rounded-xl p-4 flex flex-col gap-3 h-full min-h-[500px]",
        color
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <Badge variant="secondary" className="bg-background/50">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            users={users}
            fields={fields}
            categories={categories}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
          />
        ))}
      </div>
    </div>
  );
}
interface TaskCardProps {
  task: Task;
  users: User[];
  fields: Field[];
  categories: TaskCategory[];
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  isOverlay?: boolean;
}
function TaskCard({ task, users, fields, categories, onDeleteTask, onEditTask, isOverlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };
  const fieldName = fields.find(f => f.id === task.relatedEntityId)?.name;
  const contractorCount = task.externalAssignments?.length || 0;
  const totalCost = (task.externalAssignments?.reduce((sum, a) => sum + a.cost, 0) || 0) + (task.cost || 0);
  const checklistTotal = task.checklist?.length || 0;
  const checklistCompleted = task.checklist?.filter(i => i.completed).length || 0;
  const progress = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;
  const category = categories.find(c => c.id === task.categoryId);
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
        isDragging ? "opacity-50" : "opacity-100",
        isOverlay ? "shadow-xl rotate-2 cursor-grabbing" : ""
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-sm leading-tight line-clamp-2">{task.title}</h4>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 text-muted-foreground hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                onEditTask(task);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
          {category && (
            <Badge 
              variant="secondary" 
              className="text-[10px] px-1.5 py-0 h-5 border text-white"
              style={{ backgroundColor: category.color || '#6B7280' }}
            >
              {category.name}
            </Badge>
          )}
          {task.recurrence && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 border bg-muted">
              <Repeat className="h-3 w-3 mr-1" /> {task.recurrence}
            </Badge>
          )}
          {task.dueDate && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border",
              new Date(task.dueDate) < new Date() && task.status !== 'done'
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
            )}>
              <Calendar className="h-3 w-3" />
              <span>{format(task.dueDate, 'MMM d')}</span>
            </div>
          )}
        </div>
        {checklistTotal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" /> Checklist</span>
              <span>{checklistCompleted}/{checklistTotal}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        <div className="flex flex-col gap-1 pt-1 border-t">
          <div className="flex items-center justify-between">
             {task.assigneeId ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center">
                    <UserIcon className="h-3 w-3" />
                  </div>
                  <span>{users.find(u => u.id === task.assigneeId)?.name || 'Unknown'}</span>
                </div>
              ) : <div />}
              {totalCost > 0 && (
                <div className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                  <DollarSign className="h-3 w-3" />
                  {totalCost}
                </div>
              )}
          </div>
          {(fieldName || contractorCount > 0) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {fieldName && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[80px]">{fieldName}</span>
                </div>
              )}
              {contractorCount > 0 && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  <span>{contractorCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}