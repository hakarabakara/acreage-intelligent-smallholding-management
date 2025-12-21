import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bug, CheckCircle2, AlertTriangle, Trash2, Scan } from 'lucide-react';
import { analyzeCropImage } from '@/lib/diagnosis-service';
import { api } from '@/lib/api-client';
import type { DiagnosticLog } from '@shared/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
export function CropDiagnostics() {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<DiagnosticLog | null>(null);
  useEffect(() => {
    fetchLogs();
  }, []);
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api<{ items: DiagnosticLog[] }>('/api/diagnostics');
      setLogs(res.items.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error('Failed to load diagnostic logs', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleImageUpload = async (url: string) => {
    setIsAnalyzing(true);
    setCurrentAnalysis(null);
    try {
      const result = await analyzeCropImage(url);
      const newLog: Partial<DiagnosticLog> = {
        date: Date.now(),
        imageUrl: url,
        ...result
      };
      const savedLog = await api<DiagnosticLog>('/api/diagnostics', {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
      setLogs(prev => [savedLog, ...prev]);
      setCurrentAnalysis(savedLog);
      toast.success('Analysis complete');
    } catch (error) {
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete this diagnostic record?')) return;
    try {
      await api(`/api/diagnostics/${id}`, { method: 'DELETE' });
      setLogs(prev => prev.filter(l => l.id !== id));
      if (currentAnalysis?.id === id) setCurrentAnalysis(null);
      toast.success('Record deleted');
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Analysis Panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-emerald-600" />
              AI Crop Doctor
            </CardTitle>
            <CardDescription>
              Upload a photo of a leaf or plant to detect diseases and pests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/10">
              {isAnalyzing ? (
                <div className="text-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
                  <p className="text-sm text-muted-foreground">Analyzing plant health...</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <ImageUpload 
                    onUpload={handleImageUpload} 
                    label="Upload Plant Photo" 
                    className="w-full justify-center"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG. Max size: 5MB.
                  </p>
                </div>
              )}
            </div>
            {currentAnalysis && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-card shadow-sm">
                  <div className="h-24 w-24 rounded-md overflow-hidden flex-shrink-0 border">
                    <img src={currentAnalysis.imageUrl} alt="Analyzed Crop" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{currentAnalysis.condition}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={cn("capitalize", getSeverityColor(currentAnalysis.severity))}>
                            {currentAnalysis.severity} Severity
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {(currentAnalysis.confidence * 100).toFixed(0)}% Confidence
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <span className="font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Recommendation</span>
                      {currentAnalysis.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* History Panel */}
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Diagnostic History</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm px-4">
                  No diagnostic records found.
                </div>
              ) : (
                <div className="divide-y">
                  {logs.map(log => (
                    <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors flex gap-3 group">
                      <div className="h-12 w-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                        <img src={log.imageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm truncate">{log.condition}</h4>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(log.date, 'MMM d')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {log.recommendation}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                        onClick={() => handleDeleteLog(log.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}