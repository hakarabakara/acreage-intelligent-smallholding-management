import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
interface SelectionBarProps {
  count: number;
  onClear: () => void;
  actions: React.ReactNode;
  label?: string;
  className?: string;
}
export function SelectionBar({ count, onClear, actions, label, className }: SelectionBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4",
            className
          )}
        >
          <div className="bg-foreground text-background rounded-full shadow-2xl border border-border/10 p-2 pl-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="font-medium text-sm whitespace-nowrap">
                {count} {label || 'selected'}
              </span>
              <div className="h-4 w-px bg-background/20" />
              <div className="flex items-center gap-2">
                {actions}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-8 w-8 rounded-full hover:bg-background/20 text-background hover:text-background"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}