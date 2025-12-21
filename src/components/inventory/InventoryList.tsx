import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, AlertTriangle, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { InventoryItem, InventoryCategory, StorageLocation } from '@shared/types';
import { cn } from '@/lib/utils';
import { useFormatting } from '@/hooks/use-formatting';
interface InventoryListProps {
  inventory: InventoryItem[];
  categories: InventoryCategory[];
  storageLocations: StorageLocation[];
  onSelect: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  isAllSelected: boolean;
}
export function InventoryList({
  inventory,
  categories,
  storageLocations,
  onSelect,
  onDelete,
  selectedIds,
  toggleSelection,
  onSelectAll,
  isAllSelected
}: InventoryListProps) {
  const { formatCurrency } = useFormatting();
  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(inventory.map(i => i.id));
    }
  };
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelected && inventory.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="hidden md:table-cell text-right">Value</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No inventory items found.
              </TableCell>
            </TableRow>
          ) : (
            inventory.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const categoryName = categories.find(c => c.id === item.categoryId)?.name || item.category;
              const isLowStock = item.quantity <= item.lowStockThreshold;
              const totalValue = (item.unitCost || 0) * item.quantity;
              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    isSelected && "bg-muted",
                    isLowStock && "bg-amber-50/30 dark:bg-amber-950/10"
                  )}
                  onClick={() => onSelect(item)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {isLowStock && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    {item.lotNumber && (
                      <div className="text-xs text-muted-foreground">Lot: {item.lotNumber}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="capitalize font-normal">
                      {categoryName}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.storageLocation || 'Unassigned'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-mono">
                      {item.quantity} <span className="text-xs text-muted-foreground">{item.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    {totalValue > 0 ? formatCurrency(totalValue) : '-'}
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
                          <DropdownMenuItem onClick={() => onSelect(item)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(item.id)}>
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