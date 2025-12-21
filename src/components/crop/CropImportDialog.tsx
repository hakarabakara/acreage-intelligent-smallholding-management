import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import type { CropVariety } from '@shared/types';
interface CropImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (varieties: Partial<CropVariety>[]) => Promise<void>;
}
export function CropImportDialog({ isOpen, onClose, onImport }: CropImportDialogProps) {
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<Partial<CropVariety>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const handleParse = () => {
    if (!csvText.trim()) {
      setError('Please enter CSV data.');
      return;
    }
    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one data row.');
      }
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      // Basic validation of headers
      if (!headers.includes('name') || !headers.includes('days')) {
        throw new Error('CSV must contain "Name" and "Days" columns.');
      }
      const data: Partial<CropVariety>[] = [];
      const errors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        // Skip empty lines
        if (values.length === 1 && values[0] === '') continue;
        if (values.length < headers.length) {
          errors.push(`Row ${i + 1}: Insufficient columns.`);
          continue;
        }
        const item: any = {};
        const tasks: { type: string; dayOffset: number }[] = [];
        let rowValid = true;
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === 'name') {
            if (!value) {
              errors.push(`Row ${i + 1}: Name is required.`);
              rowValid = false;
            }
            item.name = value;
          } else if (header === 'variety') {
            item.variety = value;
          } else if (header === 'days') {
            const days = Number(value);
            if (isNaN(days) || days <= 0) {
              errors.push(`Row ${i + 1}: "Days" must be a positive number.`);
              rowValid = false;
            }
            item.daysToMaturity = days;
          } else if (header === 'method') {
            item.plantingMethod = value.toLowerCase() === 'transplant' ? 'transplant' : 'direct';
          } else if (header === 'season') {
            item.preferredSeason = value;
          } else if (header === 'notes') {
            item.notes = value;
          } else if (header === 'tasks') {
            if (value) {
              value.split(';').forEach(t => {
                const [type, offset] = t.split(':');
                if (type && offset) {
                  const offsetNum = Number(offset);
                  if (!isNaN(offsetNum)) {
                    tasks.push({ type: type.trim(), dayOffset: offsetNum });
                  }
                }
              });
            }
          }
        });
        if (rowValid) {
          item.defaultTasks = tasks;
          data.push(item);
        }
      }
      if (data.length === 0) {
        throw new Error('No valid data found. Please check your CSV format.');
      }
      setParsedData(data);
      setValidationErrors(errors);
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
      setValidationErrors([]);
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
          <DialogTitle>Import Crop Varieties</DialogTitle>
          <DialogDescription>
            Bulk import crop templates from CSV.
          </DialogDescription>
        </DialogHeader>
        {step === 'input' ? (
          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription>
                Headers: Name, Variety, Days, Method, Season, Tasks<br/>
                Example: Lettuce, Buttercrunch, 55, Direct, Spring, "Thin:14;Weed:21"
              </AlertDescription>
            </Alert>
            <Textarea
              placeholder="Paste your CSV data here..."
              className="h-[300px] font-mono text-sm"
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
                <span className="font-medium">Ready to import {parsedData.length} items</span>
              </div>
              {validationErrors.length > 0 && (
                <div className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.length} issues found (skipped)
                </div>
              )}
            </div>
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <AlertTitle className="text-sm font-medium">Skipped Rows:</AlertTitle>
                <ScrollArea className="h-20">
                  <ul className="list-disc list-inside text-xs">
                    {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </ScrollArea>
              </Alert>
            )}
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Variety</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Tasks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.variety}</TableCell>
                      <TableCell>{item.daysToMaturity}</TableCell>
                      <TableCell className="capitalize">{item.plantingMethod}</TableCell>
                      <TableCell>{item.defaultTasks?.length || 0} tasks</TableCell>
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
                {isSubmitting ? 'Importing...' : 'Import Varieties'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}