import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Map,
  Sprout,
  Tractor,
  ClipboardList,
  Warehouse,
  DollarSign,
  Settings,
  LogOut,
  Search,
  ShoppingCart,
  ShieldCheck,
  BarChart3,
  Users,
  Contact2,
  Zap,
  Calendar,
  HelpCircle,
  Calculator,
  User as UserIcon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HelpDialog } from "@/components/help/HelpDialog";
import { useAuth } from "@/lib/auth";
import { useFarmStore } from "@/lib/farm-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const isActive = (path: string) => pathname === path;
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);
  const settings = useFarmStore((state) => state.settings);
  const fetchSettings = useFarmStore((state) => state.fetchSettings);
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  const handleSignOut = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };
  return (
    <>
      <Sidebar className="border-r border-border/50 bg-sidebar-background">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground truncate max-w-[160px]">
                {settings?.name || 'Acreage'}
              </h1>
              <p className="text-xs text-muted-foreground">Farm Management</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <SidebarInput placeholder="Search..." className="pl-9 bg-background/50" />
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/')} tooltip="Dashboard">
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/calendar')} tooltip="Calendar">
                  <Link to="/calendar">
                    <Calendar />
                    <span>Calendar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/fields')} tooltip="Fields & Land">
                  <Link to="/fields">
                    <Map />
                    <span>Fields & Land</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/tasks')} tooltip="Tasks">
                  <Link to="/tasks">
                    <ClipboardList />
                    <span>Tasks & Work</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">3</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/resources')} tooltip="Resources">
                  <Link to="/resources">
                    <Zap />
                    <span>Resources</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Production</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/crops')} tooltip="Crops">
                  <Link to="/crops">
                    <Sprout />
                    <span>Crops</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/livestock')} tooltip="Livestock">
                  <Link to="/livestock">
                    <Tractor />
                    <span>Livestock</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/inventory')} tooltip="Inventory">
                  <Link to="/inventory">
                    <Warehouse />
                    <span>Inventory</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>People</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/team')} tooltip="Team & Staff">
                  <Link to="/team">
                    <Users />
                    <span>Team & Staff</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/contacts')} tooltip="Contacts">
                  <Link to="/contacts">
                    <Contact2 />
                    <span>Contacts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Business</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/planning')} tooltip="Planning & Budget">
                  <Link to="/planning">
                    <Calculator />
                    <span>Planning & Budget</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/sales')} tooltip="Sales & Customers">
                  <Link to="/sales">
                    <ShoppingCart />
                    <span>Sales & Customers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/finances')} tooltip="Finances">
                  <Link to="/finances">
                    <DollarSign />
                    <span>Finances</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/analytics')} tooltip="Reports">
                  <Link to="/analytics">
                    <BarChart3 />
                    <span>Reports & Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/compliance')} tooltip="Compliance">
                  <Link to="/compliance">
                    <ShieldCheck />
                    <span>Compliance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          {/* User Profile Section */}
          <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
            <Avatar className="h-8 w-8 rounded-lg border border-border">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="rounded-lg bg-emerald-100 text-emerald-700">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{user?.name || 'User'}</span>
              <span className="text-xs text-muted-foreground truncate capitalize">{user?.role || 'Guest'}</span>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setIsHelpOpen(true)} tooltip="Help & Support">
                <HelpCircle />
                <span>Help & Support</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/settings')} tooltip="Settings">
                <Link to="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}