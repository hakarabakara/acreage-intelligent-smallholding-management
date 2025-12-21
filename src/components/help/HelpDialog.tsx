import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Keyboard, HelpCircle, BookOpen, Mail, ArrowRight, Tractor, Warehouse, ShoppingCart, ShieldCheck, BarChart3, Sprout, ClipboardList, DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-emerald-600" />
            Help & Documentation
          </DialogTitle>
          <DialogDescription>
            Comprehensive guide to managing your farm with Acreage.
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
                  <span className="text-sm font-medium">Create Task</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-background font-mono">C</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium">Quick Note</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-background font-mono">N</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium">Go Home</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-background font-mono">H</Badge>
                  </div>
                </div>
              </div>
            </section>
            <Separator />
            {/* Modules Overview */}
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                Module Guides
              </h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="operations">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-emerald-600" />
                      <span>Operations & Production</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Fields & Land</h4>
                      <p className="text-sm text-muted-foreground">
                        Map your farm boundaries using the interactive map. Define soil profiles to get automated alerts about nutrient deficiencies. Use the "Hierarchy" view to nest beds within fields.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Crop Planning</h4>
                      <p className="text-sm text-muted-foreground">
                        Use the <strong>Planting Wizard</strong> to schedule crops. It automatically generates tasks for sowing, transplanting, and harvesting based on the crop's maturity days. Use the "Timeline" view to visualize overlaps.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Task Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Assign tasks to team members or external contractors. Use <strong>Task Templates</strong> in Settings to quickly create recurring jobs like "Daily Feeding" or "Weekly Maintenance".
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="livestock">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-4 w-4 text-amber-600" />
                      <span>Livestock & Inventory</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Livestock Tracking</h4>
                      <p className="text-sm text-muted-foreground">
                        Register animals individually or in herds. Track lineage (Dam/Sire) and health history. Use the <strong>Bulk Move</strong> feature to relocate entire herds to different pastures efficiently.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Inventory Control</h4>
                      <p className="text-sm text-muted-foreground">
                        Track seeds, feed, and equipment. Set low stock thresholds to get alerts. Use the <strong>Stocktake</strong> tool to audit physical inventory and reconcile discrepancies in one batch.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="business">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-purple-600" />
                      <span>Business & Sales</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Sales Pipeline</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage customer orders from "Pending" to "Delivered". Use the Kanban board to visualize order status. Generate professional invoices directly from order records.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Financial Ledger</h4>
                      <p className="text-sm text-muted-foreground">
                        Log all income and expenses. Link transactions to specific crops or fields to calculate profitability. Create <strong>Budget Plans</strong> to forecast seasonal costs and track actual spending against limits.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="compliance">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      <span>Compliance & Safety</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Audit Logs</h4>
                      <p className="text-sm text-muted-foreground">
                        Record safety inspections, certifications, and training. Set "Next Due" dates to get reminders for renewals.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Traceability</h4>
                      <p className="text-sm text-muted-foreground">
                        Use the <strong>Traceability Explorer</strong> to track a product's journey by Lot Number. It links Harvests &rarr; Inventory &rarr; Sales to provide a complete chain of custody.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="analytics">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-rose-600" />
                      <span>Analytics & Reports</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Labor Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Analyze workforce efficiency. View hours worked by category (e.g., Harvest vs Maintenance) and track labor costs over time.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Report Generator</h4>
                      <p className="text-sm text-muted-foreground">
                        Export data for Harvests, Financials, Compliance, or Tasks as CSV files for external analysis or record-keeping.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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