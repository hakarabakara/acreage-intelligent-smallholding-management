import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize2, Map as MapIcon, MousePointer2, Check, X, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Field, GeoPoint } from '@shared/types';
interface FarmMapProps {
  fields: Field[];
  selectedFieldId?: string;
  onSelectField: (id: string) => void;
  onSaveBoundary: (fieldId: string, boundary: GeoPoint[]) => void;
  className?: string;
}
export function FarmMap({ fields, selectedFieldId, onSelectField, onSaveBoundary, className }: FarmMapProps) {
  const [mode, setMode] = useState<'view' | 'draw'>('view');
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<GeoPoint[]>([]);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // If we enter draw mode, we need a field selected to draw FOR
  useEffect(() => {
    if (mode === 'draw' && !selectedFieldId) {
      setMode('view');
    }
  }, [mode, selectedFieldId]);
  const handleSvgClick = (e: React.MouseEvent) => {
    if (mode !== 'draw' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDrawingPoints(prev => [...prev, { x, y }]);
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
  return (
    <Card className={cn("overflow-hidden flex flex-col h-[500px] relative", className)}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-background/90 backdrop-blur shadow-sm rounded-lg p-1 flex gap-1 border">
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
              <TooltipContent>Select Mode</TooltipContent>
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
        <div className="bg-background/90 backdrop-blur shadow-sm rounded-lg p-1 border">
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
        </div>
      </div>
      {/* Drawing Controls */}
      {mode === 'draw' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center gap-4 border animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">Click to place points</span>
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
      {/* Map Canvas */}
      <div className={cn(
        "flex-1 w-full h-full relative cursor-crosshair transition-colors duration-500",
        satelliteMode ? "bg-stone-800" : "bg-stone-100"
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
        >
          {/* Existing Fields */}
          {fields.map(field => {
            if (!field.boundary || field.boundary.length === 0) return null;
            const isSelected = selectedFieldId === field.id;
            const isHovered = hoveredFieldId === field.id;
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
                {/* Label */}
                {(isSelected || isHovered) && (
                  <foreignObject 
                    x={Math.min(...field.boundary.map(p => p.x))} 
                    y={Math.min(...field.boundary.map(p => p.y))} 
                    width="100" 
                    height="100"
                    className="pointer-events-none overflow-visible"
                  >
                    <div className="mt-[-2rem] ml-[-1rem]">
                      <Badge variant="secondary" className="shadow-sm whitespace-nowrap text-[10px] px-1 py-0 h-5 bg-white/90 backdrop-blur">
                        {field.name}
                      </Badge>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
          {/* Currently Drawing Polygon */}
          {mode === 'draw' && drawingPoints.length > 0 && (
            <g>
              <polygon 
                points={pointsToString(drawingPoints)}
                className="fill-emerald-500/20 stroke-emerald-500 stroke-[0.5] stroke-dasharray-1"
              />
              {drawingPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="0.8" className="fill-white stroke-emerald-600 stroke-[0.2]" />
              ))}
            </g>
          )}
        </svg>
      </div>
    </Card>
  );
}