import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Calendar, User as UserIcon, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskJournalEntry, User } from '@shared/types';
import { cn } from '@/lib/utils';
interface TaskJournalViewProps {
  tasks: Task[];
  users: User[];
}
type JournalEntryWithTask = TaskJournalEntry & {
  taskTitle: string;
  taskId: string;
};
export function TaskJournalView({ tasks, users }: TaskJournalViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const entries: JournalEntryWithTask[] = useMemo(() => {
    const allEntries: JournalEntryWithTask[] = [];
    tasks.forEach(task => {
      if (task.journal && task.journal.length > 0) {
        task.journal.forEach(entry => {
          allEntries.push({
            ...entry,
            taskTitle: task.title,
            taskId: task.id
          });
        });
      }
    });
    return allEntries.sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks]);
  const filteredEntries = useMemo(() => {
    if (categoryFilter === 'all') return entries;
    return entries.filter(e => e.category === categoryFilter);
  }, [entries, categoryFilter]);
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contractor_feedback': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'lesson_learned': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'contractor_feedback': return 'Contractor Feedback';
      case 'lesson_learned': return 'Lesson Learned';
      default: return 'General Note';
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          Journal Insights
        </h3>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="general">General Notes</SelectItem>
            <SelectItem value="contractor_feedback">Contractor Feedback</SelectItem>
            <SelectItem value="lesson_learned">Lessons Learned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="h-[600px] pr-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground">No journal entries found</h3>
            <p className="text-sm text-muted-foreground">Add notes to your tasks to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntries.map((entry) => {
              const author = users.find(u => u.id === entry.authorId);
              return (
                <Card key={`${entry.taskId}-${entry.id}`} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className={cn("mb-2", getCategoryColor(entry.category))}>
                        {getCategoryLabel(entry.category)}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(entry.createdAt, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <CardTitle className="text-base font-medium leading-tight">
                      {entry.taskTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
                      {entry.content}
                    </p>
                    {author && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                        <UserIcon className="h-3 w-3" />
                        <span>Logged by {author.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}