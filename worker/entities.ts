import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, Field, Task, Crop, Livestock, InventoryItem, Transaction, HarvestLog, HealthLog, Customer, Order, ComplianceLog, Contact, LivestockTypeConfig, CropVariety, Rotation, InventoryCategory, ResourceLog, FarmSettings } from "@shared/types";
import {
  MOCK_CHAT_MESSAGES,
  MOCK_CHATS,
  MOCK_USERS,
  MOCK_FIELDS,
  MOCK_TASKS,
  MOCK_CROPS,
  MOCK_LIVESTOCK,
  MOCK_INVENTORY,
  MOCK_TRANSACTIONS,
  MOCK_RESOURCE_LOGS
} from "@shared/mock-data";
import type { WeatherLog, BudgetPlan } from "@shared/types";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", role: 'worker', status: 'active' };
  static seedData = MOCK_USERS;
}
// CONTACT ENTITY
export class ContactEntity extends IndexedEntity<Contact> {
  static readonly entityName = "contact";
  static readonly indexName = "contacts";
  static readonly initialState: Contact = { id: "", name: "", type: 'other' };
  static seedData: Contact[] = [
    { id: 'c1', name: 'Bob The Builder', type: 'service', phone: '555-0199', rates: '$50/hr', notes: 'Fence repair specialist' },
    { id: 'c2', name: 'Green Seeds Co', type: 'supplier', email: 'orders@greenseeds.com', address: '123 Seed Ln' }
  ];
}
// CHAT BOARD ENTITY
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}
// FIELD ENTITY
export class FieldEntity extends IndexedEntity<Field> {
  static readonly entityName = "field";
  static readonly indexName = "fields";
  static readonly initialState: Field = {
    id: "",
    name: "",
    acres: 0,
    status: 'fallow'
  };
  static seedData = MOCK_FIELDS;
}
// ROTATION ENTITY
export class RotationEntity extends IndexedEntity<Rotation> {
  static readonly entityName = "rotation";
  static readonly indexName = "rotations";
  static readonly initialState: Rotation = {
    id: "",
    name: "",
    steps: [],
    type: 'grazing'
  };
  static seedData: Rotation[] = [
    {
      id: 'rot1',
      name: 'Pasture Rotation A',
      description: 'Standard 4-field rotation for cattle',
      type: 'grazing',
      steps: ['f1', 'f2', 'f3', 'f4']
    }
  ];
}
// TASK ENTITY
export class TaskEntity extends IndexedEntity<Task> {
  static readonly entityName = "task";
  static readonly indexName = "tasks";
  static readonly initialState: Task = {
    id: "",
    title: "",
    status: 'todo',
    priority: 'medium',
    createdAt: 0
  };
  static seedData = MOCK_TASKS;
}
// CROP ENTITY
export class CropEntity extends IndexedEntity<Crop> {
  static readonly entityName = "crop";
  static readonly indexName = "crops";
  static readonly initialState: Crop = {
    id: "",
    name: "",
    variety: "",
    plantingDate: 0,
    estimatedHarvestDate: 0,
    fieldId: "",
    status: 'planted'
  };
  static seedData = MOCK_CROPS;
}
// CROP VARIETY ENTITY (LIBRARY)
export class CropVarietyEntity extends IndexedEntity<CropVariety> {
  static readonly entityName = "crop-variety";
  static readonly indexName = "crop-varieties";
  static readonly initialState: CropVariety = {
    id: "",
    name: "",
    variety: "",
    daysToMaturity: 60
  };
  static seedData: CropVariety[] = [
    {
      id: 'cv1',
      name: 'Lettuce',
      variety: 'Buttercrunch',
      daysToMaturity: 55,
      plantingMethod: 'direct',
      defaultTasks: [
        { type: 'Thin', dayOffset: 14 },
        { type: 'Weed', dayOffset: 21 },
        { type: 'Harvest', dayOffset: 55 }
      ]
    },
    {
      id: 'cv2',
      name: 'Tomato',
      variety: 'Roma',
      daysToMaturity: 75,
      plantingMethod: 'transplant',
      defaultTasks: [
        { type: 'Transplant', dayOffset: 0 },
        { type: 'Prune', dayOffset: 30 },
        { type: 'Stake', dayOffset: 14 },
        { type: 'Harvest', dayOffset: 75 }
      ]
    },
    {
      id: 'cv3',
      name: 'Carrot',
      variety: 'Nantes',
      daysToMaturity: 65,
      plantingMethod: 'direct',
      defaultTasks: [
        { type: 'Thin', dayOffset: 21 },
        { type: 'Weed', dayOffset: 30 },
        { type: 'Harvest', dayOffset: 65 }
      ]
    }
  ];
}
// HARVEST LOG ENTITY
export class HarvestLogEntity extends IndexedEntity<HarvestLog> {
  static readonly entityName = "harvest";
  static readonly indexName = "harvests";
  static readonly initialState: HarvestLog = {
    id: "",
    cropId: "",
    date: 0,
    amount: 0,
    unit: "lbs"
  };
  // No seed data for harvests initially
}
// LIVESTOCK ENTITY
export class LivestockEntity extends IndexedEntity<Livestock> {
  static readonly entityName = "livestock";
  static readonly indexName = "livestock";
  static readonly initialState: Livestock = {
    id: "",
    tag: "",
    type: 'Cattle',
    status: 'healthy'
  };
  static seedData = MOCK_LIVESTOCK;
}
// LIVESTOCK TYPE ENTITY
export class LivestockTypeEntity extends IndexedEntity<LivestockTypeConfig> {
  static readonly entityName = "livestock-type";
  static readonly indexName = "livestock-types";
  static readonly initialState: LivestockTypeConfig = { id: "", name: "" };
  static seedData: LivestockTypeConfig[] = [
    { id: 'lt1', name: 'Cattle' },
    { id: 'lt2', name: 'Sheep' },
    { id: 'lt3', name: 'Chicken' },
    { id: 'lt4', name: 'Pig' }
  ];
}
// HEALTH LOG ENTITY
export class HealthLogEntity extends IndexedEntity<HealthLog> {
  static readonly entityName = "health-log";
  static readonly indexName = "health-logs";
  static readonly initialState: HealthLog = {
    id: "",
    livestockId: "",
    date: 0,
    type: 'checkup',
    description: ""
  };
}
// INVENTORY ENTITY
export class InventoryEntity extends IndexedEntity<InventoryItem> {
  static readonly entityName = "inventory";
  static readonly indexName = "inventory";
  static readonly initialState: InventoryItem = {
    id: "",
    name: "",
    category: 'other',
    quantity: 0,
    unit: 'units',
    lowStockThreshold: 0,
    lastUpdated: 0
  };
  static seedData = MOCK_INVENTORY;
}
// INVENTORY CATEGORY ENTITY
export class InventoryCategoryEntity extends IndexedEntity<InventoryCategory> {
  static readonly entityName = "inventory-category";
  static readonly indexName = "inventory-categories";
  static readonly initialState: InventoryCategory = { id: "", name: "" };
  static seedData: InventoryCategory[] = [
    { id: 'cat1', name: 'Feed', description: 'Animal feed and supplements' },
    { id: 'cat2', name: 'Seed', description: 'Planting seeds and bulbs' },
    { id: 'cat3', name: 'Chemical', description: 'Fertilizers, pesticides, herbicides' },
    { id: 'cat4', name: 'Equipment', description: 'Tools, machinery, parts' },
    { id: 'cat5', name: 'Other', description: 'Miscellaneous items' }
  ];
}
// TRANSACTION ENTITY
export class TransactionEntity extends IndexedEntity<Transaction> {
  static readonly entityName = "transaction";
  static readonly indexName = "transactions";
  static readonly initialState: Transaction = {
    id: "",
    date: 0,
    amount: 0,
    type: 'expense',
    category: 'other',
    description: ''
  };
  static seedData = MOCK_TRANSACTIONS;
}
// CUSTOMER ENTITY
export class CustomerEntity extends IndexedEntity<Customer> {
  static readonly entityName = "customer";
  static readonly indexName = "customers";
  static readonly initialState: Customer = {
    id: "",
    name: "",
    type: 'retail'
  };
  static seedData: Customer[] = [
    { id: 'cust1', name: 'The Local Market', type: 'wholesale', email: 'buyer@localmarket.com', phone: '555-0101', address: '123 Main St' },
    { id: 'cust2', name: 'Chez Panisse', type: 'restaurant', email: 'chef@chezpanisse.com', phone: '555-0102', address: '1517 Shattuck Ave' },
    { id: 'cust3', name: 'Farmers Market Walk-ins', type: 'retail', notes: 'General bucket for Saturday market sales' }
  ];
}
// ORDER ENTITY
export class OrderEntity extends IndexedEntity<Order> {
  static readonly entityName = "order";
  static readonly indexName = "orders";
  static readonly initialState: Order = {
    id: "",
    customerId: "",
    date: 0,
    status: 'pending',
    paymentStatus: 'unpaid',
    items: [],
    totalAmount: 0
  };
  static seedData: Order[] = [
    {
      id: 'ord1',
      customerId: 'cust1',
      date: Date.now() - 86400000 * 2,
      status: 'delivered',
      paymentStatus: 'paid',
      items: [
        { id: 'oi1', description: 'Organic Carrots', quantity: 50, unitPrice: 2.5, total: 125 },
        { id: 'oi2', description: 'Kale Bunches', quantity: 20, unitPrice: 3.0, total: 60 }
      ],
      totalAmount: 185
    },
    {
      id: 'ord2',
      customerId: 'cust2',
      date: Date.now(),
      status: 'pending',
      paymentStatus: 'unpaid',
      items: [
        { id: 'oi3', description: 'Microgreens Mix', quantity: 10, unitPrice: 15.0, total: 150 }
      ],
      totalAmount: 150
    }
  ];
}
// COMPLIANCE LOG ENTITY
export class ComplianceLogEntity extends IndexedEntity<ComplianceLog> {
  static readonly entityName = "compliance";
  static readonly indexName = "compliance";
  static readonly initialState: ComplianceLog = {
    id: "",
    date: 0,
    type: 'inspection',
    title: "",
    description: "",
    status: 'pending'
  };
  static seedData: ComplianceLog[] = [
    {
      id: 'comp1',
      date: Date.now() - 86400000 * 30,
      type: 'certification',
      title: 'Annual Organic Certification',
      description: 'Annual review by CCOF inspector.',
      status: 'pass',
      inspector: 'Jane Smith',
      nextDueDate: Date.now() + 86400000 * 335
    },
    {
      id: 'comp2',
      date: Date.now() - 86400000 * 5,
      type: 'training',
      title: 'Tractor Safety Training',
      description: 'Seasonal staff safety orientation.',
      status: 'pass',
      notes: 'All 3 new hires attended.'
    },
    {
      id: 'comp3',
      date: Date.now() + 86400000 * 10,
      type: 'inspection',
      title: 'Water Quality Test',
      description: 'Quarterly well water testing for pathogens.',
      status: 'pending',
      nextDueDate: Date.now() + 86400000 * 10
    }
  ];
}
// RESOURCE LOG ENTITY
export class ResourceLogEntity extends IndexedEntity<ResourceLog> {
  static readonly entityName = "resource-log";
  static readonly indexName = "resource-logs";
  static readonly initialState: ResourceLog = {
    id: "",
    date: 0,
    type: 'energy',
    flow: 'consumption',
    source: '',
    amount: 0,
    unit: ''
  };
  static seedData = MOCK_RESOURCE_LOGS;
}
// WEATHER LOG ENTITY
export class WeatherLogEntity extends IndexedEntity<WeatherLog> {
  static readonly entityName = "weather-log";
  static readonly indexName = "weather-logs";
  static readonly initialState: WeatherLog = {
    id: "",
    date: 0,
    condition: 'sunny'
  };
}
// BUDGET PLAN ENTITY
export class BudgetPlanEntity extends IndexedEntity<BudgetPlan> {
  static readonly entityName = "budget-plan";
  static readonly indexName = "budget-plans";
  static readonly initialState: BudgetPlan = {
    id: "",
    name: "",
    totalBudget: 0,
    startDate: 0,
    endDate: 0,
    status: 'draft',
    items: []
  };
}
// IMAGE ENTITY
export interface ImageState {
  id: string;
  data: string; // base64 encoded
  mimeType: string;
  createdAt: number;
}
export class ImageEntity extends IndexedEntity<ImageState> {
  static readonly entityName = "image";
  static readonly indexName = "images";
  static readonly initialState: ImageState = {
    id: "",
    data: "",
    mimeType: "image/jpeg",
    createdAt: 0
  };
}
// FARM SETTINGS ENTITY
export class FarmSettingsEntity extends IndexedEntity<FarmSettings> {
  static readonly entityName = "farm-settings";
  static readonly indexName = "farm-settings";
  static readonly initialState: FarmSettings = {
    id: "default",
    name: "Green Valley Farm",
    measurementSystem: 'imperial'
  };
  static seedData: FarmSettings[] = [
    {
      id: "default",
      name: "Green Valley Farm",
      ownerName: "Farmer John",
      location: "California, USA",
      measurementSystem: 'imperial'
    }
  ];
}