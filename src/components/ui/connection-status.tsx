import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online', { description: 'Your connection has been restored.' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline', { description: 'Changes may not be saved until connection is restored.' });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  if (isOnline) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium border border-red-600">
        <WifiOff className="h-4 w-4" />
        <span>Offline Mode</span>
      </div>
    </div>
  );
}