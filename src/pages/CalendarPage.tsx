import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalendarGrid, CalendarEvent } from '@/components/calendar/CalendarGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon, Filter, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, Crop, ComplianceLog, Livestock, HealthLog, ResourceLog, WeatherLog } from '@shared/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { WeatherLogDialog } from '@/components/weather/WeatherLogDialog';
export function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWeatherDialogOpen, setIsWeatherDialogOpen] = useState(false);
  const [selectedWeatherLog, setSelectedWeatherLog] = useState<WeatherLog | null>(null);
  // Filters
  const [filters, setFilters] = useState({
    task: true,
    crop: true,
    compliance: true,
    livestock: true,
    resource: false,
    weather: true,
  });
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch data with higher limits to populate calendar
      const [tasksRes, cropsRes, complianceRes, livestockRes, healthRes, resourcesRes, weatherRes] = await Promise.all([
        api<{ items: Task[] }>('/api/tasks?limit=1000'),
        api<{ items: Crop[] }>('/api/crops?limit=1000'),
        api<{ items: ComplianceLog[] }>('/api/compliance?limit=1000'),
        api<{ items: Livestock[] }>('/api/livestock?limit=1000'),
        api<{ items: HealthLog[] }>('/api/health-logs?limit=1000'),
        api<{ items: ResourceLog[] }>('/api/resources?limit=1000'),
        api<{ items: WeatherLog[] }>('/api/weather?limit=1000'),
      ]);
      const newEvents: CalendarEvent[] = [];
      // 1. Tasks
      tasksRes.items.forEach(task => {
        if (task.dueDate) {
          newEvents.push({
            id: task.id,
            title: task.title,
            date: task.dueDate,
            type: 'task',
            status: task.status,
            color: task.priority === 'urgent' || task.priority === 'high'
              ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
            details: `Status: ${task.status} • Priority: ${task.priority}`,
            originalData: task
          });
        }
      });
      // 2. Crops (Planting & Harvest)
      cropsRes.items.forEach(crop => {
        // Planting
        newEvents.push({
          id: `plant-${crop.id}`,
          title: `Plant: ${crop.name}`,
          date: crop.plantingDate,
          type: 'crop-plant',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
          details: `Variety: ${crop.variety} • Field: ${crop.fieldId}`,
          originalData: crop
        });
        // Harvest
        if (crop.estimatedHarvestDate) {
          newEvents.push({
            id: `harvest-${crop.id}`,
            title: `Harvest: ${crop.name}`,
            date: crop.estimatedHarvestDate,
            type: 'crop-harvest',
            color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
            details: `Expected Yield: ${crop.expectedYield || '?'} ${crop.yieldUnit || ''}`,
            originalData: crop
          });
        }
      });
      // 3. Compliance
      complianceRes.items.forEach(log => {
        if (log.nextDueDate) {
          newEvents.push({
            id: log.id,
            title: `Due: ${log.title}`,
            date: log.nextDueDate,
            type: 'compliance',
            color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
            details: `Type: ${log.type} • Status: ${log.status}`,
            originalData: log
          });
        }
      });
      // 4. Livestock (Births/Purchases)
      livestockRes.items.forEach(animal => {
        const date = animal.birthDate || animal.purchaseDate;
        if (date) {
          newEvents.push({
            id: animal.id,
            title: `New ${animal.type}: ${animal.tag}`,
            date: date,
            type: 'livestock',
            color: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
            details: `Breed: ${animal.breed} • Origin: ${animal.origin}`,
            originalData: animal
          });
        }
      });
      // 5. Health Logs
      healthRes.items.forEach(log => {
        newEvents.push({
          id: log.id,
          title: `Vet: ${log.type}`,
          date: log.date,
          type: 'health',
          color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300',
          details: log.description,
          originalData: log
        });
      });
      // 6. Resources
      resourcesRes.items.forEach(log => {
        newEvents.push({
          id: log.id,
          title: `${log.type === 'energy' ? '���' : '💧'} ${log.amount} ${log.unit}`,
          date: log.date,
          type: 'resource',
          color: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
          details: `${log.flow} from ${log.source}`,
          originalData: log
        });
      });
      // 7. Weather
      weatherRes.items.forEach(log => {
        newEvents.push({
          id: log.id,
          title: `${log.condition} ${log.tempHigh ? `${log.tempHigh}°` : ''}`,
          date: log.date,
          type: 'weather',
          color: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300',
          details: `High: ${log.tempHigh || '-'}° • Low: ${log.tempLow || '-'}° • Precip: ${log.precipitation || 0}"`,
          originalData: log
        });
      });
      setEvents(newEvents);
    } catch (error) {
      console.error('Failed to load calendar data', error);
      toast.error('Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.type === 'task' && !filters.task) return false;
      if ((e.type === 'crop-plant' || e.type === 'crop-harvest') && !filters.crop) return false;
      if (e.type === 'compliance' && !filters.compliance) return false;
      if ((e.type === 'livestock' || e.type === 'health') && !filters.livestock) return false;
      if (e.type === 'resource' && !filters.resource) return false;
      if (e.type === 'weather' && !filters.weather) return false;
      return true;
    });
  }, [events, filters]);
  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'weather') {
      setSelectedWeatherLog(event.originalData);
      setIsWeatherDialogOpen(true);
    } else {
      setSelectedEvent(event);
      setIsDialogOpen(true);
    }
  };
  const handleSaveWeather = async (data: Partial<WeatherLog>) => {
    try {
      if (selectedWeatherLog) {
        await api(`/api/weather/${selectedWeatherLog.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast.success('Weather log updated');
      }
      fetchData(); // Refresh calendar
    } catch (error) {
      toast.error('Failed to update weather log');
    }
  };
  const navigateToSource = () => {
    if (!selectedEvent) return;
    setIsDialogOpen(false);
    switch (selectedEvent.type) {
      case 'task': navigate('/tasks'); break;
      case 'crop-plant':
      case 'crop-harvest': navigate('/crops'); break;
      case 'compliance': navigate('/compliance'); break;
      case 'livestock':
      case 'health': navigate('/livestock'); break;
      case 'resource': navigate('/resources'); break;
    }
  };
  return (
    <AppLayout title="Farm Calendar">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Sidebar Controls */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-task"
                  checked={filters.task}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, task: !!c }))}
                />
                <Label htmlFor="filter-task" className="flex items-center gap-2 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Tasks
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-crop"
                  checked={filters.crop}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, crop: !!c }))}
                />
                <Label htmlFor="filter-crop" className="flex items-center gap-2 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Crops
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-compliance"
                  checked={filters.compliance}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, compliance: !!c }))}
                />
                <Label htmlFor="filter-compliance" className="flex items-center gap-2 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> Compliance
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-livestock"
                  checked={filters.livestock}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, livestock: !!c }))}
                />
                <Label htmlFor="filter-livestock" className="flex items-center gap-2 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-pink-500" /> Livestock
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-weather"
                  checked={filters.weather}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, weather: !!c }))}
                />
                <Label htmlFor="filter-weather" className="flex items-center gap-2 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" /> Weather
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-resource"
                  checked={filters.resource}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, resource: !!c }))}
                />
                <Label htmlFor="filter-resource" className="flex items-center gap-2 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-slate-500" /> Resources
                </Label>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-2">Summary</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{filteredEvents.length} events this month</p>
                <p>{filteredEvents.filter(e => e.type === 'task').length} tasks pending</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Main Calendar Area */}
        <div className="flex-1 h-full min-h-[500px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center border rounded-lg bg-card">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <CalendarGrid
              events={filteredEvents}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>
      {/* General Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.title}
              {selectedEvent?.type && (
                <Badge variant="outline" className="capitalize">
                  {selectedEvent.type.replace('-', ' ')}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.date && format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm">{selectedEvent?.details || 'No additional details.'}</p>
            </div>
            {selectedEvent?.status && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary" className="capitalize">{selectedEvent.status}</Badge>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
            <Button onClick={navigateToSource} className="gap-2">
              View in Module <ExternalLink className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Weather Log Dialog (for editing from calendar) */}
      <WeatherLogDialog
        isOpen={isWeatherDialogOpen}
        onClose={() => setIsWeatherDialogOpen(false)}
        onSave={handleSaveWeather}
        log={selectedWeatherLog}
      />
    </AppLayout>
  );
}