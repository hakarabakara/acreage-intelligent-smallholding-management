import React, { useEffect, useState } from 'react';
import { CloudRain, Sun, Cloud, Wind, Droplets, CloudLightning, Snowflake, Plus, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { WeatherLog } from '@shared/types';
import { format, isSameDay, subDays } from 'date-fns';
import { WeatherLogDialog } from '@/components/weather/WeatherLogDialog';
import { toast } from 'sonner';
interface WeatherWidgetProps {
  className?: string;
}
export function WeatherWidget({ className }: WeatherWidgetProps) {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WeatherLog | null>(null);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api<{ items: WeatherLog[] }>('/api/weather?limit=100');
      // Sort by date descending
      setLogs(response.items.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error('Failed to load weather logs', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleSaveLog = async (data: Partial<WeatherLog>) => {
    try {
      if (selectedLog) {
        const updated = await api<WeatherLog>(`/api/weather/${selectedLog.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
        toast.success('Weather log updated');
      } else {
        const created = await api<WeatherLog>('/api/weather', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setLogs(prev => [created, ...prev].sort((a, b) => b.date - a.date));
        toast.success('Weather logged');
      }
    } catch (error) {
      toast.error('Failed to save weather log');
    }
  };
  const openDialog = (log?: WeatherLog) => {
    setSelectedLog(log || null);
    setIsDialogOpen(true);
  };
  const today = new Date();
  const todayLog = logs.find(l => isSameDay(l.date, today));
  // Get last 3 days excluding today
  const recentLogs = logs
    .filter(l => !isSameDay(l.date, today))
    .slice(0, 3);
  const getWeatherIcon = (condition: string, className?: string) => {
    switch (condition) {
      case 'sunny': return <Sun className={className} />;
      case 'cloudy': return <Cloud className={className} />;
      case 'rainy': return <CloudRain className={className} />;
      case 'stormy': return <CloudLightning className={className} />;
      case 'snowy': return <Snowflake className={className} />;
      case 'windy': return <Wind className={className} />;
      default: return <Sun className={className} />;
    }
  };
  const getBackgroundGradient = (condition?: string) => {
    switch (condition) {
      case 'sunny': return 'from-blue-400 to-blue-600';
      case 'cloudy': return 'from-slate-400 to-slate-600';
      case 'rainy': return 'from-slate-600 to-slate-800';
      case 'stormy': return 'from-indigo-600 to-purple-800';
      case 'snowy': return 'from-blue-100 to-blue-300 text-slate-800';
      case 'windy': return 'from-cyan-500 to-blue-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };
  return (
    <>
      <Card className={cn("overflow-hidden border-none shadow-lg bg-gradient-to-br text-white transition-colors duration-500", getBackgroundGradient(todayLog?.condition), className)}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
            {getWeatherIcon(todayLog?.condition || 'sunny', "h-4 w-4")} 
            {todayLog ? 'Today\'s Weather' : 'Weather'}
          </CardTitle>
          {todayLog ? (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => openDialog(todayLog)}>
              <Edit className="h-3 w-3" />
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="h-6 text-xs bg-white/20 hover:bg-white/30 text-white border-none" onClick={() => openDialog()}>
              <Plus className="h-3 w-3 mr-1" /> Log
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {todayLog ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-5xl font-bold tracking-tighter">
                    {todayLog.tempHigh ? `${todayLog.tempHigh}°` : '--'}
                  </div>
                  <div className="text-white/90 font-medium mt-1 capitalize">{todayLog.condition}</div>
                </div>
                {getWeatherIcon(todayLog.condition, "h-16 w-16 text-white/50")}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-white/90 bg-white/10 rounded-lg p-2">
                  <Droplets className="h-4 w-4" />
                  <span>Humidity: {todayLog.humidity ? `${todayLog.humidity}%` : '--'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90 bg-white/10 rounded-lg p-2">
                  <Wind className="h-4 w-4" />
                  <span>Wind: {todayLog.windSpeed ? `${todayLog.windSpeed}mph` : '--'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sun className="h-12 w-12 text-white/50 mb-2" />
              <p className="text-white/90 font-medium">No weather logged today</p>
              <p className="text-xs text-white/70 mb-4">Keep track of your farm's climate.</p>
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-white/90" onClick={() => openDialog()}>
                Log Now
              </Button>
            </div>
          )}
          {/* Recent History */}
          {recentLogs.length > 0 && (
            <div className="grid grid-cols-3 gap-2 border-t border-white/20 pt-4">
              {recentLogs.map((log, i) => (
                <div key={i} className="text-center cursor-pointer hover:bg-white/10 rounded p-1 transition-colors" onClick={() => openDialog(log)}>
                  <div className="text-xs text-white/80 mb-1">{format(log.date, 'EEE')}</div>
                  <div className="flex justify-center mb-1">
                    {getWeatherIcon(log.condition, "h-5 w-5 text-white")}
                  </div>
                  <div className="text-sm font-bold">{log.tempHigh ? `${log.tempHigh}°` : '-'}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <WeatherLogDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveLog}
        log={selectedLog}
      />
    </>
  );
}