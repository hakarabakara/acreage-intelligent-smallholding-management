import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MapPin, Sprout, Ruler, MoreHorizontal, Loader2, List, Map as MapIcon, Layers, RotateCw } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Field, Crop, GeoPoint, Rotation } from '@shared/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FarmMap } from '@/components/map/FarmMap';
import { FieldDetailsSheet } from '@/components/field/FieldDetailsSheet';
import { FieldHierarchy } from '@/components/field/FieldHierarchy';
import { RotationManager } from '@/components/field/RotationManager';
const fieldSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  acres: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  status: z.enum(['active', 'fallow', 'resting', 'prepared']),
  type: z.enum(['field', 'bed', 'pasture', 'orchard', 'forest', 'building', 'other']),
  soilType: z.string().optional(),
  currentCrop: z.string().optional(),
});
type FieldFormValues = z.infer<typeof fieldSchema>;
export function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: '',
      acres: '',
      status: 'active',
      type: 'field',
      soilType: '',
      currentCrop: '',
    },
  });
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fieldsRes, cropsRes, rotationsRes] = await Promise.all([
        api<{ items: Field[] }>('/api/fields'),
        api<{ items: Crop[] }>('/api/crops'),
        api<{ items: Rotation[] }>('/api/rotations')
      ]);
      setFields(fieldsRes.items);
      setCrops(cropsRes.items);
      setRotations(rotationsRes.items);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const onSubmit = async (data: FieldFormValues) => {
    try {
      await api('/api/fields', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          acres: Number(data.acres),
        }),
      });
      toast.success('Field created successfully');
      setIsDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      toast.error('Failed to create field');
      console.error(error);
    }
  };
  const deleteField = async (id: string) => {
    try {
      await api(`/api/fields/${id}`, { method: 'DELETE' });
      toast.success('Field deleted');
      setFields(prev => prev.filter(f => f.id !== id));
      if (selectedFieldId === id) {
        setSelectedFieldId(null);
        setIsSheetOpen(false);
      }
    } catch (error) {
      toast.error('Failed to delete field');
    }
  };
  const handleUpdateField = async (id: string, data: Partial<Field>) => {
    try {
      const updated = await api<Field>(`/api/fields/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setFields(prev => prev.map(f => f.id === id ? updated : f));
      toast.success('Field updated');
    } catch (error) {
      toast.error('Failed to update field');
    }
  };
  const handleSaveBoundary = async (fieldId: string, boundary: GeoPoint[]) => {
    await handleUpdateField(fieldId, { boundary });
  };
  const handleFieldSelect = (id: string) => {
    setSelectedFieldId(id);
    setIsSheetOpen(true);
  };
  // Rotation Handlers
  const handleCreateRotation = async (rotation: Partial<Rotation>) => {
    const created = await api<Rotation>('/api/rotations', {
      method: 'POST',
      body: JSON.stringify(rotation)
    });
    setRotations(prev => [...prev, created]);
    toast.success('Rotation created');
  };
  const handleUpdateRotation = async (id: string, rotation: Partial<Rotation>) => {
    const updated = await api<Rotation>(`/api/rotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rotation)
    });
    setRotations(prev => prev.map(r => r.id === id ? updated : r));
    toast.success('Rotation updated');
  };
  const handleDeleteRotation = async (id: string) => {
    if (!confirm('Delete this rotation?')) return;
    await api(`/api/rotations/${id}`, { method: 'DELETE' });
    setRotations(prev => prev.filter(r => r.id !== id));
    toast.success('Rotation deleted');
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'fallow': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'resting': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };
  const selectedField = fields.find(f => f.id === selectedFieldId) || null;
  return (
    <AppLayout
      title="Fields & Land"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
              <DialogDescription>
                Register a new land parcel, bed, or pasture to your farm map.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. North Pasture" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="field">Field</SelectItem>
                            <SelectItem value="bed">Bed</SelectItem>
                            <SelectItem value="pasture">Pasture</SelectItem>
                            <SelectItem value="orchard">Orchard</SelectItem>
                            <SelectItem value="forest">Forest</SelectItem>
                            <SelectItem value="building">Building</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="acres"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acres</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="fallow">Fallow</SelectItem>
                            <SelectItem value="resting">Resting</SelectItem>
                            <SelectItem value="prepared">Prepared</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="soilType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soil Type (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Clay Loam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creating...' : 'Create Field'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <List className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapIcon className="h-4 w-4" /> Map View
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> Hierarchy
            </TabsTrigger>
            <TabsTrigger value="rotations" className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" /> Rotations
            </TabsTrigger>
          </TabsList>
          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            {fields.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No fields registered</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first land parcel.</p>
                <Button onClick={() => setIsDialogOpen(true)} variant="outline">Add Field</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {fields.map((field) => (
                  <Card
                    key={field.id}
                    className="group hover:shadow-lg transition-all duration-200 border-border/60 cursor-pointer"
                    onClick={() => handleFieldSelect(field.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold group-hover:text-emerald-600 transition-colors">
                            {field.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Ruler className="h-3 w-3" /> {field.acres} acres • <span className="capitalize">{field.type}</span>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleFieldSelect(field.id)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={cn("capitalize", getStatusColor(field.status))}>
                            {field.status}
                          </Badge>
                          {field.soilType && (
                            <span className="text-xs text-muted-foreground bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                              {field.soilType}
                            </span>
                          )}
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                              <Sprout className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Current Crop</p>
                              <p className="font-medium">{field.currentCrop || 'None'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          {/* MAP TAB */}
          <TabsContent value="map">
            <div className="animate-in fade-in duration-300">
              <FarmMap
                fields={fields}
                selectedFieldId={selectedFieldId || undefined}
                onSelectField={handleFieldSelect}
                onSaveBoundary={handleSaveBoundary}
              />
            </div>
          </TabsContent>
          {/* HIERARCHY TAB */}
          <TabsContent value="hierarchy">
            <div className="animate-in fade-in duration-300">
              <FieldHierarchy fields={fields} onSelectField={handleFieldSelect} />
            </div>
          </TabsContent>
          {/* ROTATIONS TAB */}
          <TabsContent value="rotations">
            <div className="animate-in fade-in duration-300">
              <RotationManager 
                rotations={rotations} 
                fields={fields}
                onCreate={handleCreateRotation}
                onUpdate={handleUpdateRotation}
                onDelete={handleDeleteRotation}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
      <FieldDetailsSheet
        field={selectedField}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onUpdate={handleUpdateField}
        crops={crops}
        allFields={fields}
      />
    </AppLayout>
  );
}