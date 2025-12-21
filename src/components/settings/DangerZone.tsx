import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Upload, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
interface DangerZoneProps {
  onReset: () => void;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isResetting: boolean;
  isRestoring: boolean;
}
export function DangerZone({ onReset, onRestore, isResetting, isRestoring }: DangerZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10">
      <CardHeader>
        <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-red-600/80 dark:text-red-400/80">
          Irreversible actions. Proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Restore Data */}
        <div className="flex items-center justify-between p-4 bg-background border rounded-lg">
          <div>
            <h4 className="font-medium">Restore Data</h4>
            <p className="text-sm text-muted-foreground">Overwrite current farm data with a backup file. This will replace existing records.</p>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={onRestore}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/50"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {isRestoring ? 'Restoring...' : 'Upload Backup'}
            </Button>
          </div>
        </div>
        {/* Reset Data */}
        <div className="flex items-center justify-between p-4 bg-background border border-red-200 dark:border-red-900 rounded-lg">
          <div>
            <h4 className="font-medium text-red-700 dark:text-red-400">Wipe Farm Data</h4>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">Permanently delete all operational records.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isResetting}>
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {isResetting ? 'Wiping...' : 'Reset Data'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your crops, tasks, livestock, inventory, and financial records.
                  <br/><br/>
                  Your account and farm settings will be preserved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onReset} className="bg-red-600 hover:bg-red-700">
                  Yes, Wipe Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}