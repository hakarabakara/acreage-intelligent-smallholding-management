import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PrintButton } from '@/components/ui/print-button';
import { FileText, Filter, Calendar, Download, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { HarvestLog, Transaction, ComplianceLog, Task, User, Crop } from '@shared/types';
import { useFormatting } from '@/hooks/use-formatting';
import { cn } from '@/lib/utils';
interface ReportGeneratorProps {
  harvests: HarvestLog[];
  transactions: Transaction[];
  complianceLogs: ComplianceLog[];
  tasks: Task[];
  users: User[];
  crops: Crop[];
}
type ReportType = 'harvests' | 'financials' | 'compliance' | 'tasks';
export function ReportGenerator({
  harvests,
  transactions,
  complianceLogs,
  tasks,
  users,
  crops
}: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('harvests');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const { formatCurrency } = useFormatting();
  const filteredData = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000; // Include end date fully
    const checkDate = (date: number) => date >= start && date <= end;
    switch (reportType) {
      case 'harvests':
        return harvests.filter(h => checkDate(h.date)).sort((a, b) => b.date - a.date);
      case 'financials':
        return transactions.filter(t => checkDate(t.date)).sort((a, b) => b.date - a.date);
      case 'compliance':
        return complianceLogs.filter(c => checkDate(c.date)).sort((a, b) => b.date - a.date);
      case 'tasks':
        return tasks.filter(t => t.dueDate && checkDate(t.dueDate)).sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0));
      default:
        return [];
    }
  }, [reportType, startDate, endDate, harvests, transactions, complianceLogs, tasks]);
  const summaryMetrics = useMemo(() => {
    switch (reportType) {
      case 'harvests': {
        const totalYield = (filteredData as HarvestLog[]).reduce((acc, h) => acc + h.amount, 0);
        const count = filteredData.length;
        return [
          { label: 'Total Records', value: count, icon: FileText },
          { label: 'Total Yield (Mixed Units)', value: totalYield.toFixed(1), icon: TrendingUp },
        ];
      }
      case 'financials': {
        const txs = filteredData as Transaction[];
        const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        return [
          { label: 'Total Income', value: formatCurrency(income), icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Total Expense', value: formatCurrency(expense), icon: TrendingUp, color: 'text-red-600' },
          { label: 'Net Cash Flow', value: formatCurrency(income - expense), icon: TrendingUp },
        ];
      }
      case 'compliance': {
        const logs = filteredData as ComplianceLog[];
        const passed = logs.filter(l => l.status === 'pass').length;
        const rate = logs.length > 0 ? (passed / logs.length) * 100 : 0;
        return [
          { label: 'Total Audits', value: logs.length, icon: FileText },
          { label: 'Pass Rate', value: `${rate.toFixed(0)}%`, icon: CheckCircle2 },
          { label: 'Issues Found', value: logs.filter(l => l.status === 'fail' || l.status === 'warning').length, icon: AlertTriangle, color: 'text-amber-600' },
        ];
      }
      case 'tasks': {
        const tks = filteredData as Task[];
        const completed = tks.filter(t => t.status === 'done').length;
        const rate = tks.length > 0 ? (completed / tks.length) * 100 : 0;
        return [
          { label: 'Total Tasks', value: tks.length, icon: FileText },
          { label: 'Completion Rate', value: `${rate.toFixed(0)}%`, icon: CheckCircle2 },
        ];
      }
      default: return [];
    }
  }, [reportType, filteredData, formatCurrency]);
  const getReportTitle = () => {
    switch (reportType) {
      case 'harvests': return 'Harvest Yield Report';
      case 'financials': return 'Financial Statement';
      case 'compliance': return 'Compliance Audit Log';
      case 'tasks': return 'Task Execution Report';
    }
  };
  const downloadCSV = () => {
    if (filteredData.length === 0) return;
    let headers: string[] = [];
    let rows: string[][] = [];
    const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
    if (reportType === 'harvests') {
      headers = ['Date', 'Crop', 'Variety', 'Amount', 'Unit', 'Quality', 'Notes'];
      rows = (filteredData as HarvestLog[]).map(h => {
        const crop = crops.find(c => c.id === h.cropId);
        return [
          format(h.date, 'yyyy-MM-dd'),
          crop?.name || 'Unknown',
          crop?.variety || '',
          h.amount.toString(),
          h.unit,
          h.quality || '',
          h.notes || ''
        ];
      });
    } else if (reportType === 'financials') {
      headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency'];
      rows = (filteredData as Transaction[]).map(t => [
        format(t.date, 'yyyy-MM-dd'),
        t.description,
        t.category,
        t.type,
        t.amount.toString(),
        t.currency || 'USD'
      ]);
    } else if (reportType === 'compliance') {
      headers = ['Date', 'Title', 'Type', 'Status', 'Inspector', 'Next Due', 'Notes'];
      rows = (filteredData as ComplianceLog[]).map(c => [
        format(c.date, 'yyyy-MM-dd'),
        c.title,
        c.type,
        c.status,
        c.inspector || '',
        c.nextDueDate ? format(c.nextDueDate, 'yyyy-MM-dd') : '',
        c.notes || ''
      ]);
    } else if (reportType === 'tasks') {
      headers = ['Due Date', 'Title', 'Assignee', 'Priority', 'Status', 'Cost'];
      rows = (filteredData as Task[]).map(t => {
        const assignee = users.find(u => u.id === t.assigneeId);
        return [
          t.dueDate ? format(t.dueDate, 'yyyy-MM-dd') : '',
          t.title,
          assignee?.name || 'Unassigned',
          t.priority,
          t.status,
          t.cost?.toString() || '0'
        ];
      });
    }
    const csvContent = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-6">
      {/* Controls - Hidden on Print */}
      <Card className="no-print bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Report Configuration
          </CardTitle>
          <CardDescription>Select data type and date range to generate report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harvests">Harvests</SelectItem>
                  <SelectItem value="financials">Financials</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadCSV} className="flex-1" disabled={filteredData.length === 0}>
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
              <PrintButton className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" variant="default" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Report Preview / Print View */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader className="border-b pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{getReportTitle()}</CardTitle>
              <CardDescription className="text-sm mt-1">
                Period: {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="text-right hidden print:block">
              <p className="text-sm text-muted-foreground">Generated on {format(new Date(), 'MMM d, yyyy HH:mm')}</p>
            </div>
          </div>
          {/* Summary Metrics */}
          {summaryMetrics.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {summaryMetrics.map((metric, idx) => (
                <div key={idx} className="bg-muted/30 p-3 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <metric.icon className="h-3 w-3" />
                    {metric.label}
                  </div>
                  <div className={cn("text-lg font-bold", metric.color)}>{metric.value}</div>
                </div>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No records found for the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              {reportType === 'harvests' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Crop</TableHead>
                      <TableHead>Variety</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredData as HarvestLog[]).map(item => {
                      const crop = crops.find(c => c.id === item.cropId);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{format(item.date, 'yyyy-MM-dd')}</TableCell>
                          <TableCell className="font-medium">{crop?.name || 'Unknown'}</TableCell>
                          <TableCell>{crop?.variety || '-'}</TableCell>
                          <TableCell className="text-right">{item.amount} {item.unit}</TableCell>
                          <TableCell className="capitalize">{item.quality}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{item.notes}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {reportType === 'financials' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredData as Transaction[]).map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{format(item.date, 'yyyy-MM-dd')}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="capitalize">{item.category}</TableCell>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell className={cn("text-right font-medium", item.type === 'income' ? "text-emerald-600" : "text-red-600")}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {reportType === 'compliance' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Next Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredData as ComplianceLog[]).map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{format(item.date, 'yyyy-MM-dd')}</TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell className="capitalize">{item.status}</TableCell>
                        <TableCell>{item.inspector || '-'}</TableCell>
                        <TableCell>{item.nextDueDate ? format(item.nextDueDate, 'yyyy-MM-dd') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {reportType === 'tasks' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredData as Task[]).map(item => {
                      const assignee = users.find(u => u.id === item.assigneeId);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.dueDate ? format(item.dueDate, 'yyyy-MM-dd') : '-'}</TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{assignee?.name || 'Unassigned'}</TableCell>
                          <TableCell className="capitalize">{item.priority}</TableCell>
                          <TableCell className="capitalize">{item.status}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}