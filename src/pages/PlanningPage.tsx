import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Calculator, Calendar, DollarSign, Loader2, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { BudgetPlan } from '@shared/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PlanDetailsSheet } from '@/components/planning/PlanDetailsSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
export function PlanningPage() {
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BudgetPlan | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // New Plan Form State
  const [newPlan, setNewPlan] = useState<Partial<BudgetPlan>>({
    name: '',
    totalBudget: 0,
    startDate: Date.now(),
    endDate: Date.now() + 7776000000, // +90 days approx
    status: 'draft'
  });
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api<{ items: BudgetPlan[] }>('/api/budget-plans');
      setPlans(response.items.sort((a, b) => b.startDate - a.startDate));
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleCreatePlan = async () => {
    if (!newPlan.name) return;
    try {
      const created = await api<BudgetPlan>('/api/budget-plans', {
        method: 'POST',
        body: JSON.stringify(newPlan)
      });
      setPlans(prev => [created, ...prev]);
      toast.success('Plan created');
      setIsDialogOpen(false);
      setNewPlan({ name: '', totalBudget: 0, startDate: Date.now(), endDate: Date.now() + 7776000000, status: 'draft' });
    } catch (error) {
      toast.error('Failed to create plan');
    }
  };
  const handleUpdatePlan = async (id: string, data: Partial<BudgetPlan>) => {
    try {
      const updated = await api<BudgetPlan>(`/api/budget-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      setPlans(prev => prev.map(p => p.id === id ? updated : p));
      if (selectedPlan?.id === id) setSelectedPlan(updated);
      toast.success('Plan updated');
    } catch (error) {
      toast.error('Failed to update plan');
    }
  };
  const handleDeletePlan = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await api(`/api/budget-plans/${id}`, { method: 'DELETE' });
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan deleted');
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };
  const openPlanDetails = (plan: BudgetPlan) => {
    setSelectedPlan(plan);
    setIsSheetOpen(true);
  };
  return (
    <AppLayout
      title="Planning & Budgeting"
      actions={
        <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Plan
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => {
            const plannedCost = plan.items.reduce((acc, item) => acc + item.estimatedCost, 0);
            const progress = Math.min(100, (plannedCost / (plan.totalBudget || 1)) * 100);
            const itemCount = plan.items.length;
            const executedCount = plan.items.filter(i => i.status === 'executed').length;
            return (
              <Card key={plan.id} className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => openPlanDetails(plan)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Calculator className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {format(plan.startDate, 'MMM yyyy')} - {format(plan.endDate, 'MMM yyyy')}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openPlanDetails(plan); }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <Badge variant="outline" className={cn(
                      "capitalize",
                      plan.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {plan.status}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {executedCount}/{itemCount} Executed
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Budget Used</span>
                      <span className="font-medium">${plannedCost.toLocaleString()} / ${plan.totalBudget.toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className={cn("h-2", plannedCost > plan.totalBudget && "bg-red-100 [&>div]:bg-red-500")} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {plans.length === 0 && (
            <div className="col-span-full text-center py-12 border border-dashed rounded-lg bg-muted/10">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground">No budget plans found</h3>
              <p className="text-sm text-muted-foreground mb-4">Create a plan to track expenses and schedule activities.</p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline">Create First Plan</Button>
            </div>
          )}
        </div>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Budget Plan</DialogTitle>
            <DialogDescription>Set up a new financial plan for a season or project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input 
                placeholder="e.g. Spring Planting 2025" 
                value={newPlan.name}
                onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Budget ($)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={newPlan.totalBudget || ''}
                onChange={(e) => setNewPlan({...newPlan, totalBudget: Number(e.target.value)})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={format(newPlan.startDate || Date.now(), 'yyyy-MM-dd')}
                  onChange={(e) => setNewPlan({...newPlan, startDate: new Date(e.target.value).getTime()})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  value={format(newPlan.endDate || Date.now(), 'yyyy-MM-dd')}
                  onChange={(e) => setNewPlan({...newPlan, endDate: new Date(e.target.value).getTime()})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={newPlan.status} 
                onValueChange={(v: any) => setNewPlan({...newPlan, status: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} disabled={!newPlan.name}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PlanDetailsSheet
        plan={selectedPlan}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onUpdate={handleUpdatePlan}
      />
    </AppLayout>
  );
}