import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { User as UserIcon, Save, Loader2 } from 'lucide-react';
export function UserProfileCard() {
  const user = useAuth((state) => state.user);
  const updateUser = useAuth((state) => state.updateUser);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSaving, setIsSaving] = useState(false);
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
  const handleSave = async () => {
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
  if (!user) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Manage your personal information and account settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                onClick={handleSave} 
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
      </CardContent>
    </Card>
  );
}