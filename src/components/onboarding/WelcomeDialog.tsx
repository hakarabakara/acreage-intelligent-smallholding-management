import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sprout, Map, ClipboardList, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuth((state) => state.user);
  useEffect(() => {
    // Check if user has seen the welcome dialog
    const hasSeenWelcome = localStorage.getItem('acreage_has_seen_welcome');
    // Only show if they haven't seen it and are logged in
    if (!hasSeenWelcome && user) {
      // Small delay for better UX after login transition
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);
  const handleGetStarted = () => {
    localStorage.setItem('acreage_has_seen_welcome', 'true');
    setIsOpen(false);
  };
  const handleNavigate = (path: string) => {
    localStorage.setItem('acreage_has_seen_welcome', 'true');
    setIsOpen(false);
    navigate(path);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="bg-emerald-600 p-6 text-white text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-white mb-2">Welcome to Acreage, {user?.name?.split(' ')[0] || 'Farmer'}!</DialogTitle>
          <DialogDescription className="text-emerald-100 text-base">
            Your all-in-one command center for intelligent farm management is ready.
          </DialogDescription>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Quick Start Guide</h3>
            <div 
              className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => handleNavigate('/fields')}
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Map className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  Map Your Land
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-sm text-muted-foreground">Define your fields, pastures, and beds to start tracking production.</p>
              </div>
            </div>
            <div 
              className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => handleNavigate('/crops')}
            >
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-md text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Sprout className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  Plan Your Crops
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-sm text-muted-foreground">Use the Planting Wizard to schedule seedings and harvests.</p>
              </div>
            </div>
            <div 
              className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => handleNavigate('/tasks')}
            >
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-md text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  Assign Tasks
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-sm text-muted-foreground">Organize your workforce and track daily operations.</p>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground text-center">
            Follow the <strong>Getting Started</strong> checklist on your dashboard to complete your farm setup.
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 bg-gray-50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Demo data loaded</span>
          </div>
          <Button onClick={handleGetStarted} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}