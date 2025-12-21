import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Warehouse, AlertTriangle, Package, Loader2, Trash2, Minus, Sprout, Settings2, MapPin, DollarSign, Edit, X, Search, ClipboardCheck, LayoutGrid, List } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { InventoryItem, InventoryCategory, Task, StorageLocation } from '@shared/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useFormatting } from '@/hooks/use-formatting';
import { Label } from '@/components/ui/label';
import { SelectionBar } from '@/components/ui/selection-bar';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
import { InventoryDetailsSheet } from '@/components/inventory/InventoryDetailsSheet';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { StocktakeDialog } from '@/components/inventory/StocktakeDialog';
import { Badge } from '@/components/ui/badge';
import { StorageLocationManager } from '@/components/inventory/StorageLocationManager';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InventoryList } from '@/components/inventory/InventoryList';
export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // View State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  // Category Dialog State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  // Location Manager State
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  // Stocktake Dialog State
  const [isStocktakeOpen, setIsStocktakeOpen] = useState(false);
  const { formatCurrency } = useFormatting();
  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');
  // Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [invRes, catRes, locRes, tasksRes] = await Promise.all([
        api<{ items: InventoryItem[] }>('/api/inventory'),
        api<{ items: InventoryCategory[] }>('/api/inventory-categories'),
        api<{ items: StorageLocation[] }>('/api/storage-locations'),
        api<{ items: Task[] }>('/api/tasks')
      ]);
      setInventory(invRes.items);
      setCategories(catRes.items);
      setStorageLocations(locRes.items);
      setTasks(tasksRes.items);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const openSheet = useCallback((item?: InventoryItem) => {
    setSelectedItem(item || null);
    setIsSheetOpen(true);
  }, []);
  useEffect(() => {
    if (!isLoading && inventory.length > 0) {
      const inventoryId = searchParams.get('inventoryId');
      if (inventoryId && !isSheetOpen) {
        const item = inventory.find(i => i.id === inventoryId);
        if (item) {
          openSheet(item);
        }
      }
    }
  }, [isLoading, inventory, searchParams, openSheet, isSheetOpen]);
  // Filter Logic
  const uniqueLocations = useMemo(() => {
    // Combine dynamic locations and legacy string locations
    const locs = new Set<string>();
    storageLocations.forEach(l => locs.add(l.name));
    inventory.forEach(i => {
      if (i.storageLocation) locs.add(i.storageLocation);
    });
    return Array.from(locs).sort().map(l => ({ label: l, value: l }));
  }, [inventory, storageLocations]);
  const categoryOptions = useMemo(() => {
    return categories.map(c => ({ label: c.name, value: c.id }));
  }, [categories]);
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // Text Search
      const matchesSearch = searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lotNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      // Category Filter
      const matchesCategory = categoryFilter.length === 0 ||
        (item.categoryId && categoryFilter.includes(item.categoryId));
      // Location Filter
      const matchesLocation = locationFilter.length === 0 ||
        (item.storageLocation && locationFilter.includes(item.storageLocation));
      // Stock Filter
      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'low' && item.quantity <= item.lowStockThreshold);
      return matchesSearch && matchesCategory && matchesLocation && matchesStock;
    });
  }, [inventory, searchQuery, categoryFilter, locationFilter, stockFilter]);
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter([]);
    setLocationFilter([]);
    setStockFilter('all');
  };
  const activeFilterCount = (searchQuery ? 1 : 0) + categoryFilter.length + locationFilter.length + (stockFilter !== 'all' ? 1 : 0);
  const handleSaveItem = async (data: Partial<InventoryItem>) => {
    try {
      if (selectedItem) {
        const updated = await api<InventoryItem>(`/api/inventory/${selectedItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setInventory(prev => prev.map(i => i.id === updated.id ? updated : i));
        toast.success('Item updated');
      } else {
        const created = await api<InventoryItem>('/api/inventory', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setInventory(prev => [...prev, created]);
        toast.success('Item added to inventory');
      }
    } catch (error) {
      toast.error(selectedItem ? 'Failed to update item' : 'Failed to add item');
      throw error; // Re-throw to let the sheet handle loading state if needed
    }
  };
  const handleDeleteItem = async (id: string) => {
    try {
      await api(`/api/inventory/${id}`, { method: 'DELETE' });
      setInventory(prev => prev.filter(i => i.id !== id));
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };
  // Category Management Handlers
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      if (editingCategory) {
        const updated = await api<InventoryCategory>(`/api/inventory-categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: newCategoryName.trim() })
        });
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Category updated');
        setEditingCategory(null);
      } else {
        const created = await api<InventoryCategory>('/api/inventory-categories', {
          method: 'POST',
          body: JSON.stringify({ name: newCategoryName.trim() })
        });
        setCategories(prev => [...prev, created]);
        toast.success('Category added');
      }
      setNewCategoryName('');
    } catch (error) {
      toast.error('Failed to save category');
    }
  };
  const handleEditCategory = (category: InventoryCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api(`/api/inventory-categories/${id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  };
  const updateQuantity = async (item: InventoryItem, change: number) => {
    const newQuantity = Math.max(0, item.quantity + change);
    try {
      setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
      await api(`/api/inventory/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQuantity }),
      });
    } catch (error) {
      toast.error('Failed to update quantity');
      fetchData();
    }
  };
  // Bulk Actions
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItemIds(newSet);
  };
  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };
  const handleSelectAll = (ids: string[]) => {
    if (ids.length === 0) {
      clearSelection();
    } else {
      setSelectedItemIds(new Set(ids));
    }
  };
  const handleBulkDelete = async () => {
    if (selectedItemIds.size === 0) return;
    if (!confirm(`Delete ${selectedItemIds.size} items?`)) return;
    try {
        const ids = Array.from(selectedItemIds);
        await api('/api/inventory/bulk', {
            method: 'POST',
            body: JSON.stringify({ ids, action: 'delete' })
        });
        setInventory(prev => prev.filter(i => !selectedItemIds.has(i.id)));
        toast.success(`Deleted ${ids.length} items`);
        clearSelection();
    } catch (error) {
        toast.error('Bulk delete failed');
    }
  };
  // Stocktake Handler
  const handleStocktakeSave = async (adjustments: { id: string; quantity: number }[]) => {
    try {
      // Process updates sequentially to avoid race conditions or batch endpoint if available
      // For now, we'll iterate. In a real app, a bulk update endpoint is better.
      // Optimistic update first
      setInventory(prev => prev.map(item => {
        const adj = adjustments.find(a => a.id === item.id);
        return adj ? { ...item, quantity: adj.quantity, lastUpdated: Date.now() } : item;
      }));
      // Send updates
      await Promise.all(adjustments.map(adj => 
        api(`/api/inventory/${adj.id}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: adj.quantity, lastUpdated: Date.now() })
        })
      ));
      toast.success(`Stocktake complete. Updated ${adjustments.length} items.`);
    } catch (error) {
      toast.error('Failed to save stocktake adjustments');
      fetchData(); // Revert on error
    }
  };
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * (item.unitCost || 0)), 0);
    const lowStock = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;
    return { totalItems, totalValue, lowStock };
  }, [inventory]);
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'broken': return 'bg-red-100 text-red-800 border-red-200';
      case 'lost': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };
  const refreshLocations = async () => {
    try {
      const res = await api<{ items: StorageLocation[] }>('/api/storage-locations');
      setStorageLocations(res.items);
    } catch (error) {
      console.error('Failed to refresh locations', error);
    }
  };
  return (
    <AppLayout
      title="Inventory & Resources"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsStocktakeOpen(true)}>
            <ClipboardCheck className="mr-2 h-4 w-4" /> Stocktake
          </Button>
          <Button variant="outline" onClick={() => setIsLocationManagerOpen(true)}>
            <MapPin className="mr-2 h-4 w-4" /> Locations
          </Button>
          <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
            setIsCategoryDialogOpen(open);
            if (!open) handleCancelEdit();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings2 className="mr-2 h-4 w-4" /> Categories
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogDescription>Add, edit, or remove inventory categories.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={editingCategory ? "Edit category name..." : "New category name..."}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  {editingCategory && (
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit} title="Cancel Edit">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button onClick={handleSaveCategory} disabled={!newCategoryName.trim()}>
                    {editingCategory ? 'Update' : 'Add'}
                  </Button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {categories.map(cat => (
                    <div key={cat.id} className={cn(
                      "flex items-center justify-between p-2 rounded border transition-colors",
                      editingCategory?.id === cat.id ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" : "bg-muted"
                    )}>
                      <span>{cat.name}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-500" onClick={() => handleEditCategory(cat)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => openSheet()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Inventory Value"
              value={formatCurrency(stats.totalValue)}
              icon={DollarSign}
              loading={isLoading}
              variant="emerald"
            />
            <StatCard
              title="Total Items"
              value={stats.totalItems}
              icon={Package}
              loading={isLoading}
              variant="blue"
            />
            <StatCard
              title="Low Stock Alerts"
              value={stats.lowStock}
              icon={AlertTriangle}
              loading={isLoading}
              variant={stats.lowStock > 0 ? 'amber' : 'default'}
            />
          </div>
          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-lg border">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="w-48 flex-shrink-0">
                  <MultiSelect
                    options={categoryOptions}
                    selected={categoryFilter}
                    onChange={setCategoryFilter}
                    placeholder="Category"
                  />
                </div>
                <div className="w-48 flex-shrink-0">
                  <MultiSelect
                    options={uniqueLocations}
                    selected={locationFilter}
                    onChange={setLocationFilter}
                    placeholder="Location"
                  />
                </div>
                <div className="w-40 flex-shrink-0">
                  <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="low">Low Stock Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
                <ToggleGroupItem value="grid" aria-label="Grid View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List View"><List className="h-4 w-4" /></ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          {filteredInventory.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title="No items found"
              description="Try adjusting your filters or add a new item."
              action={
                <Button onClick={() => openSheet()} variant="outline">Add Item</Button>
              }
            />
          ) : viewMode === 'list' ? (
            <InventoryList
              inventory={filteredInventory}
              categories={categories}
              storageLocations={storageLocations}
              onSelect={openSheet}
              onDelete={handleDeleteItem}
              selectedIds={selectedItemIds}
              toggleSelection={toggleSelection}
              onSelectAll={handleSelectAll}
              isAllSelected={filteredInventory.length > 0 && filteredInventory.every(i => selectedItemIds.has(i.id))}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventory.map((item) => {
                const isLowStock = item.quantity <= item.lowStockThreshold;
                const categoryName = categories.find(c => c.id === item.categoryId)?.name || item.category;
                const estimatedValue = item.unitCost ? item.quantity * item.unitCost : 0;
                const isSelected = selectedItemIds.has(item.id);
                const status = item.status || 'active';
                return (
                  <Card key={item.id} className={cn(
                    "group hover:shadow-lg transition-all duration-200 border-border/60 relative",
                    isLowStock && "border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10",
                    isSelected && "border-emerald-500 bg-emerald-50/10"
                  )}>
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(item.id)}
                        />
                    </div>
                    <CardHeader className="pb-3 pl-10 cursor-pointer" onClick={() => openSheet(item)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                            {item.name}
                            {isLowStock && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <CardDescription className="capitalize">
                              {categoryName}
                            </CardDescription>
                            {status !== 'active' && (
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 capitalize", getStatusColor(status))}>
                                {status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSheet(item);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <div className="text-3xl font-bold tracking-tight">{item.quantity}</div>
                          <div className="text-sm text-muted-foreground">{item.unit}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {item.storageLocation && (
                        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{item.storageLocation}</span>
                        </div>
                      )}
                      {categoryName?.toLowerCase().includes('seed') && (item.germinationRate || item.expiryDate) && (
                        <div className="mb-4 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded text-xs space-y-1">
                          {item.germinationRate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Germination:</span>
                              <span className="font-medium">{item.germinationRate}%</span>
                            </div>
                          )}
                          {item.expiryDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expires:</span>
                              <span className="font-medium">{format(item.expiryDate, 'MMM yyyy')}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>Threshold: {item.lowStockThreshold}</span>
                        </div>
                        {estimatedValue > 0 && (
                          <div className="flex items-center gap-1 text-emerald-600 font-medium">
                            <DollarSign className="h-3 w-3" />
                            <span>Est. Value: {formatCurrency(estimatedValue)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
      <InventoryDetailsSheet
        item={selectedItem}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        categories={categories}
        tasks={tasks}
        storageLocations={storageLocations}
      />
      <StocktakeDialog
        isOpen={isStocktakeOpen}
        onClose={() => setIsStocktakeOpen(false)}
        onSave={handleStocktakeSave}
        inventory={inventory}
        categories={categories}
      />
      <StorageLocationManager
        isOpen={isLocationManagerOpen}
        onClose={() => setIsLocationManagerOpen(false)}
        locations={storageLocations}
        onUpdate={refreshLocations}
      />
      <SelectionBar
        count={selectedItemIds.size}
        onClear={clearSelection}
        label="items selected"
        actions={
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        }
      />
    </AppLayout>
  );
}