import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { User as UserIcon, Calendar, DollarSign, FileText, Shield, Phone, Mail, MapPin, Plus, Trash2, Clock, Briefcase, UserCog } from 'lucide-react';
import type { User, Transaction, LeaveRecord } from '@shared/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ui/image-upload';
interface TeamMemberDetailsSheetProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (id: string, data: Partial<User>) => Promise<void>;
  transactions: Transaction[];
}
export function TeamMemberDetailsSheet({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  transactions
}: TeamMemberDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  // Local state for form fields
  const [formData, setFormData] = useState<Partial<User>>({});
  const [newLeave, setNewLeave] = useState<Partial<LeaveRecord>>({
    type: 'vacation',
    startDate: Date.now(),
    endDate: Date.now(),
    notes: ''
  });
  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        identification: user.identification || { type: 'Passport', number: '', notes: '' },
        nextOfKin: user.nextOfKin || { name: '', relationship: '', phone: '', email: '', address: '' }
      });
    }
  }, [user]);
  if (!user) return null;
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await onUpdateUser(user.id, {
        name: formData.name,
        role: formData.role,
        status: formData.status,
        identification: formData.identification,
        nextOfKin: formData.nextOfKin,
        hourlyRate: Number(formData.hourlyRate),
        startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
        phone: formData.phone,
        email: formData.email,
        avatar: formData.avatar
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleAvatarUpload = async (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }));
    // Auto-save avatar immediately for better UX
    await onUpdateUser(user.id, { avatar: url });
  };
  const handleAddLeave = async () => {
    if (!newLeave.startDate || !newLeave.endDate) return;
    setIsSaving(true);
    try {
      const record: LeaveRecord = {
        id: crypto.randomUUID(),
        startDate: new Date(newLeave.startDate).getTime(),
        endDate: new Date(newLeave.endDate).getTime(),
        type: newLeave.type as any,
        notes: newLeave.notes
      };
      const updatedRecords = [...(user.leaveRecords || []), record];
      await onUpdateUser(user.id, { leaveRecords: updatedRecords });
      setIsLeaveDialogOpen(false);
      setNewLeave({ type: 'vacation', startDate: Date.now(), endDate: Date.now(), notes: '' });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('Delete this leave record?')) return;
    const updatedRecords = (user.leaveRecords || []).filter(r => r.id !== leaveId);
    await onUpdateUser(user.id, { leaveRecords: updatedRecords });
  };
  const userTransactions = transactions.filter(t => t.relatedEntityId === user.id).sort((a, b) => b.date - a.date);
  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-6 w-6 text-slate-500" />
                )}
              </div>
              <div>
                <SheetTitle className="text-xl">{user.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  <span className="text-xs">•</span>
                  <span className={cn("text-xs font-medium", user.status === 'active' ? "text-emerald-600" : "text-muted-foreground")}>
                    {user.status === 'active' ? 'Active Staff' : 'Inactive'}
                  </span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile & ID</TabsTrigger>
              <TabsTrigger value="leave">Leave & Availability</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            {/* PROFILE TAB */}
            <TabsContent value="profile" className="space-y-6 mt-4">
              {/* Core Profile */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCog className="h-4 w-4" /> Core Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Profile Photo</Label>
                      <ImageUpload onUpload={handleAvatarUpload} label="Change Avatar" />
                    </div>
                    {formData.avatar && (
                      <div className="h-16 w-16 rounded-full overflow-hidden border">
                        <img src={formData.avatar} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(v: any) => setFormData({ ...formData, role: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Employment Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFormData({...formData, startDate: e.target.valueAsNumber})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hourly Rate ($)</Label>
                      <Input
                        type="number"
                        value={formData.hourlyRate || ''}
                        onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Identification */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Identification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ID Type</Label>
                      <Select
                        value={formData.identification?.type}
                        onValueChange={(v) => setFormData({
                          ...formData,
                          identification: { ...formData.identification!, type: v }
                        })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="Driver License">Driver License</SelectItem>
                          <SelectItem value="National ID">National ID</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>ID Number</Label>
                      <Input
                        value={formData.identification?.number || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          identification: { ...formData.identification!, number: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.identification?.expiryDate ? format(formData.identification.expiryDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        identification: { ...formData.identification!, expiryDate: e.target.valueAsNumber }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Next of Kin */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserIcon className="h-4 w-4" /> Next of Kin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={formData.nextOfKin?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          nextOfKin: { ...formData.nextOfKin!, name: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input
                        value={formData.nextOfKin?.relationship || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          nextOfKin: { ...formData.nextOfKin!, relationship: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.nextOfKin?.phone || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          nextOfKin: { ...formData.nextOfKin!, phone: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={formData.nextOfKin?.email || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          nextOfKin: { ...formData.nextOfKin!, email: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.nextOfKin?.address || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        nextOfKin: { ...formData.nextOfKin!, address: e.target.value }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
              <Button className="w-full" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </TabsContent>
            {/* LEAVE TAB */}
            <TabsContent value="leave" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Leave History</h3>
                <Button size="sm" variant="outline" onClick={() => setIsLeaveDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Leave
                </Button>
              </div>
              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-4 space-y-4">
                  {(!user.leaveRecords || user.leaveRecords.length === 0) && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No leave records found.
                    </div>
                  )}
                  {user.leaveRecords?.sort((a, b) => b.startDate - a.startDate).map((record) => (
                    <div key={record.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="capitalize">{record.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(record.startDate, 'MMM d, yyyy')} - {format(record.endDate, 'MMM d, yyyy')}
                          </span>
                        </div>
                        {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteLeave(record.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            {/* EXPENSES TAB */}
            <TabsContent value="expenses" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Reimbursements & Expenses</h3>
                <div className="text-sm text-muted-foreground">
                  Total: <span className="font-medium text-foreground">${userTransactions.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}</span>
                </div>
              </div>
              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-4 space-y-3">
                  {userTransactions.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No expenses linked to this user.
                    </div>
                  )}
                  {userTransactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(t.date, 'MMM d, yyyy')}</span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 capitalize">{t.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-red-600">-${t.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      {/* Add Leave Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Leave</DialogTitle>
            <DialogDescription>Log time off for this staff member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newLeave.startDate ? format(newLeave.startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setNewLeave({...newLeave, startDate: e.target.valueAsNumber})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newLeave.endDate ? format(newLeave.endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setNewLeave({...newLeave, endDate: e.target.valueAsNumber})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newLeave.type}
                onValueChange={(v) => setNewLeave({...newLeave, type: v as any})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Reason or details..."
                value={newLeave.notes || ''}
                onChange={(e) => setNewLeave({...newLeave, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLeave} disabled={isSaving}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}