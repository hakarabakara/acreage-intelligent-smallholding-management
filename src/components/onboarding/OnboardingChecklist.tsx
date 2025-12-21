import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, X, ArrowRight, Sprout, Map, ClipboardList, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
interface OnboardingCounts {
  fields: number;
  crops: number;
  tasks: number;
  team: number;
  transactions: number;
}
interface OnboardingChecklistProps {
  counts: OnboardingCounts;
  className?: string;
}
export function OnboardingChecklist({ counts, className }: OnboardingChecklistProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const hidden = localStorage.getItem('acreage_hide_onboarding');
    if (hidden === 'true') {
      setIsVisible(false);
    }
  }, []);
  const steps = useMemo(() => [
    {
      id: 'fields',
      label: 'Map your first Field',
      description: 'Define your land boundaries to start tracking.',
      icon: Map,
      link: '/fields',
      isComplete: counts.fields > 0,
    },
    {
      id: 'crops',
      label: 'Plan a Crop',
      description: 'Schedule your first planting cycle.',
      icon: Sprout,
      link: '/crops',
      isComplete: counts.crops > 0,
    },
    {
      id: 'team',
      label: 'Add a Team Member',
      description: 'Invite staff to collaborate.',
      icon: Users,
      link: '/team',
      isComplete: counts.team > 1, // Assuming current user is 1
    },
    {
      id: 'tasks',
      label: 'Assign a Task',
      description: 'Create work orders for your team.',
      icon: ClipboardList,
      link: '/tasks',
      isComplete: counts.tasks > 0,
    },
    {
      id: 'finance',
      label: 'Log a Transaction',
      description: 'Record an expense or income.',
      icon: DollarSign,
      link: '/finances',
      isComplete: counts.transactions > 0,
    },
  ], [counts]);
  useEffect(() => {
    const completed = steps.filter(s => s.isComplete).length;
    const total = steps.length;
    // Animate progress
    const timer = setTimeout(() => setProgress((completed / total) * 100), 100);
    return () => clearTimeout(timer);
  }, [steps]); // Recalculate when steps change
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('acreage_hide_onboarding', 'true');
  };
  if (!isVisible) return null;
  const completedCount = steps.filter(s => s.isComplete).length;
  const allComplete = completedCount === steps.length;
  return (
    <Card className={cn("border-emerald-100 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10", className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-emerald-950 dark:text-emerald-50">
            {allComplete ? 'Setup Complete! 🎉' : 'Getting Started'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {allComplete
              ? "You've explored all the core features. You're ready to grow!"
              : `${completedCount} of ${steps.length} steps completed`}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleDismiss}>
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress value={progress} className="h-2 bg-emerald-100 dark:bg-emerald-900/50 [&>div]:bg-emerald-600" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((step) => (
            <Link
              key={step.id}
              to={step.link}
              className={cn(
                "flex flex-col p-3 rounded-lg border transition-all hover:shadow-md group relative overflow-hidden",
                step.isComplete
                  ? "bg-white dark:bg-card border-emerald-200 dark:border-emerald-900 opacity-80 hover:opacity-100"
                  : "bg-white dark:bg-card border-border hover:border-emerald-300 dark:hover:border-emerald-700"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={cn(
                  "p-2 rounded-full",
                  step.isComplete ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground group-hover:bg-emerald-50 group-hover:text-emerald-600"
                )}>
                  <step.icon className="h-4 w-4" />
                </div>
                {step.isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-emerald-400" />
                )}
              </div>
              <h4 className={cn("font-medium text-sm mb-1", step.isComplete && "text-muted-foreground line-through")}>
                {step.label}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {step.description}
              </p>
              {!step.isComplete && (
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-emerald-600" />
                </div>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}