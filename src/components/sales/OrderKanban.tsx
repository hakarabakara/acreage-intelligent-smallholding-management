import React from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User as UserIcon, Trash2, Edit, DollarSign, Package } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Order, Customer } from '@shared/types';
import { useFormatting } from '@/hooks/use-formatting';
interface OrderKanbanProps {
  orders: Order[];
  customers: Customer[];
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onEditOrder: (order: Order) => void;
}
const COLUMNS: { id: Order['status']; title: string; color: string }[] = [
  { id: 'pending', title: 'Pending', color: 'bg-slate-100 dark:bg-slate-900' },
  { id: 'confirmed', title: 'Confirmed', color: 'bg-blue-50 dark:bg-blue-950/20' },
  { id: 'delivered', title: 'Delivered', color: 'bg-emerald-50 dark:bg-emerald-950/20' },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-red-50 dark:bg-red-950/20' },
];
export function OrderKanban({ orders, customers, onStatusChange, onDeleteOrder, onEditOrder }: OrderKanbanProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const orderId = active.id as string;
    const newStatus = over.id as Order['status'];
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== newStatus) {
      onStatusChange(orderId, newStatus);
    }
  };
  const activeOrder = orders.find(o => o.id === activeId);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <OrderColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            orders={orders.filter((o) => o.status === col.id)}
            customers={customers}
            onDeleteOrder={onDeleteOrder}
            onEditOrder={onEditOrder}
          />
        ))}
      </div>
      <DragOverlay>
        {activeOrder ? (
          <OrderCard
            order={activeOrder}
            customers={customers}
            onDeleteOrder={() => {}}
            onEditOrder={() => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
interface OrderColumnProps {
  id: Order['status'];
  title: string;
  color: string;
  orders: Order[];
  customers: Customer[];
  onDeleteOrder: (id: string) => void;
  onEditOrder: (order: Order) => void;
}
function OrderColumn({ id, title, color, orders, customers, onDeleteOrder, onEditOrder }: OrderColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const { formatCurrency } = useFormatting();
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 rounded-xl p-4 flex flex-col gap-3 h-full min-h-[500px]",
        color
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex flex-col">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          <span className="text-xs text-muted-foreground font-medium mt-1">
            {formatCurrency(totalValue)}
          </span>
        </div>
        <Badge variant="secondary" className="bg-background/50">
          {orders.length}
        </Badge>
      </div>
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            customers={customers}
            onDeleteOrder={onDeleteOrder}
            onEditOrder={onEditOrder}
          />
        ))}
      </div>
    </div>
  );
}
interface OrderCardProps {
  order: Order;
  customers: Customer[];
  onDeleteOrder: (id: string) => void;
  onEditOrder: (order: Order) => void;
  isOverlay?: boolean;
}
function OrderCard({ order, customers, onDeleteOrder, onEditOrder, isOverlay }: OrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: order,
  });
  const { formatCurrency } = useFormatting();
  const customer = customers.find(c => c.id === order.customerId);
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
        isDragging ? "opacity-50" : "opacity-100",
        isOverlay ? "shadow-xl rotate-2 cursor-grabbing" : ""
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col">
            <h4 className="font-medium text-sm leading-tight line-clamp-1">
              {customer?.name || 'Unknown Customer'}
            </h4>
            <span className="text-[10px] text-muted-foreground">
              #{order.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 text-muted-foreground hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                onEditOrder(order);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOrder(order.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(order.date, 'MMM d')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>{order.items.length}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="outline" className={cn(
            "text-[10px] px-1.5 py-0 h-5 border capitalize",
            order.paymentStatus === 'paid' ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
            order.paymentStatus === 'partial' ? "text-amber-600 border-amber-200 bg-amber-50" :
            "text-red-600 border-red-200 bg-red-50"
          )}>
            {order.paymentStatus}
          </Badge>
          <div className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
            {formatCurrency(order.totalAmount)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}