import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, MapPin, Tractor, Filter, Edit, Trash2, Loader2, BookOpen } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { JournalEntry, Field, Livestock } from '@shared/types';
import { toast } from 'sonner';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { JournalEntryDialog } from '@/components/journal/JournalEntryDialog';
import { EmptyState } from '@/components/ui/empty-state';
export function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [journalRes, fieldsRes, livestockRes] = await Promise.all([
        api<{ items: JournalEntry[] }>('/api/journal?limit=1000'),
        api<{ items: Field[] }>('/api/fields?limit=1000'),
        api<{ items: Livestock[] }>('/api/livestock?limit=1000'),
      ]);
      setEntries(journalRes.items.sort((a, b) => b.date - a.date));
      setFields(fieldsRes.items);
      setLivestock(livestockRes.items);
    } catch (error) {
      toast.error('Failed to load journal data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleSaveEntry = async (data: Partial<JournalEntry>) => {
    try {
      if (selectedEntry) {
        const updated = await api<JournalEntry>(`/api/journal/${selectedEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
        toast.success('Entry updated');
      } else {
        const created = await api<JournalEntry>('/api/journal', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setEntries(prev => [created, ...prev]);
        toast.success('Entry created');
      }
    } catch (error) {
      toast.error('Failed to save entry');
    }
  };
  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await api(`/api/journal/${id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };
  const openDialog = (entry?: JournalEntry) => {
    setSelectedEntry(entry || null);
    setIsDialogOpen(true);
  };
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, categoryFilter]);
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: JournalEntry[] } = {};
    filteredEntries.forEach(entry => {
      let key = format(entry.date, 'MMMM d, yyyy');
      if (isToday(entry.date)) key = 'Today';
      if (isYesterday(entry.date)) key = 'Yesterday';
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [filteredEntries]);
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'observation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200';
      case 'weather': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200';
      case 'incident': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };
  const getRelatedEntityLabel = (entry: JournalEntry) => {
    if (!entry.relatedEntityId || !entry.relatedEntityType) return null;
    if (entry.relatedEntityType === 'field') {
      const field = fields.find(f => f.id === entry.relatedEntityId);
      return field ? { icon: MapPin, text: field.name } : null;
    }
    if (entry.relatedEntityType === 'livestock') {
      const animal = livestock.find(l => l.id === entry.relatedEntityId);
      return animal ? { icon: Tractor, text: `${animal.tag} (${animal.type})` } : null;
    }
    return null;
  };
  return (
    <AppLayout
      title="Farm Journal"
      actions={
        <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Entry
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="observation">Observation</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Timeline */}
          {Object.keys(groupedEntries).length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No journal entries found"
              description="Start logging your daily observations."
              action={<Button onClick={() => openDialog()} variant="outline">Create Entry</Button>}
            />
          ) : (
            <div className="space-y-8 relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border hidden md:block" />
              {Object.entries(groupedEntries).map(([dateLabel, dayEntries]) => (
                <div key={dateLabel} className="relative">
                  <div className="sticky top-20 z-10 mb-4 md:ml-10">
                    <span className="bg-background px-3 py-1 rounded-full border text-sm font-medium text-muted-foreground shadow-sm">
                      {dateLabel}
                    </span>
                  </div>
                  <div className="space-y-4 md:ml-10">
                    {dayEntries.map(entry => {
                      const related = getRelatedEntityLabel(entry);
                      return (
                        <Card key={entry.id} className="hover:shadow-md transition-shadow relative group">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[41px] top-6 h-4 w-4 rounded-full border-4 border-background bg-emerald-500 hidden md:block" />
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={cn("capitalize border", getCategoryColor(entry.category))}>
                                  {entry.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(entry.createdAt, 'h:mm a')}
                                </span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDialog(entry)}>
                                  <Edit className="h-3 w-3 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteEntry(entry.id)}>
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap mb-3">{entry.content}</p>
                            <div className="flex flex-wrap gap-2 items-center">
                              {related && (
                                <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal bg-muted/50">
                                  <related.icon className="h-3 w-3" />
                                  {related.text}
                                </Badge>
                              )}
                              {entry.tags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs font-normal text-muted-foreground">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <JournalEntryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEntry}
        entry={selectedEntry}
        fields={fields}
        livestock={livestock}
      />
    </AppLayout>
  );
}