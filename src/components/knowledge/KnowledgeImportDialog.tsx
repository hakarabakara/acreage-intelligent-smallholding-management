import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet, Info } from 'lucide-react';
import type { KnowledgeEntry } from '@shared/types';
interface KnowledgeImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: Partial<KnowledgeEntry>[]) => Promise<void>;
}
export function KnowledgeImportDialog({ isOpen, onClose, onImport }: KnowledgeImportDialogProps) {
  const [csvText, setCsvText] = useState('');
  const [importType, setImportType] = useState<'tips' | 'families'>('tips');
  const [parsedData, setParsedData] = useState<Partial<KnowledgeEntry>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationSummary, setValidationSummary] = useState<{ valid: number; skipped: number }>({ valid: 0, skipped: 0 });
  const handleParse = () => {
    if (!csvText.trim()) {
      setError('Please enter CSV data.');
      return;
    }
    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      const data: Partial<KnowledgeEntry>[] = [];
      let skippedCount = 0;
      if (importType === 'tips') {
        // Format: Category, Title, Content
        for (const line of lines) {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 3) {
            skippedCount++;
            continue;
          }
          const categoryRaw = parts[0].toLowerCase();
          const title = parts[1];
          const content = parts.slice(2).join(', ');
          if (!title || !content) {
            skippedCount++;
            continue;
          }
          let category: KnowledgeEntry['category'] = 'general-tip';
          if (categoryRaw.includes('soil')) category = 'soil-tip';
          else if (categoryRaw.includes('rotation')) category = 'rotation-rule';
          data.push({
            category,
            title,
            content
          });
        }
      } else {
        // Format: Crop Name, Family Name
        for (const line of lines) {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 2) {
            skippedCount++;
            continue;
          }
          const cropName = parts[0];
          const familyName = parts[1];
          if (!cropName || !familyName) {
            skippedCount++;
            continue;
          }
          data.push({
            category: 'crop-family',
            title: cropName,
            content: familyName,
            tags: [familyName.toLowerCase()]
          });
        }
      }
      if (data.length === 0) {
        throw new Error('No valid data found. Check format.');
      }
      setParsedData(data);
      setValidationSummary({ valid: data.length, skipped: skippedCount });
      setStep('preview');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV.');
    }
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onImport(parsedData);
      onClose();
      setStep('input');
      setCsvText('');
      setParsedData([]);
      setValidationSummary({ valid: 0, skipped: 0 });
    } catch (err) {
      setError('Failed to import data.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Knowledge Base Data</DialogTitle>
          <DialogDescription>
            Bulk import agronomy tips or crop family classifications.
          </DialogDescription>
        </DialogHeader>
        {step === 'input' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Import Type</Label>
              <Select value={importType} onValueChange={(v: any) => setImportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tips">Agronomy Tips</SelectItem>
                  <SelectItem value="families">Crop Families</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">Expected Format (CSV)</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400 text-xs font-mono mt-1">
                {importType === 'tips' ? (
                  <>
                    Category, Title, Content<br/>
                    Example: Soil, Nitrogen Fixation, Legumes add nitrogen to the soil.
                  </>
                ) : (
                  <>
                    Crop Name, Family Name<br/>
                    Example: Tomato, Solanaceae
                  </>
                )}
              </AlertDescription>
            </Alert>
            <Textarea
              placeholder="Paste your CSV data here..."
              className="h-[200px] font-mono text-sm"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Ready to import {validationSummary.valid} items</span>
              </div>
              {validationSummary.skipped > 0 && (
                <div className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationSummary.skipped} rows skipped (invalid format)
                </div>
              )}
            </div>
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title / Crop</TableHead>
                    <TableHead>Content / Family</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="capitalize text-xs text-muted-foreground">
                        {item.category?.replace('-', ' ')}
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-sm">{item.content}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
        <DialogFooter>
          {step === 'input' ? (
            <Button onClick={handleParse}>
              Preview Data
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? 'Importing...' : 'Import Data'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}