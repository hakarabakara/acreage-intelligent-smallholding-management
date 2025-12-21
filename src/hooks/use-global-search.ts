import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { Field, Task, Livestock, InventoryItem, Contact, ResourceLog } from '@shared/types';
import { format } from 'date-fns';
export type SearchItem = {
  id: string;
  type: 'field' | 'task' | 'livestock' | 'inventory' | 'contact' | 'resource';
  title: string;
  subtitle: string;
  url: string;
};
export function useGlobalSearch() {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch all searchable entities in parallel
        const [fields, tasks, livestock, inventory, contacts, resources] = await Promise.all([
          api<{ items: Field[] }>('/api/fields'),
          api<{ items: Task[] }>('/api/tasks'),
          api<{ items: Livestock[] }>('/api/livestock'),
          api<{ items: InventoryItem[] }>('/api/inventory'),
          api<{ items: Contact[] }>('/api/contacts'),
          api<{ items: ResourceLog[] }>('/api/resources'),
        ]);
        const searchItems: SearchItem[] = [
          ...fields.items.map(f => ({
            id: f.id,
            type: 'field' as const,
            title: f.name,
            subtitle: `${f.acres} acres • ${f.status}`,
            url: '/fields'
          })),
          ...tasks.items.map(t => ({
            id: t.id,
            type: 'task' as const,
            title: t.title,
            subtitle: t.status,
            url: '/tasks'
          })),
          ...livestock.items.map(l => ({
            id: l.id,
            type: 'livestock' as const,
            title: l.tag,
            subtitle: `${l.breed || ''} ${l.type}`,
            url: '/livestock'
          })),
          ...inventory.items.map(i => ({
            id: i.id,
            type: 'inventory' as const,
            title: i.name,
            subtitle: `${i.quantity} ${i.unit}`,
            url: '/inventory'
          })),
          ...contacts.items.map(c => ({
            id: c.id,
            type: 'contact' as const,
            title: c.name,
            subtitle: c.type,
            url: '/contacts'
          })),
          ...resources.items.map(r => ({
            id: r.id,
            type: 'resource' as const,
            title: `${r.type === 'energy' ? 'Energy' : 'Water'} ${r.flow}`,
            subtitle: `${r.amount} ${r.unit} • ${format(r.date, 'MMM d')}`,
            url: '/resources'
          })),
        ];
        setItems(searchItems);
      } catch (error) {
        console.error('Search indexing failed', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);
  return { items, isLoading };
}