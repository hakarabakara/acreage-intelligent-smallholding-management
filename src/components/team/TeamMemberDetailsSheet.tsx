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
import { User as UserIcon, Shield, Plus, Trash2, Briefcase, UserCog, Award, TrendingUp, CreditCard, Send } from 'lucide-react';
import type { User, Transaction, LeaveRecord, BonusRecord, PaymentMethod } from '@shared/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ui/image-upload';
import { BonusDialog } from '@/components/team/BonusDialog';
import { TagInput } from '@/components/ui/tag-input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  const [isBonusDialogOpen, setIsBonusDialogOpen] = useState(false);
  // Local state for form fields
  const [formData, setFormData] = useState<Partial<User>>({});
  const [newLeave, setNewLeave] = useState<Partial<LeaveRecord>>({
    type: 'vacation',
    startDate: Date.now(),
    endDate: Date.now(),
    notes: ''
  });
  // Payment Method State
  const [newPaymentMethod, setNewPaymentMethod] = useState<Partial<PaymentMethod>>({
    type: 'Bank Transfer',
    details: '',
    isDefault: false
  });
  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        identification: user.identification || { type: 'Passport', number: '', notes: '' },
        nextOfKin: user.nextOfKin || { name: '', relationship: '', phone: '', email: '', address: '' },
        skills: user.skills || [],
        interests: user.interests || [],
        employmentType: user.employmentType,
        paymentMethods: user.paymentMethods || [],
        bonuses: user.bonuses || []
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
        avatar: formData.avatar,
        skills: formData.skills,
        interests: formData.interests,
        employmentType: formData.employmentType,
        paymentMethods: formData.paymentMethods
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  const handleAvatarUpload = async (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }));
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
  const handleAddBonus = async (bonus: BonusRecord) => {
    const updatedBonuses = [...(user.bonuses || []), bonus];
    await onUpdateUser(user.id, { bonuses: updatedBonuses });
  };
  const handleDeleteBonus = async (bonusId: string) => {
    if (!confirm('Delete this bonus record?')) return;
    const updatedBonuses = (user.bonuses || []).filter(b => b.id !== bonusId);
    await onUpdateUser(user.id, { bonuses: updatedBonuses });
  };
  // Payment Method Handlers
  const handleAddPaymentMethod = () => {
    if (!newPaymentMethod.details) return;
    const method: PaymentMethod = {
      id: crypto.randomUUID(),
      type: newPaymentMethod.type || 'Bank Transfer',
      details: newPaymentMethod.details,
      isDefault: (formData.paymentMethods?.length === 0) || !!newPaymentMethod.isDefault
    };
    let updatedMethods = [...(formData.paymentMethods || [])];
    if (method.isDefault) {
      updatedMethods = updatedMethods.map(m => ({ ...m, isDefault: false }));
    }
    updatedMethods.push(method);
    setFormData(prev => ({ ...prev, paymentMethods: updatedMethods }));
    setNewPaymentMethod({ type: 'Bank Transfer', details: '', isDefault: false });
  };
  const handleDeletePaymentMethod = (id: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods?.filter(m => m.id !== id)
    }));
  };
  const handleDispatchPayment = (method: PaymentMethod) => {
    toast.info(`Initiating ${method.type} payment`, {
      description: `To: ${method.details}. Integration coming soon.`
    });
  };
  const totalBonuses = (user.bonuses || []).reduce((acc, b) => acc + b.amount, 0);
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="leave">Leave</TabsTrigger>
            </TabsList>
            {/* PROFILE TAB */}
            <TabsContent value="profile" className="space-y-6 mt-4">
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Professional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(v: any) => setFormData({ ...formData, employmentType: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long-term">Long-term</SelectItem>
                        <SelectItem value="short-term">Short-term</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <TagInput
                      value={formData.skills || []}
                      onChange={(tags) => setFormData({ ...formData, skills: tags })}
                      placeholder="Add skills (e.g. Tractor Driving)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interests</Label>
                    <TagInput
                      value={formData.interests || []}
                      onChange={(tags) => setFormData({ ...formData, interests: tags })}
                      placeholder="Add interests (e.g. Livestock)"
                    />
                  </div>
                </CardContent>
              </Card>
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
                </CardContent>
              </Card>
              <Button className="w-full" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </TabsContent>
            {/* PAYMENTS TAB */}
            <TabsContent value="payments" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Method */}
                  <div className="bg-muted/30 p-3 rounded-lg border space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <Select
                          value={newPaymentMethod.type}
                          onValueChange={(v) => setNewPaymentMethod({ ...newPaymentMethod, type: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                            <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Details (e.g. Account #)"
                          value={newPaymentMethod.details}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, details: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full" onClick={handleAddPaymentMethod} disabled={!newPaymentMethod.details}>
                      <Plus className="h-3 w-3 mr-1" /> Add Method
                    </Button>
                  </div>
                  {/* List Methods */}
                  <div className="space-y-2">
                    {formData.paymentMethods?.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{method.type}</span>
                            {method.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{method.details}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleDispatchPayment(method)} title="Dispatch Payment">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeletePaymentMethod(method.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!formData.paymentMethods || formData.paymentMethods.length === 0) && (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No payment methods added.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Button className="w-full" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Payment Changes'}
              </Button>
            </TabsContent>
            {/* PERFORMANCE TAB */}
            <TabsContent value="performance" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Performance Bonuses</h3>
                <Button size="sm" variant="outline" onClick={() => setIsBonusDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Bonus
                </Button>
              </div>
              <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Bonuses</p>
                    <h3 className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-100">
                      ${totalBonuses.toFixed(2)}
                    </h3>
                  </div>
                  <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-4 space-y-3">
                  {(!user.bonuses || user.bonuses.length === 0) && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No bonuses recorded.
                    </div>
                  )}
                  {user.bonuses?.sort((a, b) => b.date - a.date).map((bonus) => (
                    <div key={bonus.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{bonus.reason}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(bonus.date, 'MMM d, yyyy')}
                          </span>
                        </div>
                        {bonus.metric && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span>{bonus.metric}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-600">+${bonus.amount.toFixed(2)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteBonus(bonus.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
      <BonusDialog
        isOpen={isBonusDialogOpen}
        onClose={() => setIsBonusDialogOpen(false)}
        onSave={handleAddBonus}
      />
    </>
  );
}