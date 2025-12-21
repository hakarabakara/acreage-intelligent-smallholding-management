import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Livestock, Field } from '@shared/types';
import { format, differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';
interface LivestockListProps {
  livestock: Livestock[];
  fields: Field[];
  onSelect: (animal: Livestock) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  isAllSelected: boolean;
}
export function LivestockList({
  livestock,
  fields,
  onSelect,
  onDelete,
  selectedIds,
  toggleSelection,
  onSelectAll,
  isAllSelected
}: LivestockListProps) {
  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(livestock.map(l => l.id));
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'sick': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'quarantine': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'archived': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelected && livestock.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Tag ID</TableHead>
            <TableHead>Type & Breed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="hidden md:table-cell">Age / Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {livestock.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No livestock records found.
              </TableCell>
            </TableRow>
          ) : (
            livestock.map((animal) => {
              const isSelected = selectedIds.has(animal.id);
              const locationName = fields.find(f => f.id === animal.locationId)?.name || 'Unassigned';
              const date = animal.birthDate || animal.purchaseDate;
              const age = date ? `${differenceInMonths(Date.now(), date)} mos` : '-';
              return (
                <TableRow
                  key={animal.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    isSelected && "bg-muted"
                  )}
                  onClick={() => onSelect(animal)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(animal.id)}
                      aria-label={`Select ${animal.tag}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{animal.tag}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{animal.type}</span>
                      <span className="text-xs text-muted-foreground">{animal.breed}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("capitalize font-normal border", getStatusColor(animal.status))}>
                      {animal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {locationName}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col text-sm">
                      <span>{age}</span>
                      <span className="text-xs text-muted-foreground">
                        {date ? format(date, 'MMM d, yyyy') : 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelect(animal)}>
                            <Edit className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={(e) => onDelete(animal.id, e)}>
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