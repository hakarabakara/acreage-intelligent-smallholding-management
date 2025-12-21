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
  const handleParse = () => {
    if (!csvText.trim()) {
      setError('Please enter CSV data.');
      return;
    }
    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      // Basic validation of headers
      if (!headers.includes('name') || !headers.includes('days')) {
        throw new Error('CSV must contain "Name" and "Days" columns.');
      }
      const data: Partial<CropVariety>[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Handle quoted fields simply (not robust for all CSV edge cases but good for templates)
        // For robust parsing, a library like PapaParse is recommended, but we'll do a simple split for now
        // assuming no commas in fields for this simple template import.
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        const item: any = {};
        const tasks: { type: string; dayOffset: number }[] = [];
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === 'name') item.name = value;
          else if (header === 'variety') item.variety = value;
          else if (header === 'days') item.daysToMaturity = Number(value) || 60;
          else if (header === 'method') item.plantingMethod = value.toLowerCase() === 'transplant' ? 'transplant' : 'direct';
          else if (header === 'season') item.preferredSeason = value;
          else if (header === 'notes') item.notes = value;
          else if (header === 'tasks') {
            // Parse tasks: "Transplant:21;Weed:30"
            if (value) {
              value.split(';').forEach(t => {
                const [type, offset] = t.split(':');
                if (type && offset) {
                  tasks.push({ type: type.trim(), dayOffset: Number(offset) });
                }
              });
            }
          }
        });
        if (item.name) {
          item.defaultTasks = tasks;
          data.push(item);
        }
      }
      if (data.length === 0) {
        throw new Error('No valid data found.');
      }
      setParsedData(data);
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
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Ready to import {parsedData.length} items</span>
            </div>
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