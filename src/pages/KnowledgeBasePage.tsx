import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, RotateCw, Sprout, AlertTriangle, Info, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { CROP_FAMILIES, ROTATION_RULES, getRotationSuggestions } from '@/lib/knowledge-base';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { KnowledgeEntry } from '@shared/types';
import { KnowledgeImportDialog } from '@/components/knowledge/KnowledgeImportDialog';
import { toast } from 'sonner';
export function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('families');
  const [dynamicEntries, setDynamicEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const res = await api<{ items: KnowledgeEntry[] }>('/api/knowledge?limit=1000');
      setDynamicEntries(res.items);
    } catch (error) {
      console.error('Failed to load knowledge entries', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchEntries();
  }, []);
  const handleImport = async (entries: Partial<KnowledgeEntry>[]) => {
    try {
      await api('/api/knowledge/bulk', {
        method: 'POST',
        body: JSON.stringify(entries)
      });
      toast.success(`Imported ${entries.length} items`);
      fetchEntries();
    } catch (error) {
      toast.error('Import failed');
    }
  };
  // Merge static and dynamic data
  const allFamilies = { ...CROP_FAMILIES };
  dynamicEntries.filter(e => e.category === 'crop-family').forEach(e => {
    allFamilies[e.title.toLowerCase()] = e.content as any;
  });
  const filteredFamilies = Object.entries(allFamilies).filter(([crop]) =>
    crop.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Merge tips
  const dynamicTips = dynamicEntries.filter(e => e.category !== 'crop-family');
  const rotationSuggestions = searchQuery ? getRotationSuggestions(searchQuery) : [];
  return (
    <AppLayout
      title="Knowledge Hub"
      actions={
        <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" /> Import Data
        </Button>
      }
    >
      <div className="space-y-6 pb-8">
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Farm Reference Guide</h2>
          <p className="text-muted-foreground">
            Access crop families, rotation rules, and soil health best practices.
          </p>
        </div>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a crop (e.g. Tomato, Corn)..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-emerald-600" />
                  Results for "{searchQuery}"
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredFamilies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredFamilies.map(([crop, family]) => (
                      <Badge key={crop} variant="secondary" className="text-sm py-1 px-3">
                        {crop} <span className="mx-1 text-muted-foreground">•</span> {family}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific crop matches found in database.</p>
                )}
                {rotationSuggestions.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-emerald-200 dark:border-emerald-900">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <RotateCw className="h-4 w-4" /> Rotation Advice
                    </h4>
                    {rotationSuggestions.map((suggestion, idx) => (
                      <div key={idx} className={cn(
                        "text-sm p-3 rounded-lg border",
                        suggestion.type === 'recommendation' ? "bg-emerald-100/50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                        suggestion.type === 'warning' ? "bg-amber-100/50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                        "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      )}>
                        <div className="font-medium flex items-center gap-2 mb-1">
                          {suggestion.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                           suggestion.type === 'recommendation' ? <CheckCircle2 className="h-4 w-4" /> :
                           <Info className="h-4 w-4" />}
                          {suggestion.message}
                        </div>
                        <div className="text-xs opacity-90 pl-6">{suggestion.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="families">Crop Families</TabsTrigger>
            <TabsTrigger value="soil">Soil Health</TabsTrigger>
            <TabsTrigger value="custom">Custom Tips</TabsTrigger>
          </TabsList>
          <TabsContent value="families">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(ROTATION_RULES).map(([family, rules]) => (
                <Card key={family} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
                      {family}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {Object.entries(allFamilies)
                        .filter(([_, f]) => f === family)
                        .map(([c]) => c)
                        .slice(0, 5)
                        .join(', ')}
                      {Object.entries(allFamilies).filter(([_, f]) => f === family).length > 5 && '...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                    <div className="p-2 bg-muted/50 rounded">
                      <span className="font-medium text-xs uppercase tracking-wider text-muted-foreground block mb-1">Reasoning</span>
                      {rules.reason}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-xs uppercase tracking-wider text-emerald-600 block mb-1">Suggest Next</span>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {rules.suggest.length > 0 ? rules.suggest.map(f => <li key={f}>{f}</li>) : <li>Any</li>}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-xs uppercase tracking-wider text-red-600 block mb-1">Avoid Next</span>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {rules.avoid.length > 0 ? rules.avoid.map(f => <li key={f}>{f}</li>) : <li>None</li>}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="soil">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-emerald-600" />
                    Nitrogen Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p>
                    Nitrogen is crucial for leafy growth. Heavy feeders like corn and brassicas deplete it rapidly.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span>Plant legumes (beans, peas, clover) to fix atmospheric nitrogen into the soil.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span>Apply composted manure or blood meal for a quick boost.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCw className="h-5 w-5 text-blue-600" />
                    Organic Matter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p>
                    Organic matter improves soil structure, water retention, and microbial life. Aim for 5%+.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Use cover crops (rye, vetch) during fallow periods to build biomass.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Practice no-till or low-till farming to preserve soil structure.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    pH Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p>
                    Most vegetables prefer a pH between 6.0 and 7.0.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                      <span><strong>Acidic Soil (&lt; 6.0):</strong> Add agricultural lime to raise pH.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                      <span><strong>Alkaline Soil (&gt; 7.5):</strong> Add sulfur or peat moss to lower pH.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="custom">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : dynamicTips.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-muted-foreground">No custom tips yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Import your own agronomy notes to see them here.</p>
                <Button variant="outline" onClick={() => setIsImportOpen(true)}>Import Data</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicTips.map(tip => (
                  <Card key={tip.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{tip.title}</CardTitle>
                        <Badge variant="outline" className="capitalize text-xs">{tip.category.replace('-tip', '')}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{tip.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>
            Data compiled from general agricultural extension guidelines and best practices.
            Always consult local agronomists for region-specific advice.
          </p>
        </div>
      </div>
      <KnowledgeImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />
    </AppLayout>
  );
}