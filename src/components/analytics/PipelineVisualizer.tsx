import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Sprout, Warehouse, ShoppingCart, TrendingUp, ArrowDown } from 'lucide-react';
import type { InventoryItem, Crop, Order, InventoryCategory } from '@shared/types';
import { useFormatting } from '@/hooks/use-formatting';
import { cn } from '@/lib/utils';
interface PipelineVisualizerProps {
  inventory: InventoryItem[];
  crops: Crop[];
  orders: Order[];
  categories: InventoryCategory[];
}
export function PipelineVisualizer({ inventory, crops, orders, categories }: PipelineVisualizerProps) {
  const { formatCurrency, formatNumber } = useFormatting();
  const metrics = useMemo(() => {
    // 1. Inputs (Seeds, Chemicals, Feed)
    const inputCategories = ['seed', 'chemical', 'fertilizer', 'feed', 'input'];
    const inputItems = inventory.filter(i => {
      const catName = categories.find(c => c.id === i.categoryId)?.name.toLowerCase() || i.category.toLowerCase();
      return inputCategories.some(c => catName.includes(c));
    });
    const inputValue = inputItems.reduce((sum, i) => sum + (i.quantity * (i.unitCost || 0)), 0);
    // 2. Production (Active Crops)
    const activeCrops = crops.filter(c => c.status !== 'harvested');
    const productionInvestment = activeCrops.reduce((sum, c) => sum + (c.cost || 0), 0);
    const potentialYield = activeCrops.reduce((sum, c) => sum + (c.expectedYield || 0), 0);
    // 3. Storage (Harvested Produce)
    const produceCategories = ['produce', 'harvest', 'crop'];
    const produceItems = inventory.filter(i => {
      const catName = categories.find(c => c.id === i.categoryId)?.name.toLowerCase() || i.category.toLowerCase();
      return produceCategories.some(c => catName.includes(c));
    });
    const storageValue = produceItems.reduce((sum, i) => sum + (i.quantity * (i.unitCost || 0)), 0);
    // 4. Sales (Orders)
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
    const completedOrders = orders.filter(o => o.status === 'delivered');
    const pendingValue = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const realizedValue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      inputs: { value: inputValue, count: inputItems.length },
      production: { value: productionInvestment, count: activeCrops.length, yield: potentialYield },
      storage: { value: storageValue, count: produceItems.length },
      sales: { pending: pendingValue, realized: realizedValue, count: pendingOrders.length }
    };
  }, [inventory, crops, orders, categories]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stage 1: Inputs */}
        <PipelineStage
          title="Inputs & Resources"
          icon={Package}
          color="blue"
          value={metrics.inputs.value}
          details={`${metrics.inputs.count} items in stock`}
          subtext="Available for planting"
          formatCurrency={formatCurrency}
        />
        {/* Stage 2: Production */}
        <PipelineStage
          title="Active Production"
          icon={Sprout}
          color="emerald"
          value={metrics.production.value}
          details={`${metrics.production.count} active crops`}
          subtext={`Est. Yield: ${formatNumber(metrics.production.yield)} units`}
          formatCurrency={formatCurrency}
          isInvestment
        />
        {/* Stage 3: Storage */}
        <PipelineStage
          title="Harvest Storage"
          icon={Warehouse}
          color="amber"
          value={metrics.storage.value}
          details={`${metrics.storage.count} products ready`}
          subtext="Available for sale"
          formatCurrency={formatCurrency}
        />
        {/* Stage 4: Sales */}
        <PipelineStage
          title="Sales Pipeline"
          icon={ShoppingCart}
          color="purple"
          value={metrics.sales.pending}
          details={`${metrics.sales.count} pending orders`}
          subtext={`Realized: ${formatCurrency(metrics.sales.realized)}`}
          formatCurrency={formatCurrency}
        />
      </div>
      {/* Flow Visualization */}
      <Card className="bg-muted/20 border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Value Flow Analysis
          </CardTitle>
          <CardDescription>
            Tracking value transformation from input investment to realized revenue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative py-8">
            {/* Connecting Line (Desktop) */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-200 via-emerald-200 to-purple-200 dark:from-blue-900 dark:via-emerald-900 dark:to-purple-900 -translate-y-1/2 hidden md:block" />
            {/* Connecting Line (Mobile) - Vertical */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-emerald-200 to-purple-200 dark:from-blue-900 dark:via-emerald-900 dark:to-purple-900 -translate-x-1/2 md:hidden" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative">
              <FlowStep
                label="Investment"
                value={metrics.inputs.value}
                description="Raw Materials"
                color="bg-blue-500"
                formatCurrency={formatCurrency}
              />
              <FlowStep
                label="Growing"
                value={metrics.production.value}
                description="In-Field Assets"
                color="bg-emerald-500"
                formatCurrency={formatCurrency}
              />
              <FlowStep
                label="Inventory"
                value={metrics.storage.value}
                description="Market Ready"
                color="bg-amber-500"
                formatCurrency={formatCurrency}
              />
              <FlowStep
                label="Revenue"
                value={metrics.sales.pending + metrics.sales.realized}
                description="Total Sales Volume"
                color="bg-purple-500"
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function PipelineStage({ title, icon: Icon, color, value, details, subtext, formatCurrency, isInvestment }: any) {
  const colorStyles = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };
  return (
    <Card className={cn("border-l-4", colorStyles[color as keyof typeof colorStyles].replace('bg-', 'border-l-'))}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("p-2 rounded-lg", colorStyles[color as keyof typeof colorStyles])}>
            <Icon className="h-5 w-5" />
          </div>
          {isInvestment && <Badge variant="outline" className="text-[10px]">Cost Basis</Badge>}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold">{formatCurrency(value)}</h3>
          <div className="pt-2 border-t mt-2">
            <p className="text-xs font-medium">{details}</p>
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function FlowStep({ label, value, description, color, formatCurrency }: any) {
  return (
    <div className="flex flex-col items-center text-center relative z-10 bg-background/50 backdrop-blur-sm p-2 rounded-xl">
      <div className={cn("w-4 h-4 rounded-full border-4 border-background mb-3 shadow-sm", color)} />
      <div className="bg-card border shadow-sm rounded-lg p-3 w-full max-w-[180px]">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{label}</p>
        <p className="text-lg font-bold">{formatCurrency(value)}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {/* Mobile Arrow */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 md:hidden text-muted-foreground/30">
        <ArrowDown className="h-6 w-6" />
      </div>
    </div>
  );
}