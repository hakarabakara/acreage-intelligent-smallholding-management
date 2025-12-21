export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type EntityStatus = 'active' | 'inactive' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type FieldStatus = 'active' | 'fallow' | 'resting' | 'prepared';
// New Field Types
export type FieldType = 'field' | 'bed' | 'pasture' | 'orchard' | 'forest' | 'building' | 'other';
export interface GeoPoint {
  x: number;
  y: number;
}
export interface SoilProfile {
  ph?: number;
  organicMatter?: number;
  nitrogen?: 'low' | 'optimal' | 'high';
  phosphorus?: 'low' | 'optimal' | 'high';
  potassium?: 'low' | 'optimal' | 'high';
  lastTested?: number;
}
export interface Amendment {
  id: string;
  date: number;
  type: string;
  amount: number;
  unit: string;
  notes?: string;
}
export interface LeaveRecord {
  id: string;
  startDate: number;
  endDate: number;
  type: 'vacation' | 'sick' | 'unpaid' | 'other';
  notes?: string;
}
export interface Identification {
  type: string;
  number: string;
  expiryDate?: number;
  notes?: string;
}
export interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'worker' | 'viewer';
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  avatar?: string;
  // Extended Staff Management Fields
  leaveRecords?: LeaveRecord[];
  identification?: Identification;
  nextOfKin?: NextOfKin;
  hourlyRate?: number;
  startDate?: number;
}
export interface Contact {
  id: string;
  name: string;
  type: 'laborer' | 'service' | 'supplier' | 'other';
  email?: string;
  phone?: string;
  address?: string;
  rates?: string;
  notes?: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}
export interface Field {
  id: string;
  name: string;
  acres: number;
  status: FieldStatus;
  soilType?: string;
  currentCrop?: string; // Name of crop for display
  lastUpdated?: number;
  // New properties
  type?: FieldType;
  boundary?: GeoPoint[];
  soilProfile?: SoilProfile;
  amendments?: Amendment[];
  isPermanentBed?: boolean;
  grazingCapacity?: number; // Max animals
  parentId?: string; // For hierarchy (e.g., Bed A inside Field 1)
}
export interface Rotation {
  id: string;
  name: string;
  description?: string;
  steps: string[]; // Array of Field IDs in order
  type: 'grazing' | 'crop' | 'other';
}
export interface TaskAssignment {
  contactId: string;
  cost: number;
  transactionId?: string;
}
export interface TaskJournalEntry {
  id: string;
  content: string;
  createdAt: number;
  category: 'general' | 'contractor_feedback' | 'lesson_learned';
  authorId?: string;
}
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: number;
  assigneeId?: string;
  relatedEntityId?: string; // Field ID or Livestock ID
  createdAt: number;
  // Legacy fields (maintained for backward compatibility)
  cost?: number;
  relatedContactId?: string;
  transactionId?: string;
  // New Multi-Contractor Support
  externalAssignments?: TaskAssignment[];
  // Phase 22 additions
  journal?: TaskJournalEntry[];
}
export interface CropSpacing {
  plantSpacing: number; // inches
  rowSpacing: number; // inches
  rowsPerBed: number;
}
export interface Crop {
  id: string;
  name: string;
  variety: string;
  plantingDate: number;
  estimatedHarvestDate: number;
  fieldId: string;
  status: 'planted' | 'growing' | 'harvested';
  // Extended properties
  source?: string;
  germinationRate?: number;
  daysToMaturity?: number;
  expectedYield?: number;
  yieldUnit?: string;
  notes?: string;
  // Phase 5 additions
  photos?: string[];
  spacing?: CropSpacing;
  plantingMethod?: 'direct' | 'transplant';
  // Phase 21 additions
  classification?: 'seasonal' | 'long-term';
  expectedLifespan?: number; // Years
  // Phase 22 additions
  primaryPurpose?: string; // e.g. Timber, Nuts, Fruit
  // Phase 28 additions (Financials)
  cost?: number;
  contactId?: string; // Supplier
  transactionId?: string;
}
export interface CropVariety {
  id: string;
  name: string;
  variety: string;
  daysToMaturity: number;
  plantingMethod?: 'direct' | 'transplant';
  preferredSeason?: string;
  notes?: string;
  defaultTasks?: { type: string; dayOffset: number }[];
}
export interface HarvestLog {
  id: string;
  cropId: string;
  date: number;
  amount: number;
  unit: string;
  quality?: 'A' | 'B' | 'C' | 'compost';
  notes?: string;
}
export interface Livestock {
  id: string;
  tag: string;
  type: string; // Changed from union to string to support custom types
  breed?: string;
  status: 'healthy' | 'sick' | 'quarantine' | 'archived';
  locationId?: string; // Field ID
  // New fields for Phase 12
  origin?: 'born' | 'purchased';
  birthDate?: number;
  purchaseDate?: number;
  dam?: string;
  sire?: string;
  notes?: string;
  // Archiving
  archiveDate?: number;
  archiveReason?: string;
}
export interface LivestockTypeConfig {
  id: string;
  name: string;
  defaultBreed?: string;
}
export interface HealthLog {
  id: string;
  livestockId: string;
  date: number;
  type: 'vaccination' | 'treatment' | 'checkup' | 'injury' | 'other';
  description: string;
  cost?: number;
  performedBy?: string;
}
export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
}
export interface InventoryItem {
  id: string;
  name: string;
  category: string; // Kept for backward compatibility, now populated from category name or custom
  categoryId?: string; // Link to InventoryCategory
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  lastUpdated: number;
  // Phase 5 additions for seeds
  germinationRate?: number;
  lotNumber?: string;
  expiryDate?: number;
  // Phase 21 additions
  storageLocation?: string;
  // Phase 25 additions
  customAttributes?: { key: string; value: string }[];
}
export interface Transaction {
  id: string;
  date: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  relatedEntityId?: string;
}
// SALES & CUSTOMER MANAGEMENT
export interface Customer {
  id: string;
  name: string;
  type: 'wholesale' | 'retail' | 'restaurant' | 'csa' | 'other';
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}
export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
export interface Order {
  id: string;
  customerId: string;
  date: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
}
// COMPLIANCE & SAFETY
export interface ComplianceLog {
  id: string;
  date: number;
  type: 'inspection' | 'certification' | 'training' | 'incident' | 'maintenance';
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'pending' | 'warning';
  inspector?: string;
  nextDueDate?: number;
  notes?: string;
}
// RESOURCES & SUSTAINABILITY
export interface ResourceLog {
  id: string;
  date: number;
  type: 'energy' | 'water';
  flow: 'consumption' | 'production';
  source: string; // e.g., 'Grid', 'Solar', 'Well'
  amount: number;
  unit: string;
  notes?: string;
}
// WEATHER INTELLIGENCE
export interface WeatherLog {
  id: string;
  date: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy';
  tempHigh?: number;
  tempLow?: number;
  precipitation?: number;
  humidity?: number;
  windSpeed?: number;
  notes?: string;
}
// PLANNING & BUDGETING
export interface BudgetItem {
  id: string;
  name: string;
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high';
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'any';
  status: 'planned' | 'executed';
  relatedTaskId?: string;
}
export interface BudgetPlan {
  id: string;
  name: string;
  totalBudget: number;
  startDate: number;
  endDate: number;
  status: 'draft' | 'active' | 'archived';
  items: BudgetItem[];
}
// FARM SETTINGS
export interface FarmSettings {
  id: string;
  name: string;
  ownerName?: string;
  location?: string;
  establishedDate?: number;
  currency?: string;
  measurementSystem?: 'metric' | 'imperial';
}