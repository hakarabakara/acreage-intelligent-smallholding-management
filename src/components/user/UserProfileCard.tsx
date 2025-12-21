import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { User as UserIcon, Save, Loader2, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
export function UserProfileCard() {
  const user = useAuth((state) => state.user);
  const updateUser = useAuth((state) => state.updateUser);
  const changePassword = useAuth((state) => state.changePassword);
  const refreshProfile = useAuth((state) => state.refreshProfile);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);
  const handleAvatarUpload = (url: string) => {
    updateUser({ avatar: url });
    toast.success('Profile photo updated');
  };
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    // Simulate network delay for better UX feel
    await new Promise(resolve => setTimeout(resolve, 600));
    updateUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    });
    setIsSaving(false);
    toast.success('Profile updated successfully');
  };
  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsChangingPassword(true);
    try {
      const success = await changePassword(passwordData.current, passwordData.new);
      if (success) {
        toast.success('Password changed successfully');
        setPasswordData({ current: '', new: '', confirm: '' });
      } else {
        toast.error('Incorrect current password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };
  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      toast.success('Permissions refreshed');
    } catch (error) {
      toast.error('Failed to refresh profile');
    } finally {
      setIsRefreshing(false);
    }
  };
  if (!user) return null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              User Profile
              <Badge variant="secondary" className="uppercase text-xs">{user.role}</Badge>
            </CardTitle>
            <CardDescription>Manage your personal information and account security.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefreshProfile} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Permissions
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="general">General Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-border shadow-sm">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                <ImageUpload onUpload={handleAvatarUpload} label="Change Photo" />
              </div>
              {/* Form Section */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="security" className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Secure Your Account</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Use a strong password to protect your farm data. We recommend at least 8 characters with a mix of letters and numbers.
                </p>
              </div>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type="password"
                    className="pl-9"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    className="pl-9"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    className="pl-9"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  variant="outline"
                  className="w-full"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}