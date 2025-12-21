import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, getDaysInMonth, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import type { Crop } from '@shared/types';
import { cn } from '@/lib/utils';
import { Calendar, Sprout, Leaf } from 'lucide-react';
interface CropTimelineProps {
  crops: Crop[];
  onSelectCrop: (crop: Crop) => void;
}
export function CropTimeline({ crops, onSelectCrop }: CropTimelineProps) {
  // Configuration
  const PIXELS_PER_DAY = 4; // Width of one day in pixels
  const HEADER_HEIGHT = 40;
  const ROW_HEIGHT = 48;
  // 1. Determine Timeline Range
  const { startDate, endDate, totalDays, months } = useMemo(() => {
    if (crops.length === 0) {
      const now = new Date();
      return { 
        startDate: startOfMonth(now), 
        endDate: endOfMonth(addDays(now, 90)), 
        totalDays: 90, 
        months: [] 
      };
    }
    const startDates = crops.map(c => c.plantingDate);
    const endDates = crops.map(c => c.estimatedHarvestDate || addDays(c.plantingDate, c.daysToMaturity || 60).getTime());
    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));
    // Add buffer (1 month before, 1 month after)
    const start = startOfMonth(addDays(minDate, -15));
    const end = endOfMonth(addDays(maxDate, 15));
    const days = differenceInDays(end, start) + 1;
    const monthIntervals = eachMonthOfInterval({ start, end });
    return { startDate: start, endDate: end, totalDays: days, months: monthIntervals };
  }, [crops]);
  // 2. Sort crops by planting date
  const sortedCrops = useMemo(() => {
    return [...crops].sort((a, b) => a.plantingDate - b.plantingDate);
  }, [crops]);
  if (crops.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mb-4 opacity-20" />
          <p>No active crops to display on timeline.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Seasonal Timeline</CardTitle>
            <CardDescription>Visual planting and harvest schedule</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Growing</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span>Harvest Window</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full border rounded-lg bg-background shadow-sm">
          <div 
            className="relative"
            style={{ 
              width: `${totalDays * PIXELS_PER_DAY}px`,
              minWidth: '100%'
            }}
          >
            {/* Header: Months */}
            <div className="flex border-b bg-muted/30 sticky top-0 z-20 h-10">
              {months.map((month) => {
                const daysInMonth = getDaysInMonth(month);
                const width = daysInMonth * PIXELS_PER_DAY;
                return (
                  <div 
                    key={month.toISOString()} 
                    className="flex items-center justify-center border-r text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    style={{ width: `${width}px`, minWidth: `${width}px` }}
                  >
                    {format(month, 'MMMM yyyy')}
                  </div>
                );
              })}
            </div>
            {/* Grid Lines (Vertical) */}
            <div className="absolute inset-0 z-0 pointer-events-none flex">
              {months.map((month) => {
                const daysInMonth = getDaysInMonth(month);
                const width = daysInMonth * PIXELS_PER_DAY;
                return (
                  <div 
                    key={`grid-${month.toISOString()}`} 
                    className="border-r h-full"
                    style={{ width: `${width}px`, minWidth: `${width}px` }}
                  />
                );
              })}
            </div>
            {/* Current Date Line */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
              style={{ 
                left: `${differenceInDays(new Date(), startDate) * PIXELS_PER_DAY}px`,
                display: differenceInDays(new Date(), startDate) >= 0 && differenceInDays(new Date(), startDate) <= totalDays ? 'block' : 'none'
              }}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            {/* Rows */}
            <div className="relative z-10 py-2 space-y-1">
              {sortedCrops.map((crop) => {
                const startOffset = differenceInDays(crop.plantingDate, startDate) * PIXELS_PER_DAY;
                const durationDays = crop.daysToMaturity || 60;
                const width = durationDays * PIXELS_PER_DAY;
                // Harvest window visualization (last 10% or 1 week)
                const harvestDuration = Math.max(7, Math.round(durationDays * 0.15)); 
                const growWidth = width - (harvestDuration * PIXELS_PER_DAY);
                const harvestWidth = harvestDuration * PIXELS_PER_DAY;
                return (
                  <div 
                    key={crop.id} 
                    className="relative h-10 hover:bg-muted/50 transition-colors flex items-center group"
                    onClick={() => onSelectCrop(crop)}
                  >
                    {/* Bar Container */}
                    <div 
                      className="absolute h-7 rounded-md flex overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
                      style={{ left: `${startOffset}px` }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex h-full">
                              {/* Growing Phase */}
                              <div 
                                className="h-full bg-emerald-500/90 flex items-center px-2 overflow-hidden whitespace-nowrap text-[10px] font-medium text-white"
                                style={{ width: `${growWidth}px` }}
                              >
                                <span className="drop-shadow-md truncate">{crop.name}</span>
                              </div>
                              {/* Harvest Phase */}
                              <div 
                                className="h-full bg-amber-500/90 flex items-center justify-center"
                                style={{ width: `${harvestWidth}px` }}
                              >
                                <Leaf className="h-3 w-3 text-white/90" />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            <div className="font-bold">{crop.name}</div>
                            <div className="text-muted-foreground">{crop.variety}</div>
                            <div className="mt-1 pt-1 border-t border-border/50 grid grid-cols-2 gap-x-4 gap-y-1">
                              <span>Planted:</span>
                              <span className="font-mono">{format(crop.plantingDate, 'MMM d')}</span>
                              <span>Harvest:</span>
                              <span className="font-mono">{format(crop.estimatedHarvestDate, 'MMM d')}</span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}