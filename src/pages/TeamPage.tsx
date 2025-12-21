import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User as UserIcon, Mail, Phone, MoreHorizontal, Trash2, Edit, Loader2, CalendarOff, CheckCircle2, Users } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { User, Transaction } from '@shared/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TeamMemberDetailsSheet } from '@/components/team/TeamMemberDetailsSheet';
import { UserCredentialsDialog } from '@/components/team/UserCredentialsDialog';
import { isWithinInterval } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
const userSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'worker', 'viewer']),
  status: z.enum(['active', 'inactive']),
});
type UserFormValues = z.infer<typeof userSchema>;
export function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Credentials Dialog State
  const [newUserCredentials, setNewUserCredentials] = useState<{ user: User, password: string } | null>(null);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'worker',
      status: 'active',
    },
  });
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, transactionsRes] = await Promise.all([
        api<{ items: User[] }>('/api/users'),
        api<{ items: Transaction[] }>('/api/transactions')
      ]);
      setUsers(usersRes.items);
      setTransactions(transactionsRes.items);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const openCreateDialog = () => {
    setSelectedUser(null);
    form.reset({
      name: '',
      email: '',
      phone: '',
      role: 'worker',
      status: 'active',
    });
    setIsDialogOpen(true);
  };
  const openDetailsSheet = (user: User) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };
  const onSubmitCreate = async (data: UserFormValues) => {
    try {
      const created = await api<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUsers(prev => [...prev, created]);
      toast.success('User created');
      setIsDialogOpen(false);
      // Show credentials dialog if email was provided
      if (data.email) {
        setNewUserCredentials({ user: created, password: 'password' });
        setIsCredentialsOpen(true);
      }
    } catch (error) {
      toast.error('Failed to create user');
    }
  };
  const handleUpdateUser = async (id: string, data: Partial<User>) => {
    try {
      const updated = await api<User>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      if (selectedUser?.id === updated.id) {
        setSelectedUser(updated);
      }
      toast.success('User updated');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      await api(`/api/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User removed');
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'worker': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  const isUserOnLeave = (user: User) => {
    if (!user.leaveRecords) return false;
    const now = Date.now();
    return user.leaveRecords.some(record => 
      isWithinInterval(now, { start: record.startDate, end: record.endDate })
    );
  };
  return (
    <AppLayout
      title="Team & Staff"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team..."
              className="pl-9 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members found"
          description="Add staff to manage your farm operations."
          action={<Button onClick={openCreateDialog} variant="outline">Add Member</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const onLeave = isUserOnLeave(user);
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetailsSheet(user)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{user.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={cn("capitalize", getRoleBadge(user.role))}>
                            {user.role}
                          </Badge>
                          {user.status === 'inactive' && (
                            <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetailsSheet(user); }}>
                          <Edit className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-1 border-b border-dashed">
                    <span className="text-muted-foreground">Status</span>
                    {onLeave ? (
                      <span className="flex items-center text-amber-600 font-medium text-xs">
                        <CalendarOff className="h-3 w-3 mr-1" /> On Leave
                      </span>
                    ) : (
                      <span className="flex items-center text-emerald-600 font-medium text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Available
                      </span>
                    )}
                  </div>
                  {user.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {!user.email && !user.phone && (
                    <div className="text-muted-foreground italic">No contact info provided</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new user account for staff.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@farm.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Detailed Sheet */}
      <TeamMemberDetailsSheet
        user={selectedUser}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onUpdateUser={handleUpdateUser}
        transactions={transactions}
      />
      {/* Credentials Dialog */}
      <UserCredentialsDialog
        isOpen={isCredentialsOpen}
        onClose={() => setIsCredentialsOpen(false)}
        user={newUserCredentials?.user || null}
        password={newUserCredentials?.password}
      />
    </AppLayout>
  );
}