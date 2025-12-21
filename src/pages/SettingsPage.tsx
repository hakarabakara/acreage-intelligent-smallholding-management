import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Tractor, ShieldCheck } from 'lucide-react';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { OperationsSettings } from '@/components/settings/OperationsSettings';
import { SystemSettings } from '@/components/settings/SystemSettings';
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  return (
    <AppLayout title="Settings">
      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="w-full justify-start md:grid md:grid-cols-3 inline-flex min-w-full md:min-w-0">
              <TabsTrigger value="general" className="flex items-center gap-2 flex-1">
                <Settings className="h-4 w-4" /> General
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex items-center gap-2 flex-1">
                <Tractor className="h-4 w-4" /> Operations
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2 flex-1">
                <ShieldCheck className="h-4 w-4" /> System
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>
          <TabsContent value="operations">
            <OperationsSettings />
          </TabsContent>
          <TabsContent value="system">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}