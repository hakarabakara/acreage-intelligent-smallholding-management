import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@shared/types';
interface UserCredentialsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  password?: string;
}
export function UserCredentialsDialog({ isOpen, onClose, user, password = 'password' }: UserCredentialsDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  if (!user) return null;
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <DialogTitle className="text-center">User Created Successfully</DialogTitle>
          <DialogDescription className="text-center">
            Share these credentials with <strong>{user.name}</strong> securely. They will be required to log in for the first time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="relative">
              <Input value={user.email || ''} readOnly className="pr-10 bg-muted/50" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(user.email || '', 'Email')}
              >
                {copiedField === 'Email' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Temporary Password</Label>
            <div className="relative">
              <Input value={password} readOnly className="pr-10 bg-muted/50 font-mono" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(password, 'Password')}
              >
                {copiedField === 'Password' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              This password is only visible now. If lost, an admin will need to reset it manually. The user should change this password after their first login.
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="w-full sm:w-auto min-w-[120px]">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}