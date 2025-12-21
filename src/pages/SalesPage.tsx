import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, ShoppingCart, Phone, Mail, MapPin, MoreHorizontal, Trash2, Edit, Loader2, Megaphone, BarChart3, Calendar, FileText, LayoutGrid, List } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Customer, Order, MarketingActivity, InventoryItem } from '@shared/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CustomerDialog } from '@/components/sales/CustomerDialog';
import { OrderDialog } from '@/components/sales/OrderDialog';
import { InvoiceDialog } from '@/components/sales/InvoiceDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFormatting } from '@/hooks/use-formatting';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { OrderKanban } from '@/components/sales/OrderKanban';
import { EmptyState } from '@/components/ui/empty-state';
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
export function SalesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [marketingActivities, setMarketingActivities] = useState<MarketingActivity[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const { formatCurrency } = useFormatting();
  // Dialog States
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isMarketingDialogOpen, setIsMarketingDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<MarketingActivity | null>(null);
  // Marketing Form State
  const [marketingForm, setMarketingForm] = useState<Partial<MarketingActivity>>({
    name: '',
    type: 'social',
    status: 'planned',
    date: Date.now(),
    cost: 0,
    reach: 0,
    notes: ''
  });
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [customersRes, ordersRes, marketingRes, inventoryRes] = await Promise.all([
        api<{ items: Customer[] }>('/api/customers'),
        api<{ items: Order[] }>('/api/orders'),
        api<{ items: MarketingActivity[] }>('/api/marketing-activities'),
        api<{ items: InventoryItem[] }>('/api/inventory')
      ]);
      setCustomers(customersRes.items);
      setOrders(ordersRes.items.sort((a, b) => b.date - a.date));
      setMarketingActivities(marketingRes.items.sort((a, b) => b.date - a.date));
      setInventory(inventoryRes.items);
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
      let savedOrder: Order;
      const isNew = !selectedOrder;
      const previousStatus = selectedOrder?.status;
      if (selectedOrder) {
        savedOrder = await api<Order>(`/api/orders/${selectedOrder.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setOrders(prev => prev.map(o => o.id === savedOrder.id ? savedOrder : o));
        toast.success('Order updated');
      } else {
        savedOrder = await api<Order>('/api/orders', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setOrders(prev => [savedOrder, ...prev]);
        toast.success('Order created');
      }
      // Inventory Deduction Logic
      const shouldDeduct = (savedOrder.status === 'confirmed' || savedOrder.status === 'delivered') && 
                           (isNew || (previousStatus !== 'confirmed' && previousStatus !== 'delivered'));
      if (shouldDeduct) {
        let deductedCount = 0;
        for (const item of savedOrder.items) {
          if (item.inventoryId) {
            const invItem = inventory.find(i => i.id === item.inventoryId);
            if (invItem) {
              const newQuantity = Math.max(0, invItem.quantity - item.quantity);
              await api(`/api/inventory/${invItem.id}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity: newQuantity })
              });
              setInventory(prev => prev.map(i => i.id === invItem.id ? { ...i, quantity: newQuantity } : i));
              deductedCount++;
            }
          }
        }
        if (deductedCount > 0) {
          toast.success(`Stock deducted for ${deductedCount} items`);
        }
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
  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updated = await api<Order>(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };
  // --- MARKETING ACTIONS ---
  const handleSaveActivity = async () => {
    if (!marketingForm.name) return;
    try {
      if (selectedActivity) {
        const updated = await api<MarketingActivity>(`/api/marketing-activities/${selectedActivity.id}`, {
          method: 'PUT',
          body: JSON.stringify(marketingForm),
        });
        setMarketingActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
        toast.success('Activity updated');
      } else {
        const created = await api<MarketingActivity>('/api/marketing-activities', {
          method: 'POST',
          body: JSON.stringify(marketingForm),
        });
        setMarketingActivities(prev => [created, ...prev]);
        toast.success('Activity created');
      }
      setIsMarketingDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save activity');
    }
  };
  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api(`/api/marketing-activities/${id}`, { method: 'DELETE' });
      setMarketingActivities(prev => prev.filter(a => a.id !== id));
      toast.success('Activity deleted');
    } catch (error) {
      toast.error('Failed to delete activity');
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
  const openInvoiceDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceDialogOpen(true);
  };
  const openMarketingDialog = (activity?: MarketingActivity) => {
    if (activity) {
      setSelectedActivity(activity);
      setMarketingForm(activity);
    } else {
      setSelectedActivity(null);
      setMarketingForm({
        name: '',
        type: 'social',
        status: 'planned',
        date: Date.now(),
        cost: 0,
        reach: 0,
        notes: ''
      });
    }
    setIsMarketingDialogOpen(true);
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
  // Charts Data
  const salesByChannelData = useMemo(() => {
    const data: Record<string, number> = {};
    orders.forEach(order => {
      const channel = order.channel || 'Direct';
      data[channel] = (data[channel] || 0) + order.totalAmount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [orders]);
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
          {activeTab !== 'marketing' && (
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          {activeTab === 'orders' ? (
            <Button onClick={() => openOrderDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          ) : activeTab === 'customers' ? (
            <Button onClick={() => openCustomerDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Customer
            </Button>
          ) : (
            <Button onClick={() => openMarketingDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Campaign
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
            <TabsTrigger value="marketing" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Marketing
            </TabsTrigger>
          </TabsList>
          {/* ORDERS TAB */}
          <TabsContent value="orders">
            <div className="flex justify-end mb-4">
              <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
                <ToggleGroupItem value="list" aria-label="List View"><List className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="board" aria-label="Board View"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
              </ToggleGroup>
            </div>
            {viewMode === 'board' ? (
              <div className="h-[calc(100vh-16rem)]">
                <OrderKanban 
                  orders={filteredOrders}
                  customers={customers}
                  onStatusChange={handleStatusChange}
                  onDeleteOrder={handleDeleteOrder}
                  onEditOrder={openOrderDialog}
                />
              </div>
            ) : (
              filteredOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="No orders found"
                  description="Create your first sales order to get started."
                  action={<Button onClick={() => openOrderDialog()} variant="outline">Create Order</Button>}
                />
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
                                {order.channel && (
                                  <Badge variant="outline" className="text-xs">
                                    {order.channel}
                                  </Badge>
                                )}
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
                                <DropdownMenuItem onClick={() => openInvoiceDialog(order)}>
                                  <FileText className="mr-2 h-4 w-4" /> Generate Invoice
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
              )
            )}
          </TabsContent>
          {/* CUSTOMERS TAB */}
          <TabsContent value="customers">
            {filteredCustomers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No customers found"
                description="Add customers to track your sales relationships."
                action={<Button onClick={() => openCustomerDialog()} variant="outline">Add Customer</Button>}
              />
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
          {/* MARKETING TAB */}
          <TabsContent value="marketing">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Activity List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Campaigns & Activities</h3>
                </div>
                {marketingActivities.length === 0 ? (
                  <EmptyState
                    icon={Megaphone}
                    title="No marketing activities"
                    description="Track your ads, flyers, and events here."
                    action={<Button onClick={() => openMarketingDialog()} variant="outline">Create Campaign</Button>}
                  />
                ) : (
                  <div className="space-y-3">
                    {marketingActivities.map(activity => (
                      <Card key={activity.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                              <Megaphone className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{activity.name}</h4>
                                <Badge variant="outline" className="capitalize text-xs">{activity.type}</Badge>
                                <Badge variant="secondary" className={cn(
                                  "capitalize text-xs",
                                  activity.status === 'active' ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                                )}>
                                  {activity.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(activity.date, 'MMM d, yyyy')}
                                </span>
                                {activity.reach && (
                                  <span>• Reach: {activity.reach.toLocaleString()}</span>
                                )}
                                <span>• Cost: {formatCurrency(activity.cost)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openMarketingDialog(activity)}>
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteActivity(activity.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              {/* Right Column: Charts & Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Sales by Channel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {salesByChannelData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesByChannelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {salesByChannelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No sales data available.
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Marketing Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Spend</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(marketingActivities.reduce((acc, a) => acc + a.cost, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Campaigns</span>
                      <span className="font-medium">
                        {marketingActivities.filter(a => a.status === 'active').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Reach</span>
                      <span className="font-medium">
                        {marketingActivities.reduce((acc, a) => acc + (a.reach || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
        inventory={inventory}
        isOpen={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        onSave={handleSaveOrder}
      />
      <InvoiceDialog
        order={selectedOrder}
        customer={selectedOrder ? customers.find(c => c.id === selectedOrder.customerId) || null : null}
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
      />
      {/* Marketing Activity Dialog */}
      <Dialog open={isMarketingDialogOpen} onOpenChange={setIsMarketingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedActivity ? 'Edit Activity' : 'New Marketing Activity'}</DialogTitle>
            <DialogDescription>Track a marketing campaign or event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Activity Name</Label>
              <Input 
                placeholder="e.g. Summer Sale Flyer" 
                value={marketingForm.name}
                onChange={(e) => setMarketingForm({ ...marketingForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={marketingForm.type}
                  onValueChange={(v: any) => setMarketingForm({ ...marketingForm, type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="print">Print / Flyer</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={marketingForm.status}
                  onValueChange={(v: any) => setMarketingForm({ ...marketingForm, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={format(marketingForm.date || Date.now(), 'yyyy-MM-dd')}
                  onChange={(e) => setMarketingForm({ ...marketingForm, date: new Date(e.target.value).getTime() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cost ($)</Label>
                <Input 
                  type="number" 
                  value={marketingForm.cost}
                  onChange={(e) => setMarketingForm({ ...marketingForm, cost: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estimated Reach (People)</Label>
              <Input 
                type="number" 
                value={marketingForm.reach || ''}
                onChange={(e) => setMarketingForm({ ...marketingForm, reach: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="Details about this campaign..." 
                value={marketingForm.notes || ''}
                onChange={(e) => setMarketingForm({ ...marketingForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarketingDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveActivity} disabled={!marketingForm.name}>Save Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}