import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { CommandMenu } from "@/components/CommandMenu";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { QuickActionFAB } from "@/components/mobile/QuickActionFAB";
import { QuickEntrySheets } from "@/components/mobile/QuickEntrySheets";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
  title?: string;
  actions?: React.ReactNode;
};
export function AppLayout({
  children,
  container = true,
  className,
  contentClassName,
  title,
  actions
}: AppLayoutProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <ConnectionStatus />
      <SidebarInset className={cn("bg-neutral-50 dark:bg-neutral-950 min-h-screen flex flex-col", className)}>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/50 backdrop-blur-sm px-4 sticky top-0 z-20">
          <SidebarTrigger className="-ml-1" />
          <div className="mr-4 hidden md:block h-4 w-px bg-border" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight">{title || 'Acreage'}</h1>
            <div className="flex items-center gap-2">
              {actions}
              <NotificationCenter />
              <ThemeToggle className="relative top-0 right-0" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {container ? (
            <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", contentClassName)}>
              {children}
            </div>
          ) : (
            children
          )}
        </main>
        <QuickActionFAB />
        <QuickEntrySheets />
      </SidebarInset>
      <CommandMenu />
      <WelcomeDialog />
    </SidebarProvider>
  );
}