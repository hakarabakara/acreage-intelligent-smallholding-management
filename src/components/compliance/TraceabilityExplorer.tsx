import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Sprout, Warehouse, ShoppingCart, ArrowRight, Package, Calendar, Tag } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { HarvestLog, InventoryItem, Order, Crop, Field } from '@shared/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PrintButton } from '@/components/ui/print-button';
interface TraceabilityData {
  harvests: HarvestLog[];
  inventory: InventoryItem[];
  orders: Order[];
  crops: Crop[];
  fields: Field[];
}
export function TraceabilityExplorer() {
  const [lotQuery, setLotQuery] = useState('');
  const [data, setData] = useState<TraceabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const handleSearch = async () => {
    if (!lotQuery.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      // In a real app, we'd have a dedicated search endpoint.
      // Here we fetch all and filter client-side for the demo.
      const [harvestsRes, inventoryRes, ordersRes, cropsRes, fieldsRes] = await Promise.all([
        api<{ items: HarvestLog[] }>('/api/harvests?limit=1000'),
        api<{ items: InventoryItem[] }>('/api/inventory?limit=1000'),
        api<{ items: Order[] }>('/api/orders?limit=1000'),
        api<{ items: Crop[] }>('/api/crops?limit=1000'),
        api<{ items: Field[] }>('/api/fields?limit=1000'),
      ]);
      setData({
        harvests: harvestsRes.items,
        inventory: inventoryRes.items,
        orders: ordersRes.items,
        crops: cropsRes.items,
        fields: fieldsRes.items,
      });
    } catch (error) {
      console.error('Traceability search failed', error);
      toast.error('Failed to load traceability data');
    } finally {
      setIsLoading(false);
    }
  };
  const traceResult = useMemo(() => {
    if (!data || !lotQuery) return null;
    const query = lotQuery.toLowerCase();
    // 1. Find Inventory Items matching Lot Number
    const matchedInventory = data.inventory.filter(i =>
      i.lotNumber?.toLowerCase().includes(query)
    );
    // 2. Find Harvest Logs matching Lot Number
    const matchedHarvests = data.harvests.filter(h =>
      h.lotNumber?.toLowerCase().includes(query)
    );
    // 3. Find Orders containing matched Inventory Items
    const matchedInventoryIds = new Set(matchedInventory.map(i => i.id));
    const matchedOrders = data.orders.filter(o =>
      o.items.some(item => item.inventoryId && matchedInventoryIds.has(item.inventoryId))
    );
    // 4. Trace back to Crops and Fields from Harvests
    const relatedCropIds = new Set(matchedHarvests.map(h => h.cropId));
    const relatedCrops = data.crops.filter(c => relatedCropIds.has(c.id));
    const relatedFieldIds = new Set(relatedCrops.map(c => c.fieldId));
    const relatedFields = data.fields.filter(f => relatedFieldIds.has(f.id));
    return {
      inventory: matchedInventory,
      harvests: matchedHarvests,
      orders: matchedOrders,
      crops: relatedCrops,
      fields: relatedFields,
    };
  }, [data, lotQuery]);
  const hasResults = traceResult && (
    traceResult.inventory.length > 0 ||
    traceResult.harvests.length > 0 ||
    traceResult.orders.length > 0
  );
  return (
    <div className="space-y-6">
      <Card className="bg-muted/30 border-dashed print:bg-white print:border-none print:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Trace Product Journey
            </CardTitle>
            <CardDescription>
              Enter a Lot Number to visualize the complete chain of custody from field to customer.
            </CardDescription>
          </div>
          <div className="print:hidden">
            <PrintButton />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-md print:hidden">
            <Input
              placeholder="Enter Lot # (e.g. LOT-2023...)"
              value={lotQuery}
              onChange={(e) => setLotQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading || !lotQuery.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Trace'}
            </Button>
          </div>
          {/* Print-only header */}
          <div className="hidden print:block mb-4">
            <h3 className="text-xl font-bold">Traceability Report</h3>
            <p className="text-sm text-gray-600">Lot Number: <span className="font-mono font-bold">{lotQuery}</span></p>
            <p className="text-xs text-gray-500 mt-1">Generated on {format(new Date(), 'PPP')}</p>
          </div>
        </CardContent>
      </Card>
      {hasSearched && !isLoading && !hasResults && (
        <div className="text-center py-12 text-muted-foreground">
          No records found for Lot Number "{lotQuery}".
        </div>
      )}
      {hasResults && traceResult && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Visual Flow */}
          <div className="relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-border -z-10 hidden md:block print:hidden" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:gap-4">
              {/* Step 1: Origin */}
              <div className="bg-background border rounded-lg p-4 shadow-sm relative print:border-gray-300 print:shadow-none">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs font-medium text-muted-foreground flex items-center gap-1 print:bg-white">
                  <MapPin className="h-3 w-3" /> Origin
                </div>
                <div className="space-y-3 mt-2">
                  {traceResult.fields.map(f => (
                    <div key={f.id} className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 print:border print:border-black" />
                      <span className="font-medium">{f.name}</span>
                    </div>
                  ))}
                  {traceResult.crops.map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-sm text-muted-foreground pl-4 border-l-2 border-muted ml-1 print:border-gray-300">
                      <Sprout className="h-3 w-3" />
                      <span>{c.name} ({c.variety})</span>
                    </div>
                  ))}
                  {traceResult.fields.length === 0 && <span className="text-sm text-muted-foreground italic">Unknown Origin</span>}
                </div>
              </div>
              {/* Step 2: Harvest */}
              <div className="bg-background border rounded-lg p-4 shadow-sm relative print:border-gray-300 print:shadow-none">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs font-medium text-muted-foreground flex items-center gap-1 print:bg-white">
                  <Sprout className="h-3 w-3" /> Harvest
                </div>
                <div className="space-y-3 mt-2">
                  {traceResult.harvests.map(h => (
                    <div key={h.id} className="text-sm border-b last:border-0 pb-2 last:pb-0 print:border-gray-200">
                      <div className="font-medium flex justify-between">
                        <span>{format(h.date, 'MMM d, yyyy')}</span>
                        <Badge variant="outline" className="text-[10px] print:border-gray-400">{h.quality}</Badge>
                      </div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {h.amount} {h.unit} • Lot: {h.lotNumber}
                      </div>
                    </div>
                  ))}
                  {traceResult.harvests.length === 0 && <span className="text-sm text-muted-foreground italic">No Harvest Log Linked</span>}
                </div>
              </div>
              {/* Step 3: Inventory */}
              <div className="bg-background border rounded-lg p-4 shadow-sm relative print:border-gray-300 print:shadow-none">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs font-medium text-muted-foreground flex items-center gap-1 print:bg-white">
                  <Warehouse className="h-3 w-3" /> Storage
                </div>
                <div className="space-y-3 mt-2">
                  {traceResult.inventory.map(i => (
                    <div key={i.id} className="text-sm border-b last:border-0 pb-2 last:pb-0 print:border-gray-200">
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <Tag className="h-3 w-3" />
                        {i.lotNumber}
                      </div>
                      <div className="text-xs mt-1">
                        Qty: {i.quantity} {i.unit}
                      </div>
                    </div>
                  ))}
                  {traceResult.inventory.length === 0 && <span className="text-sm text-muted-foreground italic">No Current Stock</span>}
                </div>
              </div>
              {/* Step 4: Distribution */}
              <div className="bg-background border rounded-lg p-4 shadow-sm relative print:border-gray-300 print:shadow-none">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs font-medium text-muted-foreground flex items-center gap-1 print:bg-white">
                  <ShoppingCart className="h-3 w-3" /> Distribution
                </div>
                <div className="space-y-3 mt-2">
                  {traceResult.orders.map(o => (
                    <div key={o.id} className="text-sm border-b last:border-0 pb-2 last:pb-0 print:border-gray-200">
                      <div className="font-medium flex justify-between">
                        <span>Order #{o.id.slice(0, 6)}</span>
                        <Badge variant="secondary" className="text-[10px] print:border print:border-gray-300 print:bg-transparent">{o.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(o.date, 'MMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                  {traceResult.orders.length === 0 && <span className="text-sm text-muted-foreground italic">No Sales Yet</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}