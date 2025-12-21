import React, { useEffect, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Sprout,
  Tractor,
  ClipboardList,
  Warehouse,
  DollarSign,
  Settings,
  Users,
  Contact2,
  ShoppingCart,
  ShieldCheck,
  BarChart3,
  Moon,
  Sun,
  Plus,
  Search,
  Zap,
  Calendar,
  Calculator
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useGlobalSearch } from '@/hooks/use-global-search';
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { items: searchItems, isLoading } = useGlobalSearch();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };
  const getIcon = (type: string) => {
    switch (type) {
      case 'field': return <Map className="mr-2 h-4 w-4" />;
      case 'task': return <ClipboardList className="mr-2 h-4 w-4" />;
      case 'livestock': return <Tractor className="mr-2 h-4 w-4" />;
      case 'inventory': return <Warehouse className="mr-2 h-4 w-4" />;
      case 'contact': return <Contact2 className="mr-2 h-4 w-4" />;
      case 'resource': return <Zap className="mr-2 h-4 w-4" />;
      default: return <Search className="mr-2 h-4 w-4" />;
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[640px]">
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Search for actions, pages, and records.
        </DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Type a command or search records..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {/* Dynamic Search Results */}
            {!isLoading && searchItems.length > 0 && (
              <CommandGroup heading="Search Results">
                {searchItems.map((item) => (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    value={`${item.title} ${item.subtitle} ${item.type}`}
                    onSelect={() => runCommand(() => navigate(item.url))}
                  >
                    {getIcon(item.type)}
                    <div className="flex flex-col ml-2">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/calendar'))}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/fields'))}>
                <Map className="mr-2 h-4 w-4" />
                <span>Fields & Land</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/tasks'))}>
                <ClipboardList className="mr-2 h-4 w-4" />
                <span>Tasks</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/crops'))}>
                <Sprout className="mr-2 h-4 w-4" />
                <span>Crops</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/livestock'))}>
                <Tractor className="mr-2 h-4 w-4" />
                <span>Livestock</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/inventory'))}>
                <Warehouse className="mr-2 h-4 w-4" />
                <span>Inventory</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/planning'))}>
                <Calculator className="mr-2 h-4 w-4" />
                <span>Planning & Budget</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/finances'))}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Finances</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/sales'))}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span>Sales</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/analytics'))}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Analytics</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/team'))}>
                <Users className="mr-2 h-4 w-4" />
                <span>Team</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/contacts'))}>
                <Contact2 className="mr-2 h-4 w-4" />
                <span>Contacts</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/resources'))}>
                <Zap className="mr-2 h-4 w-4" />
                <span>Resources</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/compliance'))}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Compliance</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => runCommand(() => navigate('/tasks'))}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Create Task</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/crops'))}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Plan Crop</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/finances'))}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Log Transaction</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Theme">
              <CommandItem onSelect={() => runCommand(() => toggleTheme())}>
                <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="ml-6">Toggle Theme</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}