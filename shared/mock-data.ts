import type { User, Chat, ChatMessage, Field, Task, Crop, Livestock, InventoryItem, Transaction, ResourceLog } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Farmer John', role: 'admin', status: 'active', email: 'john@farm.com' },
  { id: 'u2', name: 'Sarah Field', role: 'manager', status: 'active', email: 'sarah@farm.com' },
  { id: 'u3', name: 'Mike Hand', role: 'worker', status: 'active', email: 'mike@farm.com' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General Farm Ops' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Don\'t forget to check the north fence.', ts: Date.now() - 100000 },
];
export const MOCK_FIELDS: Field[] = [
  { id: 'f1', name: 'North Pasture', acres: 12.5, status: 'active', soilType: 'Loam', currentCrop: 'Alfalfa', lastUpdated: Date.now() },
  { id: 'f2', name: 'River Bottom', acres: 8.2, status: 'fallow', soilType: 'Silt', lastUpdated: Date.now() },
  { id: 'f3', name: 'Orchard Hill', acres: 5.0, status: 'active', soilType: 'Clay', currentCrop: 'Apples', lastUpdated: Date.now() },
  { id: 'f4', name: 'East Plot', acres: 15.0, status: 'prepared', soilType: 'Sandy Loam', lastUpdated: Date.now() },
];
export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Repair North Fence', description: 'Broken post near the creek', status: 'todo', priority: 'high', dueDate: Date.now() + 86400000, assigneeId: 'u3', relatedEntityId: 'f1', createdAt: Date.now() },
  { id: 't2', title: 'Soil Testing', description: 'Annual pH test for River Bottom', status: 'in-progress', priority: 'medium', dueDate: Date.now() + 172800000, assigneeId: 'u2', relatedEntityId: 'f2', createdAt: Date.now() },
  { id: 't3', title: 'Order Fertilizer', description: 'Prepare for spring planting', status: 'todo', priority: 'medium', dueDate: Date.now() + 432000000, assigneeId: 'u1', createdAt: Date.now() },
  { id: 't4', title: 'Tractor Maintenance', description: 'Oil change and filter check', status: 'done', priority: 'low', dueDate: Date.now() - 86400000, assigneeId: 'u3', createdAt: Date.now() - 172800000 },
];
export const MOCK_CROPS: Crop[] = [
  { id: 'cr1', name: 'Winter Wheat', variety: 'Hard Red', plantingDate: Date.now() - 7776000000, estimatedHarvestDate: Date.now() + 2592000000, fieldId: 'f4', status: 'growing' },
  { id: 'cr2', name: 'Corn', variety: 'Sweet Yellow', plantingDate: Date.now() - 2592000000, estimatedHarvestDate: Date.now() + 5184000000, fieldId: 'f2', status: 'planted' },
  { id: 'cr3', name: 'Alfalfa', variety: 'Vernal', plantingDate: Date.now() - 15552000000, estimatedHarvestDate: Date.now() + 604800000, fieldId: 'f1', status: 'growing' },
];
export const MOCK_LIVESTOCK: Livestock[] = [
  { id: 'l1', tag: 'A-101', type: 'cattle', breed: 'Angus', status: 'healthy', locationId: 'f1' },
  { id: 'l2', tag: 'A-102', type: 'cattle', breed: 'Angus', status: 'healthy', locationId: 'f1' },
  { id: 'l3', tag: 'S-045', type: 'sheep', breed: 'Suffolk', status: 'sick', locationId: 'f3' },
  { id: 'l4', tag: 'S-046', type: 'sheep', breed: 'Suffolk', status: 'healthy', locationId: 'f3' },
];
export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Diesel Fuel', category: 'other', quantity: 450, unit: 'gallons', lowStockThreshold: 100, lastUpdated: Date.now() },
  { id: 'i2', name: 'Corn Seed', category: 'seed', quantity: 12, unit: 'bags', lowStockThreshold: 5, lastUpdated: Date.now() },
  { id: 'i3', name: 'NPK 10-10-10', category: 'chemical', quantity: 25, unit: 'lbs', lowStockThreshold: 50, lastUpdated: Date.now() },
  { id: 'i4', name: 'Cattle Feed', category: 'feed', quantity: 2000, unit: 'lbs', lowStockThreshold: 500, lastUpdated: Date.now() },
];
const NOW = Date.now();
const DAY = 86400000;
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tr1', date: NOW - DAY * 2, amount: 4500, type: 'income', category: 'sales', description: 'Wheat Harvest Sale', relatedEntityId: 'cr1' },
  { id: 'tr2', date: NOW - DAY * 5, amount: 1200, type: 'expense', category: 'feed', description: 'Monthly Cattle Feed', relatedEntityId: 'l1' },
  { id: 'tr3', date: NOW - DAY * 12, amount: 350, type: 'expense', category: 'maintenance', description: 'Tractor Repair Parts' },
  { id: 'tr4', date: NOW - DAY * 15, amount: 2100, type: 'income', category: 'sales', description: 'Wool Sale' },
  { id: 'tr5', date: NOW - DAY * 25, amount: 800, type: 'expense', category: 'labor', description: 'Seasonal Help' },
  { id: 'tr6', date: NOW - DAY * 35, amount: 5000, type: 'expense', category: 'equipment', description: 'New Seeder Attachment' },
  { id: 'tr7', date: NOW - DAY * 45, amount: 12000, type: 'income', category: 'sales', description: 'Corn Futures Contract' },
];
export const MOCK_RESOURCE_LOGS: ResourceLog[] = [
  { id: 'rl1', date: NOW - DAY * 1, type: 'energy', flow: 'consumption', source: 'Grid', amount: 45, unit: 'kWh', notes: 'Daily usage' },
  { id: 'rl2', date: NOW - DAY * 1, type: 'energy', flow: 'production', source: 'Solar', amount: 30, unit: 'kWh', notes: 'Sunny day' },
  { id: 'rl3', date: NOW - DAY * 2, type: 'water', flow: 'consumption', source: 'Well', amount: 1200, unit: 'liters', notes: 'Irrigation' },
  { id: 'rl4', date: NOW - DAY * 3, type: 'energy', flow: 'consumption', source: 'Grid', amount: 50, unit: 'kWh' },
  { id: 'rl5', date: NOW - DAY * 4, type: 'water', flow: 'consumption', source: 'Rainwater', amount: 500, unit: 'liters', notes: 'Greenhouse' },
];