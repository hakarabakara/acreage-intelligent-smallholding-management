import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Maximize2, MousePointer2, Check, X, Layers, Tractor, ClipboardList, AlertCircle, Sprout, AlertTriangle, HelpCircle, Map as MapIcon, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Field, GeoPoint, Livestock, Task } from '@shared/types';
import { getPolygonCentroid } from '@/lib/map-utils';
import { MapHelpDialog } from '@/components/map/MapHelpDialog';
import { Input } from '@/components/ui/input';
interface FarmMapProps {
  fields: Field[];
  selectedFieldId?: string;
  onSelectField: (id: string) => void;
  onSaveBoundary: (fieldId: string, boundary: GeoPoint[]) => void;
  className?: string;
  livestock?: Livestock[];
  tasks?: Task[];
}
type MapLayer = 'labels' | 'livestock' | 'tasks' | 'soil';
export function FarmMap({
  fields,
  selectedFieldId,
  onSelectField,
  onSaveBoundary,
  className,
  livestock = [],
  tasks = []
}: FarmMapProps) {
  const [mode, setMode] = useState<'view' | 'draw'>('view');
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<GeoPoint[]>([]);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<MapLayer>>(new Set(['labels', 'livestock', 'tasks', 'soil']));
  const [showHelp, setShowHelp] = useState(false);
  const [showFieldList, setShowFieldList] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<GeoPoint | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  // If we enter draw mode, we need a field selected to draw FOR
  useEffect(() => {
    if (mode === 'draw' && !selectedFieldId) {
      setMode('view');
    }
  }, [mode, selectedFieldId]);
  const getSvgCoordinates = (e: React.MouseEvent) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };
  const handleSvgClick = (e: React.MouseEvent) => {
    if (mode !== 'draw') return;
    const coords = getSvgCoordinates(e);
    if (coords) {
      setDrawingPoints(prev => [...prev, coords]);
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode !== 'draw') return;
    const coords = getSvgCoordinates(e);
    if (coords) {
      setCursorPosition(coords);
    }
  };
  const handleMouseLeave = () => {
    setCursorPosition(null);
  };
  const handleFinishDrawing = () => {
    if (selectedFieldId && drawingPoints.length >= 3) {
      onSaveBoundary(selectedFieldId, drawingPoints);
      setDrawingPoints([]);
      setMode('view');
    }
  };
  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    setMode('view');
  };
  const toggleLayer = (layer: MapLayer) => {
    const newLayers = new Set(visibleLayers);
    if (newLayers.has(layer)) {
      newLayers.delete(layer);
    } else {
      newLayers.add(layer);
    }
    setVisibleLayers(newLayers);
  };
  const getFieldColor = (type: string = 'field') => {
    switch (type) {
      case 'pasture': return 'fill-emerald-500/40 stroke-emerald-600';
      case 'bed': return 'fill-amber-700/40 stroke-amber-800';
      case 'orchard': return 'fill-orange-400/40 stroke-orange-600';
      case 'forest': return 'fill-green-800/40 stroke-green-900';
      case 'building': return 'fill-slate-500/40 stroke-slate-700';
      default: return 'fill-blue-500/40 stroke-blue-600';
    }
  };
  const pointsToString = (points: GeoPoint[]) => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };
  const hasSoilIssue = (field: Field) => {
    if (!field.soilProfile) return false;
    const { nitrogen, phosphorus, potassium, ph } = field.soilProfile;
    return nitrogen === 'low' || phosphorus === 'low' || potassium === 'low' || (ph !== undefined && (ph < 5.5 || ph > 8.0));
  };
  const hasFields = fields.length > 0;
  const hasBoundaries = fields.some(f => f.boundary && f.boundary.length > 0);
  const filteredFields = fields.filter(f =>
    f.name.toLowerCase().includes(fieldSearch.toLowerCase())
  );
  return (
    <Card className={cn("overflow-hidden flex flex-col h-[500px] relative", className)}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-background/90 backdrop-blur shadow-sm rounded-lg p-1 flex gap-1 border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showFieldList ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowFieldList(!showFieldList)}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Field List</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-px h-4 bg-border my-auto mx-1" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === 'view' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMode('view')}
                >
                  <MousePointer2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Mode</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === 'draw' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => selectedFieldId && setMode('draw')}
                  disabled={!selectedFieldId}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{selectedFieldId ? 'Draw Boundary' : 'Select a field to draw'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="bg-background/90 backdrop-blur shadow-sm rounded-lg p-1 border flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={satelliteMode ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSatelliteMode(!satelliteMode)}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Satellite View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Sprout className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Map Layers</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="layer-labels"
                      checked={visibleLayers.has('labels')}
                      onCheckedChange={() => toggleLayer('labels')}
                    />
                    <Label htmlFor="layer-labels">Field Labels</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="layer-livestock"
                      checked={visibleLayers.has('livestock')}
                      onCheckedChange={() => toggleLayer('livestock')}
                    />
                    <Label htmlFor="layer-livestock">Livestock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="layer-tasks"
                      checked={visibleLayers.has('tasks')}
                      onCheckedChange={() => toggleLayer('tasks')}
                    />
                    <Label htmlFor="layer-tasks">Tasks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="layer-soil"
                      checked={visibleLayers.has('soil')}
                      onCheckedChange={() => toggleLayer('soil')}
                    />
                    <Label htmlFor="layer-soil">Soil Alerts</Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="bg-background/90 backdrop-blur shadow-sm rounded-lg p-1 border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowHelp(true)}
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Map Guide</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* Field List Overlay */}
      {showFieldList && (
        <div className="absolute top-16 left-4 bottom-4 w-64 bg-background/95 backdrop-blur shadow-lg rounded-lg border z-20 flex flex-col animate-in slide-in-from-left-4 duration-200">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                className="h-8 pl-7 text-xs"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredFields.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No fields found.
                </div>
              ) : (
                filteredFields.map(field => {
                  const isMapped = field.boundary && field.boundary.length > 0;
                  const isSelected = selectedFieldId === field.id;
                  return (
                    <button
                      key={field.id}
                      onClick={() => onSelectField(field.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors",
                        isSelected ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100" : "hover:bg-muted"
                      )}
                    >
                      <span className="truncate font-medium">{field.name}</span>
                      <div className="flex items-center gap-2">
                        {isMapped ? (
                          <Badge variant="outline" className="text-[10px] px-1 h-4 bg-background/50">Mapped</Badge>
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-amber-400" title="Not mapped" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      )}
      {/* Drawing Controls */}
      {mode === 'draw' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center gap-4 border animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">
            {drawingPoints.length === 0 ? "Click to place first corner" :
             drawingPoints.length < 3 ? "Click to place next corner" :
             "Continue clicking or Save"}
          </span>
          <div className="h-4 w-px bg-border" />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleCancelDrawing}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleFinishDrawing} disabled={drawingPoints.length < 3}>
              <Check className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </div>
      )}
      {/* Empty State Overlay */}
      {!hasBoundaries && mode === 'view' && !showFieldList && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20 pointer-events-none">
          <div className="text-center p-6 bg-card border rounded-xl shadow-lg max-w-sm pointer-events-auto">
            <MapIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Start Mapping</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasFields
                ? "Open the field list to select a field and start drawing its boundary."
                : "Your map is empty. Add your first field using the button above to start tracking."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowHelp(true)}>View Guide</Button>
              {hasFields && (
                <Button onClick={() => setShowFieldList(true)}>Open Field List</Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Map Canvas */}
      <div className={cn(
        "flex-1 w-full h-full relative transition-colors duration-500",
        mode === 'draw' ? "cursor-crosshair" : "cursor-default",
        satelliteMode ? "bg-stone-900" : "bg-stone-100"
      )}>
        {/* Grid Pattern for non-satellite mode */}
        {!satelliteMode && (
          <div className="absolute inset-0 opacity-10 pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
        )}
        {/* Satellite Texture Placeholder */}
        {satelliteMode && (
          <div className="absolute inset-0 opacity-30 pointer-events-none bg-gradient-to-br from-green-900 to-stone-900" />
        )}
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Existing Fields */}
          {fields.map(field => {
            if (!field.boundary || field.boundary.length === 0) return null;
            const isSelected = selectedFieldId === field.id;
            const isHovered = hoveredFieldId === field.id;
            const center = getPolygonCentroid(field.boundary);
            // Filter operational data for this field
            const fieldLivestock = livestock.filter(l => l.locationId === field.id && l.status !== 'archived');
            const fieldTasks = tasks.filter(t => t.relatedEntityId === field.id && t.status !== 'done');
            const urgentTasks = fieldTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
            const soilWarning = hasSoilIssue(field);
            return (
              <g key={field.id}
                 onClick={(e) => { e.stopPropagation(); onSelectField(field.id); }}
                 onMouseEnter={() => setHoveredFieldId(field.id)}
                 onMouseLeave={() => setHoveredFieldId(null)}
                 className="cursor-pointer transition-all duration-200"
              >
                <polygon
                  points={pointsToString(field.boundary)}
                  className={cn(
                    "transition-all duration-300 stroke-[0.5]",
                    getFieldColor(field.type),
                    isSelected ? "stroke-[1] stroke-white fill-opacity-60" : "hover:fill-opacity-60"
                  )}
                />
                {/* Field Name Label */}
                {visibleLayers.has('labels') && (isSelected || isHovered) && (
                  <foreignObject
                    x={Math.min(...field.boundary.map(p => p.x))}
                    y={Math.min(...field.boundary.map(p => p.y))}
                    width="1"
                    height="1"
                    className="pointer-events-none overflow-visible"
                  >
                    <div className="transform -translate-y-8 -translate-x-2">
                      <Badge variant="secondary" className="shadow-sm whitespace-nowrap text-[10px] px-1 py-0 h-5 bg-white/90 backdrop-blur border-0">
                        {field.name}
                      </Badge>
                    </div>
                  </foreignObject>
                )}
                {/* Operational Markers (Livestock & Tasks & Soil) */}
                <foreignObject
                  x={center.x}
                  y={center.y}
                  width="1"
                  height="1"
                  className="overflow-visible pointer-events-auto"
                >
                  <div className="transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    {/* Livestock Marker */}
                    {visibleLayers.has('livestock') && fieldLivestock.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-white/90 dark:bg-neutral-800/90 shadow-sm border border-emerald-200 dark:border-emerald-900 rounded-full px-1.5 py-0.5 flex items-center gap-1 cursor-help hover:scale-110 transition-transform">
                              <Tractor className="h-3 w-3 text-emerald-600" />
                              <span className="text-[8px] font-bold text-emerald-800 dark:text-emerald-300">{fieldLivestock.length}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {fieldLivestock.length} Livestock Here
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {/* Tasks Marker */}
                    {visibleLayers.has('tasks') && fieldTasks.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "shadow-sm border rounded-full px-1.5 py-0.5 flex items-center gap-1 cursor-help hover:scale-110 transition-transform",
                              urgentTasks.length > 0
                                ? "bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800"
                                : "bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800"
                            )}>
                              {urgentTasks.length > 0 ? (
                                <AlertCircle className="h-3 w-3 text-red-600" />
                              ) : (
                                <ClipboardList className="h-3 w-3 text-blue-600" />
                              )}
                              <span className={cn(
                                "text-[8px] font-bold",
                                urgentTasks.length > 0 ? "text-red-800 dark:text-red-300" : "text-blue-800 dark:text-blue-300"
                              )}>
                                {fieldTasks.length}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            {fieldTasks.length} Active Tasks
                            {urgentTasks.length > 0 && ` (${urgentTasks.length} Urgent)`}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {/* Soil Alert Marker */}
                    {visibleLayers.has('soil') && soilWarning && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-amber-50 dark:bg-amber-900/50 shadow-sm border border-amber-200 dark:border-amber-800 rounded-full p-1 cursor-help hover:scale-110 transition-transform">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Soil Health Warning
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
          {/* Currently Drawing Polygon */}
          {mode === 'draw' && drawingPoints.length > 0 && (
            <g>
              <polygon
                points={pointsToString(drawingPoints)}
                className="fill-emerald-500/20 stroke-emerald-400 stroke-[2] stroke-dasharray-4"
              />
              {drawingPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="1.5" className="fill-white stroke-emerald-600 stroke-[0.5]" />
              ))}
              {/* Preview Line */}
              {cursorPosition && (
                <line
                  x1={drawingPoints[drawingPoints.length - 1].x}
                  y1={drawingPoints[drawingPoints.length - 1].y}
                  x2={cursorPosition.x}
                  y2={cursorPosition.y}
                  className="stroke-emerald-500 stroke-[1] stroke-dasharray-4 opacity-60"
                />
              )}
            </g>
          )}
        </svg>
      </div>
      <MapHelpDialog isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </Card>
  );
}