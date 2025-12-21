import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, ShoppingCart, Phone, Mail, MapPin, MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Customer, Order } from '@shared/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CustomerDialog } from '@/components/sales/CustomerDialog';
import { OrderDialog } from '@/components/sales/OrderDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFormatting } from '@/hooks/use-formatting';
export function SalesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const { formatCurrency } = useFormatting();
  // Dialog States
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [customersRes, ordersRes] = await Promise.all([
        api<{ items: Customer[] }>('/api/customers'),
        api<{ items: Order[] }>('/api/orders')
      ]);
      setCustomers(customersRes.items);
      setOrders(ordersRes.items.sort((a, b) => b.date - a.date));
    } catch (error) {
      toast.error('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  // --- CUSTOMER ACTIONS ---
  const handleSaveCustomer = async (data: Partial<Customer>) => {
    try {
      if (selectedCustomer) {
        const updated = await api<Customer>(`/api/customers/${selectedCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Customer updated');
      } else {
        const created = await api<Customer>('/api/customers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setCustomers(prev => [...prev, created]);
        toast.success('Customer created');
      }
    } catch (error) {
      toast.error('Failed to save customer');
    }
  };
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api(`/api/customers/${id}`, { method: 'DELETE' });
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('Customer deleted');
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };
  // --- ORDER ACTIONS ---
  const handleSaveOrder = async (data: Partial<Order>) => {
    try {
      if (selectedOrder) {
        const updated = await api<Order>(`/api/orders/${selectedOrder.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        toast.success('Order updated');
      } else {
        const created = await api<Order>('/api/orders', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setOrders(prev => [created, ...prev]);
        toast.success('Order created');
      }
    } catch (error) {
      toast.error('Failed to save order');
    }
  };
  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    try {
      await api(`/api/orders/${id}`, { method: 'DELETE' });
      setOrders(prev => prev.filter(o => o.id !== id));
      toast.success('Order deleted');
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };
  const openCustomerDialog = (customer?: Customer) => {
    setSelectedCustomer(customer || null);
    setIsCustomerDialogOpen(true);
  };
  const openOrderDialog = (order?: Order) => {
    setSelectedOrder(order || null);
    setIsOrderDialogOpen(true);
  };
  // Filtering
  const filteredOrders = orders.filter(o => {
    const customerName = customers.find(c => c.id === o.customerId)?.name.toLowerCase() || '';
    return customerName.includes(searchQuery.toLowerCase()) || o.status.includes(searchQuery.toLowerCase());
  });
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-600 font-medium';
      case 'partial': return 'text-amber-600 font-medium';
      default: return 'text-red-600 font-medium';
    }
  };
  return (
    <AppLayout
      title="Sales & Customers"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {activeTab === 'orders' ? (
            <Button onClick={() => openOrderDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          ) : (
            <Button onClick={() => openCustomerDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Customer
            </Button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Customers
            </TabsTrigger>
          </TabsList>
          {/* ORDERS TAB */}
          <TabsContent value="orders">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No orders found</h3>
                <p className="text-muted-foreground mb-4">Create your first sales order to get started.</p>
                <Button onClick={() => openOrderDialog()} variant="outline">Create Order</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const customer = customers.find(c => c.id === order.customerId);
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                            <ShoppingCart className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{customer?.name || 'Unknown Customer'}</h4>
                              <Badge variant="secondary" className={cn("capitalize", getStatusColor(order.status))}>
                                {order.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>{format(order.date, 'MMM d, yyyy')}</span>
                              <span>•</span>
                              <span>{order.items.length} items</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatCurrency(order.totalAmount)}</div>
                            <div className={cn("text-xs uppercase", getPaymentStatusColor(order.paymentStatus))}>
                              {order.paymentStatus}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openOrderDialog(order)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteOrder(order.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          {/* CUSTOMERS TAB */}
          <TabsContent value="customers">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No customers found</h3>
                <p className="text-muted-foreground mb-4">Add customers to track your sales relationships.</p>
                <Button onClick={() => openCustomerDialog()} variant="outline">Add Customer</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="group hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold">{customer.name}</CardTitle>
                          <CardDescription className="capitalize">{customer.type}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openCustomerDialog(customer)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customer.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                      {!customer.email && !customer.phone && !customer.address && (
                        <div className="text-muted-foreground italic">No contact info provided</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      <CustomerDialog
        customer={selectedCustomer}
        isOpen={isCustomerDialogOpen}
        onClose={() => setIsCustomerDialogOpen(false)}
        onSave={handleSaveCustomer}
      />
      <OrderDialog
        order={selectedOrder}
        customers={customers}
        isOpen={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        onSave={handleSaveOrder}
      />
    </AppLayout>
  );
}