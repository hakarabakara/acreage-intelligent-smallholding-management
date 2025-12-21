import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Scale, Trash2, MapPin, Calendar, Sprout, MoreHorizontal, Edit } from 'lucide-react';
import type { Crop, Field } from '@shared/types';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
interface CropListProps {
  crops: Crop[];
  fields: Field[];
  onSelectCrop: (crop: Crop) => void;
  onHarvest: (crop: Crop, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  isAllSelected: boolean;
}
export function CropList({
  crops,
  fields,
  onSelectCrop,
  onHarvest,
  onDelete,
  selectedIds,
  toggleSelection,
  onSelectAll,
  isAllSelected
}: CropListProps) {
  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectAll([]); // Clear
    } else {
      onSelectAll(crops.map(c => c.id)); // Select all visible
    }
  };
  const getProgress = (start: number, end: number) => {
    const total = end - start;
    const elapsed = Date.now() - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'growing': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'harvested': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={isAllSelected && crops.length > 0} 
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Crop</TableHead>
            <TableHead>Field</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Timeline</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {crops.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No crops found.
              </TableCell>
            </TableRow>
          ) : (
            crops.map((crop) => {
              const fieldName = fields.find(f => f.id === crop.fieldId)?.name || 'Unknown';
              const progress = getProgress(crop.plantingDate, crop.estimatedHarvestDate);
              const isSelected = selectedIds.has(crop.id);
              return (
                <TableRow 
                  key={crop.id} 
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    isSelected && "bg-muted"
                  )}
                  onClick={() => onSelectCrop(crop)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => toggleSelection(crop.id)}
                      aria-label={`Select ${crop.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{crop.name}</span>
                      <span className="text-xs text-muted-foreground">{crop.variety}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {fieldName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize font-normal", getStatusColor(crop.status))}>
                      {crop.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell w-[200px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{format(crop.plantingDate, 'MMM d')}</span>
                        <span>{format(crop.estimatedHarvestDate, 'MMM d')}</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                        onClick={(e) => onHarvest(crop, e)}
                        title="Log Harvest"
                      >
                        <Scale className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelectCrop(crop)}>
                            <Edit className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={(e) => onDelete(crop.id, e)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}