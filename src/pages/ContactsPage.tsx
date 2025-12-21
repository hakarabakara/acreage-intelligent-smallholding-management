import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Contact as ContactIcon, Mail, Phone, MapPin, MoreHorizontal, Trash2, Edit, Loader2, Briefcase, DollarSign } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Contact } from '@shared/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFormatting } from '@/hooks/use-formatting';
import { EmptyState } from '@/components/ui/empty-state';
const contactSchema = z.object({
  name: z.string().min(2, 'Name required'),
  type: z.enum(['laborer', 'service', 'supplier', 'other']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  rates: z.string().optional(),
  notes: z.string().optional(),
  defaultRate: z.string().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Must be a non-negative number').optional(),
  rateUnit: z.enum(['hourly', 'daily', 'fixed']).optional(),
});
type ContactFormValues = z.infer<typeof contactSchema>;
export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { formatCurrency } = useFormatting();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      type: 'other',
      email: '',
      phone: '',
      address: '',
      rates: '',
      notes: '',
      defaultRate: '',
      rateUnit: 'hourly',
    },
  });
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api<{ items: Contact[] }>('/api/contacts');
      setContacts(response.items);
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const openDialog = (contact?: Contact) => {
    if (contact) {
      setSelectedContact(contact);
      form.reset({
        name: contact.name,
        type: contact.type,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        rates: contact.rates || '',
        notes: contact.notes || '',
        defaultRate: contact.defaultRate?.toString() || '',
        rateUnit: contact.rateUnit || 'hourly',
      });
    } else {
      setSelectedContact(null);
      form.reset({
        name: '',
        type: 'other',
        email: '',
        phone: '',
        address: '',
        rates: '',
        notes: '',
        defaultRate: '',
        rateUnit: 'hourly',
      });
    }
    setIsDialogOpen(true);
  };
  const onSubmit = async (data: ContactFormValues) => {
    try {
      const payload = {
        ...data,
        defaultRate: data.defaultRate ? Number(data.defaultRate) : undefined,
      };
      if (selectedContact) {
        const updated = await api<Contact>(`/api/contacts/${selectedContact.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Contact updated');
      } else {
        const created = await api<Contact>('/api/contacts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setContacts(prev => [...prev, created]);
        toast.success('Contact created');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save contact');
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api(`/api/contacts/${id}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contact deleted');
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <AppLayout
      title="External Contacts"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-9 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <EmptyState
          icon={ContactIcon}
          title="No contacts found"
          description="Add suppliers, contractors, or service providers."
          action={<Button onClick={() => openDialog()} variant="outline">Add Contact</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{contact.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {contact.type}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDialog(contact)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(contact.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contact.defaultRate && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Rate: {formatCurrency(contact.defaultRate)} / {contact.rateUnit}
                  </div>
                )}
                {contact.rates && !contact.defaultRate && (
                  <div className="p-2 bg-muted/50 rounded text-xs font-medium">
                    Rates: {contact.rates}
                  </div>
                )}
                <div className="space-y-2">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{contact.address}</span>
                    </div>
                  )}
                </div>
                {contact.notes && (
                  <div className="pt-2 border-t text-xs text-muted-foreground italic">
                    "{contact.notes}"
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            <DialogDescription>
              Manage details for external partners and suppliers.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name / Company</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bob's Fencing" {...field} />
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
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="laborer">Laborer</SelectItem>
                          <SelectItem value="service">Service Provider</SelectItem>
                          <SelectItem value="supplier">Supplier</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Labor Rates Section */}
              <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Labor Rates (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="defaultRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Rate</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rateUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="rates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Rate Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Overtime is 1.5x" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Specialties, availability, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {selectedContact ? 'Save Changes' : 'Add Contact'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}