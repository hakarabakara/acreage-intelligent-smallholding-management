import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Keyboard, HelpCircle, BookOpen, Mail, Command, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-emerald-600" />
            Help & Documentation
          </DialogTitle>
          <DialogDescription>
            Quick guide to navigating and using Acreage efficiently.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Shortcuts Section */}
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Keyboard className="h-5 w-5 text-blue-500" />
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium">Open Command Menu</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-background font-mono">⌘</Badge>
                    <Badge variant="outline" className="bg-background font-mono">K</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium">Quick Search</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-background font-mono">Ctrl</Badge>
                    <Badge variant="outline" className="bg-background font-mono">K</Badge>
                  </div>
                </div>
              </div>
            </section>
            <Separator />
            {/* Modules Overview */}
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                Getting Started
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    Fields & Land
                  </h4>
                  <p className="text-sm text-muted-foreground pl-5">
                    Map your farm by defining fields, pastures, and beds. Track soil health and set up rotations.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    Crop Operations
                  </h4>
                  <p className="text-sm text-muted-foreground pl-5">
                    Plan seasonal plantings and track perennials. Use the Planting Wizard to auto-generate tasks.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    Task Force
                  </h4>
                  <p className="text-sm text-muted-foreground pl-5">
                    Assign work to staff or contractors. Link tasks to specific fields or livestock for better tracking.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    Financial Ledger
                  </h4>
                  <p className="text-sm text-muted-foreground pl-5">
                    Log income and expenses. Transactions are automatically generated from crop and task costs.
                  </p>
                </div>
              </div>
            </section>
            <Separator />
            {/* Support */}
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-purple-500" />
                Support
              </h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                  Need technical assistance or have a feature request?
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:support@acreage.app" className="hover:underline">support@acreage.app</a>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}