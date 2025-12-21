import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MousePointer2, Maximize2, Layers, HelpCircle, Check, X } from 'lucide-react';
interface MapHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
export function MapHelpDialog({ isOpen, onClose }: MapHelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-emerald-600" />
            Map Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to navigate and manage your farm map boundaries.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* View Mode */}
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <MousePointer2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">View Mode</h4>
              <p className="text-sm text-muted-foreground">
                The default mode for exploring. Click on any field to view its details, crop status, and active tasks. Hover over fields to see quick stats.
              </p>
            </div>
          </div>
          {/* Draw Mode */}
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Maximize2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Draw Mode</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Used to define or edit field boundaries.
              </p>
              <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1 ml-1">
                <li>Select a field from the list or create a new one.</li>
                <li>Click the <strong>Draw</strong> button in the map toolbar.</li>
                <li>Click on the map to place corner points (at least 3).</li>
                <li>Click <strong>Save</strong> <Check className="inline h-3 w-3" /> to finish or <strong>Cancel</strong> <X className="inline h-3 w-3" /> to discard.</li>
              </ol>
            </div>
          </div>
          {/* Layers */}
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Layers & Overlays</h4>
              <p className="text-sm text-muted-foreground">
                Toggle the <strong>Layers</strong> menu to show or hide specific data like Livestock positions, Task indicators, Soil alerts, and Field labels. Switch to Satellite view for real-world context.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}