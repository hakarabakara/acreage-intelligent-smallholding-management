import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sprout, ClipboardList, CloudSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuickEntry } from '@/hooks/use-quick-entry';
import { cn } from '@/lib/utils';
export function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const openHarvest = useQuickEntry((state) => state.openHarvest);
  const openTask = useQuickEntry((state) => state.openTask);
  const openWeather = useQuickEntry((state) => state.openWeather);
  const toggleOpen = () => setIsOpen(!isOpen);
  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };
  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                onClick={() => handleAction(openWeather)}
              >
                <CloudSun className="h-5 w-5 text-cyan-600" />
                <span className="sr-only">Log Weather</span>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                onClick={() => handleAction(openTask)}
              >
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <span className="sr-only">Add Task</span>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                onClick={() => handleAction(openHarvest)}
              >
                <Sprout className="h-5 w-5 text-emerald-600" />
                <span className="sr-only">Log Harvest</span>
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-xl transition-transform duration-300",
          isOpen ? "bg-neutral-800 hover:bg-neutral-900 rotate-45" : "bg-emerald-600 hover:bg-emerald-700"
        )}
        onClick={toggleOpen}
      >
        <Plus className="h-6 w-6 text-white" />
        <span className="sr-only">Quick Actions</span>
      </Button>
    </div>
  );
}