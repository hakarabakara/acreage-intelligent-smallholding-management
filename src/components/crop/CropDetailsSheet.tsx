import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sprout, Calendar, Image as ImageIcon, Ruler, Plus, Trash2, TreeDeciduous, Tag, DollarSign, Briefcase } from 'lucide-react';
import type { Crop, Task, HarvestLog, Contact } from '@shared/types';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ui/image-upload';
interface CropDetailsSheetProps {
  crop: Crop | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Crop>) => Promise<void>;
  tasks: Task[];
  harvests: HarvestLog[];
  contacts?: Contact[];
}
export function CropDetailsSheet({ crop, isOpen, onClose, onUpdate, tasks, harvests, contacts = [] }: CropDetailsSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [editCost, setEditCost] = useState<string>('');
  const [editContactId, setEditContactId] = useState<string>('');
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  React.useEffect(() => {
    if (crop) {
      setEditCost(crop.cost?.toString() || '');
      setEditContactId(crop.contactId || '');
    }
  }, [crop]);
  if (!crop) return null;
  const handleUploadPhoto = async (url: string) => {
    setIsSaving(true);
    try {
      const currentPhotos = crop.photos || [];
      await onUpdate(crop.id, { photos: [...currentPhotos, url] });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeletePhoto = async (index: number) => {
    if (!confirm('Remove this photo?')) return;
    const currentPhotos = crop.photos || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    await onUpdate(crop.id, { photos: newPhotos });
  };
  const handleSaveFinancials = async () => {
    setIsSaving(true);
    try {
      await onUpdate(crop.id, {
        cost: editCost ? Number(editCost) : undefined,
        contactId: editContactId || undefined
      });
      setIsEditingFinancials(false);
    } finally {
      setIsSaving(false);
    }
  };
  const daysElapsed = differenceInDays(Date.now(), crop.plantingDate);
  const progress = Math.min(100, Math.max(0, (daysElapsed / (crop.daysToMaturity || 60)) * 100));
  const isPerennial = crop.classification === 'long-term';
  const supplierName = contacts.find(c => c.id === crop.contactId)?.name;
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{crop.plantingMethod || 'Direct'}</Badge>
            <Badge variant={crop.status === 'harvested' ? 'secondary' : 'default'}>{crop.status}</Badge>
            {isPerennial && <Badge variant="secondary" className="bg-amber-100 text-amber-800">Perennial</Badge>}
            {crop.primaryPurpose && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">
                {crop.primaryPurpose}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-2xl">{crop.name}</SheetTitle>
          <SheetDescription>
            {crop.variety} ��� Planted {format(crop.plantingDate, 'MMM d, yyyy')}
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="journal">Photo Journal</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Growth Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                  <span>Day {daysElapsed}</span>
                  <span>{isPerennial ? `${crop.expectedLifespan || '?'} Year Lifespan` : `${crop.daysToMaturity} Days to Maturity`}</span>
                </div>
                {!isPerennial && (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Est. Harvest</Label>
                    <div className="font-medium">{format(crop.estimatedHarvestDate, 'MMM d, yyyy')}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Exp. Yield</Label>
                    <div className="font-medium">{crop.expectedYield ? `${crop.expectedYield} ${crop.yieldUnit}` : '--'}</div>
                  </div>
                  {crop.primaryPurpose && (
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Primary Purpose</Label>
                      <div className="font-medium flex items-center gap-2 capitalize">
                        <Tag className="h-3 w-3 text-blue-500" />
                        {crop.primaryPurpose}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* FINANCIALS CARD */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Financials
                </CardTitle>
                {!isEditingFinancials && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsEditingFinancials(true)}>
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditingFinancials ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Cost ($)</Label>
                      <Input
                        type="number"
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Supplier</Label>
                      <Select value={editContactId} onValueChange={setEditContactId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {contacts.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={handleSaveFinancials} disabled={isSaving}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingFinancials(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cost</Label>
                      <div className="font-medium">{crop.cost ? `${crop.cost.toFixed(2)}` : '--'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Supplier</Label>
                      <div className="font-medium flex items-center gap-1">
                        {crop.contactId ? <Briefcase className="h-3 w-3 text-muted-foreground" /> : null}
                        {supplierName || '--'}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {crop.spacing && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="h-4 w-4" /> Spacing Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-muted/30 p-2 rounded">
                    <div className="text-lg font-bold">{crop.spacing.plantSpacing}"</div>
                    <div className="text-xs text-muted-foreground">In-Row</div>
                  </div>
                  <div className="bg-muted/30 p-2 rounded">
                    <div className="text-lg font-bold">{crop.spacing.rowSpacing}"</div>
                    <div className="text-xs text-muted-foreground">Between Rows</div>
                  </div>
                  <div className="bg-muted/30 p-2 rounded">
                    <div className="text-lg font-bold">{crop.spacing.rowsPerBed}</div>
                    <div className="text-xs text-muted-foreground">Rows/Bed</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          {/* PHOTO JOURNAL */}
          <TabsContent value="journal" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Crop Gallery</h4>
              <ImageUpload onUpload={handleUploadPhoto} label="Add Photo" />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-4">
                {crop.photos?.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border aspect-square bg-muted">
                    <img src={url} alt={`Crop progress ${idx}`} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="icon" onClick={() => handleDeletePhoto(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!crop.photos || crop.photos.length === 0) && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No photos yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          {/* HISTORY */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium mb-2 text-sm">Related Tasks</h4>
              <div className="space-y-2">
                {tasks.length > 0 ? tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span className={t.status === 'done' ? 'line-through text-muted-foreground' : ''}>{t.title}</span>
                    <Badge variant="outline">{t.status}</Badge>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No tasks linked.</p>}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2 text-sm">Harvest Log</h4>
              <div className="space-y-2">
                {harvests.length > 0 ? harvests.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded text-sm">
                    <span>{format(h.date, 'MMM d')}</span>
                    <span className="font-bold">{h.amount} {h.unit}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No harvests recorded.</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}