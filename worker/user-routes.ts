import { Hono } from "hono";
import type { Env } from './core-utils';
import { Index } from './core-utils';
import {
  UserEntity,
  ChatBoardEntity,
  FieldEntity,
  TaskEntity,
  CropEntity,
  LivestockEntity,
  InventoryEntity,
  TransactionEntity,
  HarvestLogEntity,
  HealthLogEntity,
  CustomerEntity,
  OrderEntity,
  ComplianceLogEntity,
  ContactEntity,
  LivestockTypeEntity,
  CropVarietyEntity,
  RotationEntity,
  InventoryCategoryEntity,
  ResourceLogEntity,
  WeatherLogEntity,
  BudgetPlanEntity,
  ImageEntity,
  FarmSettingsEntity
} from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Field, Task, Crop, Livestock, InventoryItem, Transaction, HarvestLog, HealthLog, Customer, Order, ComplianceLog, User, Contact, LivestockTypeConfig, CropVariety, Rotation, TaskAssignment, InventoryCategory, ResourceLog, WeatherLog, BudgetPlan, FarmSettings } from "@shared/types";
// Helper to sync task assignments with transactions
async function syncTaskAssignments(env: Env, task: Task, newAssignments: TaskAssignment[] | undefined, oldAssignments: TaskAssignment[] | undefined) {
    const results: TaskAssignment[] = [];
    const oldMap = new Map(oldAssignments?.map(a => [a.contactId, a]) || []);
    const newMap = new Map(newAssignments?.map(a => [a.contactId, a]) || []);
    if (newAssignments) {
        for (const assignment of newAssignments) {
            let transactionId = assignment.transactionId;
            const oldAssignment = oldMap.get(assignment.contactId);
            // If we have a transaction ID, update it. If not, create it.
            if (transactionId) {
                 // Update existing if cost changed
                 if (oldAssignment && oldAssignment.cost !== assignment.cost) {
                     const txEntity = new TransactionEntity(env, transactionId);
                     if (await txEntity.exists()) {
                         await txEntity.mutate(t => ({ ...t, amount: assignment.cost, date: task.dueDate || Date.now() }));
                     }
                 }
            } else {
                // Create new transaction
                let contactName = 'Contractor';
                try {
                    const contactEntity = new ContactEntity(env, assignment.contactId);
                    if (await contactEntity.exists()) {
                        const contact = await contactEntity.getState();
                        contactName = contact.name;
                    }
                } catch (e) {
                    console.error('Failed to fetch contact name', e);
                }
                const tx = await TransactionEntity.create(env, {
                    id: crypto.randomUUID(),
                    date: task.dueDate || Date.now(),
                    amount: assignment.cost,
                    type: 'expense',
                    category: 'labor',
                    description: `Task: ${task.title} - ${contactName}`,
                    relatedEntityId: task.id
                });
                transactionId = tx.id;
            }
            results.push({ ...assignment, transactionId });
        }
    }
    // Handle deletions: If an assignment was in old but not in new, delete its transaction
    if (oldAssignments) {
        for (const old of oldAssignments) {
            if (!newMap.has(old.contactId) && old.transactionId) {
                const txEntity = new TransactionEntity(env, old.transactionId);
                await txEntity.delete();
            }
        }
    }
    return results;
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'Acreage API' }}));
  // --- USERS ---
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const page = await UserEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const data = await c.req.json() as Partial<User>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const user: User = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      role: data.role || 'worker',
      status: data.status || 'active',
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      // Extended Staff Management Fields
      leaveRecords: data.leaveRecords || [],
      identification: data.identification,
      nextOfKin: data.nextOfKin,
      hourlyRate: Number(data.hourlyRate) || undefined,
      startDate: data.startDate
    };
    return ok(c, await UserEntity.create(c.env, user));
  });
  app.put('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<User>;
    const entity = new UserEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'User not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id // Prevent ID change
    }));
    return ok(c, updated);
  });
  app.delete('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await UserEntity.delete(c.env, id) });
  });
  // --- CONTACTS ---
  app.get('/api/contacts', async (c) => {
    await ContactEntity.ensureSeed(c.env);
    const page = await ContactEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/contacts', async (c) => {
    const data = await c.req.json() as Partial<Contact>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      type: data.type || 'other',
      email: data.email,
      phone: data.phone,
      address: data.address,
      rates: data.rates,
      notes: data.notes
    };
    return ok(c, await ContactEntity.create(c.env, contact));
  });
  app.put('/api/contacts/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<Contact>;
    const entity = new ContactEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Contact not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id
    }));
    return ok(c, updated);
  });
  app.delete('/api/contacts/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await ContactEntity.delete(c.env, id) });
  });
  // --- FIELDS ---
  app.get('/api/fields', async (c) => {
    await FieldEntity.ensureSeed(c.env);
    const page = await FieldEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/fields', async (c) => {
    const data = await c.req.json() as Partial<Field>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const field: Field = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      acres: Number(data.acres) || 0,
      status: data.status || 'fallow',
      soilType: data.soilType,
      currentCrop: data.currentCrop,
      lastUpdated: Date.now(),
      type: data.type || 'field',
      boundary: data.boundary || [],
      soilProfile: data.soilProfile,
      amendments: data.amendments || [],
      isPermanentBed: data.isPermanentBed,
      grazingCapacity: Number(data.grazingCapacity) || 0,
      parentId: data.parentId
    };
    return ok(c, await FieldEntity.create(c.env, field));
  });
  app.put('/api/fields/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<Field>;
    const entity = new FieldEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Field not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id, // Prevent ID change
      lastUpdated: Date.now()
    }));
    return ok(c, updated);
  });
  app.delete('/api/fields/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await FieldEntity.delete(c.env, id) });
  });
  // --- ROTATIONS ---
  app.get('/api/rotations', async (c) => {
    await RotationEntity.ensureSeed(c.env);
    const page = await RotationEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/rotations', async (c) => {
    const data = await c.req.json() as Partial<Rotation>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const rotation: Rotation = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description,
      steps: data.steps || [],
      type: data.type || 'grazing'
    };
    return ok(c, await RotationEntity.create(c.env, rotation));
  });
  app.put('/api/rotations/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<Rotation>;
    const entity = new RotationEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Rotation not found');
    const updated = await entity.mutate(current => ({ ...current, ...data, id: current.id }));
    return ok(c, updated);
  });
  app.delete('/api/rotations/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await RotationEntity.delete(c.env, id) });
  });
  // --- TASKS ---
  app.get('/api/tasks', async (c) => {
    await TaskEntity.ensureSeed(c.env);
    const page = await TaskEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/tasks', async (c) => {
    const data = await c.req.json() as Partial<Task>;
    if (!data.title?.trim()) return bad(c, 'Title required');
    // Legacy single transaction logic (kept for backward compat if needed, but new UI uses externalAssignments)
    let transactionId: string | undefined = undefined;
    const cost = Number(data.cost);
    if (cost > 0 && data.relatedContactId && !data.externalAssignments?.length) {
      const tx: Transaction = {
        id: crypto.randomUUID(),
        date: data.dueDate || Date.now(),
        amount: cost,
        type: 'expense',
        category: 'labor',
        description: `Task: ${data.title.trim()}`,
        relatedEntityId: undefined
      };
      const createdTx = await TransactionEntity.create(c.env, tx);
      transactionId = createdTx.id;
    }
    const task: Task = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      description: data.description,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
      relatedEntityId: data.relatedEntityId,
      createdAt: Date.now(),
      cost: cost || undefined,
      relatedContactId: data.relatedContactId,
      transactionId: transactionId,
      externalAssignments: [], // Initialize empty, will fill below
      journal: data.journal || []
    };
    // Handle Multi-Contractor Assignments
    if (data.externalAssignments && data.externalAssignments.length > 0) {
        task.externalAssignments = await syncTaskAssignments(c.env, task, data.externalAssignments, []);
    }
    // If we created a legacy transaction, update it to link to this task
    if (transactionId) {
       const txEntity = new TransactionEntity(c.env, transactionId);
       await txEntity.mutate(t => ({ ...t, relatedEntityId: task.id }));
    }
    return ok(c, await TaskEntity.create(c.env, task));
  });
  app.put('/api/tasks/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<Task>;
    const entity = new TaskEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Task not found');
    const currentTask = await entity.getState();
    // Legacy Logic for Single Transaction Sync
    const newCost = data.cost !== undefined ? Number(data.cost) : currentTask.cost;
    const newContactId = data.relatedContactId !== undefined ? data.relatedContactId : currentTask.relatedContactId;
    const newTitle = data.title !== undefined ? data.title : currentTask.title;
    const newDate = data.dueDate !== undefined ? data.dueDate : currentTask.dueDate;
    let transactionId = currentTask.transactionId;
    // Only run legacy logic if NO external assignments are present/being added
    const hasExternalAssignments = (data.externalAssignments && data.externalAssignments.length > 0) || (currentTask.externalAssignments && currentTask.externalAssignments.length > 0);
    if (!hasExternalAssignments) {
        if (newCost && newCost > 0 && newContactId) {
            const transactionData: Partial<Transaction> = {
                date: newDate || Date.now(),
                amount: newCost,
                type: 'expense',
                category: 'labor',
                description: `Task: ${newTitle}`,
                relatedEntityId: id
            };
            if (transactionId) {
                const txEntity = new TransactionEntity(c.env, transactionId);
                if (await txEntity.exists()) {
                    await txEntity.mutate(s => ({ ...s, ...transactionData }));
                } else {
                    const newTx = await TransactionEntity.create(c.env, { id: crypto.randomUUID(), ...transactionData } as Transaction);
                    transactionId = newTx.id;
                }
            } else {
                const newTx = await TransactionEntity.create(c.env, { id: crypto.randomUUID(), ...transactionData } as Transaction);
                transactionId = newTx.id;
            }
        } else {
            if (transactionId) {
                const txEntity = new TransactionEntity(c.env, transactionId);
                await txEntity.delete();
                transactionId = undefined;
            }
        }
    }
    // Handle Multi-Contractor Assignments Sync
    let updatedAssignments = currentTask.externalAssignments;
    if (data.externalAssignments !== undefined) {
        // We pass a temporary task object with updated fields for sync logic (dates, titles)
        const tempTask = { ...currentTask, ...data };
        updatedAssignments = await syncTaskAssignments(c.env, tempTask, data.externalAssignments, currentTask.externalAssignments);
    }
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id, // Prevent ID change
      transactionId: transactionId,
      externalAssignments: updatedAssignments,
      journal: data.journal || current.journal // Update journal if provided, else keep existing
    }));
    return ok(c, updated);
  });
  app.delete('/api/tasks/:id', async (c) => {
    const id = c.req.param('id');
    const entity = new TaskEntity(c.env, id);
    if (await entity.exists()) {
        const task = await entity.getState();
        // Delete legacy transaction
        if (task.transactionId) {
            const txEntity = new TransactionEntity(c.env, task.transactionId);
            await txEntity.delete();
        }
        // Delete multi-contractor transactions
        if (task.externalAssignments) {
            for (const assignment of task.externalAssignments) {
                if (assignment.transactionId) {
                    const txEntity = new TransactionEntity(c.env, assignment.transactionId);
                    await txEntity.delete();
                }
            }
        }
    }
    return ok(c, { id, deleted: await TaskEntity.delete(c.env, id) });
  });
  // --- CROPS ---
  app.get('/api/crops', async (c) => {
    await CropEntity.ensureSeed(c.env);
    const page = await CropEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/crops', async (c) => {
    const data = await c.req.json() as Partial<Crop>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    let transactionId: string | undefined = undefined;
    const cost = Number(data.cost);
    const cropId = crypto.randomUUID();
    if (cost > 0) {
        let description = `Crop Planting: ${data.name}`;
        if (data.contactId) {
            const contactEntity = new ContactEntity(c.env, data.contactId);
            if (await contactEntity.exists()) {
                const contact = await contactEntity.getState();
                description += ` (Supplier: ${contact.name})`;
            }
        }
        const tx = await TransactionEntity.create(c.env, {
            id: crypto.randomUUID(),
            date: data.plantingDate || Date.now(),
            amount: cost,
            type: 'expense',
            category: 'seed', // or 'plants'
            description: description,
            relatedEntityId: cropId
        });
        transactionId = tx.id;
    }
    const crop: Crop = {
      id: cropId,
      name: data.name.trim(),
      variety: data.variety || '',
      plantingDate: data.plantingDate || Date.now(),
      estimatedHarvestDate: data.estimatedHarvestDate || Date.now(),
      fieldId: data.fieldId || '',
      status: data.status || 'planted',
      source: data.source,
      germinationRate: Number(data.germinationRate) || undefined,
      daysToMaturity: Number(data.daysToMaturity) || undefined,
      expectedYield: Number(data.expectedYield) || undefined,
      yieldUnit: data.yieldUnit,
      notes: data.notes,
      photos: data.photos || [],
      spacing: data.spacing,
      plantingMethod: data.plantingMethod,
      classification: data.classification || 'seasonal',
      expectedLifespan: Number(data.expectedLifespan) || undefined,
      primaryPurpose: data.primaryPurpose,
      // Financials
      cost: cost || undefined,
      contactId: data.contactId,
      transactionId: transactionId
    };
    return ok(c, await CropEntity.create(c.env, crop));
  });
  app.put('/api/crops/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<Crop>;
    const entity = new CropEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Crop not found');
    const currentCrop = await entity.getState();
    let transactionId = currentCrop.transactionId;
    const newCost = data.cost !== undefined ? Number(data.cost) : currentCrop.cost;
    const newContactId = data.contactId !== undefined ? data.contactId : currentCrop.contactId;
    const newName = data.name !== undefined ? data.name : currentCrop.name;
    const newDate = data.plantingDate !== undefined ? data.plantingDate : currentCrop.plantingDate;
    // Transaction Sync Logic
    if (newCost && newCost > 0) {
        let description = `Crop Planting: ${newName}`;
        if (newContactId) {
             const contactEntity = new ContactEntity(c.env, newContactId);
             if (await contactEntity.exists()) {
                 const contact = await contactEntity.getState();
                 description += ` (Supplier: ${contact.name})`;
             }
        }
        const txData: Partial<Transaction> = {
            amount: newCost,
            date: newDate,
            description: description,
            relatedEntityId: id
        };
        if (transactionId) {
            // Update existing
            const txEntity = new TransactionEntity(c.env, transactionId);
            if (await txEntity.exists()) {
                await txEntity.mutate(t => ({ ...t, ...txData }));
            } else {
                // Re-create if missing
                const tx = await TransactionEntity.create(c.env, {
                    id: crypto.randomUUID(),
                    type: 'expense',
                    category: 'seed',
                    ...txData
                } as Transaction);
                transactionId = tx.id;
            }
        } else {
            // Create new
            const tx = await TransactionEntity.create(c.env, {
                id: crypto.randomUUID(),
                type: 'expense',
                category: 'seed',
                ...txData
            } as Transaction);
            transactionId = tx.id;
        }
    } else {
        // Cost is 0 or removed, delete transaction if exists
        if (transactionId) {
            const txEntity = new TransactionEntity(c.env, transactionId);
            await txEntity.delete();
            transactionId = undefined;
        }
    }
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id,
      transactionId: transactionId
    }));
    return ok(c, updated);
  });
  app.delete('/api/crops/:id', async (c) => {
    const id = c.req.param('id');
    const entity = new CropEntity(c.env, id);
    if (await entity.exists()) {
        const crop = await entity.getState();
        if (crop.transactionId) {
            const txEntity = new TransactionEntity(c.env, crop.transactionId);
            await txEntity.delete();
        }
    }
    return ok(c, { id, deleted: await CropEntity.delete(c.env, id) });
  });
  // --- CROP VARIETIES (LIBRARY) ---
  app.get('/api/crop-varieties', async (c) => {
    await CropVarietyEntity.ensureSeed(c.env);
    const page = await CropVarietyEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/crop-varieties', async (c) => {
    const data = await c.req.json() as Partial<CropVariety>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const variety: CropVariety = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      variety: data.variety || '',
      daysToMaturity: Number(data.daysToMaturity) || 60,
      plantingMethod: data.plantingMethod,
      preferredSeason: data.preferredSeason,
      notes: data.notes,
      defaultTasks: data.defaultTasks || []
    };
    return ok(c, await CropVarietyEntity.create(c.env, variety));
  });
  app.post('/api/crop-varieties/bulk', async (c) => {
    const items = await c.req.json() as Partial<CropVariety>[];
    if (!Array.isArray(items)) return bad(c, 'Array required');
    const created: CropVariety[] = [];
    for (const data of items) {
      if (!data.name?.trim()) continue;
      const variety: CropVariety = {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        variety: data.variety || '',
        daysToMaturity: Number(data.daysToMaturity) || 60,
        plantingMethod: data.plantingMethod,
        preferredSeason: data.preferredSeason,
        notes: data.notes,
        defaultTasks: data.defaultTasks || []
      };
      created.push(await CropVarietyEntity.create(c.env, variety));
    }
    return ok(c, created);
  });
  app.delete('/api/crop-varieties/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await CropVarietyEntity.delete(c.env, id) });
  });
  // --- HARVESTS ---
  app.get('/api/harvests', async (c) => {
    const page = await HarvestLogEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/harvests', async (c) => {
    const data = await c.req.json() as Partial<HarvestLog>;
    if (!data.cropId || !data.amount) return bad(c, 'Crop ID and amount required');
    const log: HarvestLog = {
      id: crypto.randomUUID(),
      cropId: data.cropId,
      date: data.date || Date.now(),
      amount: Number(data.amount),
      unit: data.unit || 'lbs',
      quality: data.quality,
      notes: data.notes
    };
    return ok(c, await HarvestLogEntity.create(c.env, log));
  });
  app.delete('/api/harvests/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await HarvestLogEntity.delete(c.env, id) });
  });
  // --- LIVESTOCK ---
  app.get('/api/livestock', async (c) => {
    await LivestockEntity.ensureSeed(c.env);
    const page = await LivestockEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/livestock', async (c) => {
    const data = await c.req.json() as Partial<Livestock>;
    if (!data.tag?.trim()) return bad(c, 'Tag required');
    const animal: Livestock = {
      id: crypto.randomUUID(),
      tag: data.tag.trim(),
      type: data.type || 'Cattle',
      breed: data.breed,
      status: data.status || 'healthy',
      locationId: data.locationId,
      origin: data.origin,
      birthDate: data.birthDate,
      purchaseDate: data.purchaseDate,
      dam: data.dam,
      sire: data.sire,
      notes: data.notes
    };
    return ok(c, await LivestockEntity.create(c.env, animal));
  });
  app.put('/api/livestock/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<Livestock>;
    const entity = new LivestockEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Livestock not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id
    }));
    return ok(c, updated);
  });
  app.delete('/api/livestock/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await LivestockEntity.delete(c.env, id) });
  });
  // --- LIVESTOCK TYPES ---
  app.get('/api/livestock-types', async (c) => {
    await LivestockTypeEntity.ensureSeed(c.env);
    const page = await LivestockTypeEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/livestock-types', async (c) => {
    const data = await c.req.json() as Partial<LivestockTypeConfig>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const type: LivestockTypeConfig = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      defaultBreed: data.defaultBreed
    };
    return ok(c, await LivestockTypeEntity.create(c.env, type));
  });
  app.delete('/api/livestock-types/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await LivestockTypeEntity.delete(c.env, id) });
  });
  // --- HEALTH LOGS ---
  app.get('/api/health-logs', async (c) => {
    const page = await HealthLogEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/health-logs', async (c) => {
    const data = await c.req.json() as Partial<HealthLog>;
    if (!data.livestockId || !data.type) return bad(c, 'Livestock ID and type required');
    const log: HealthLog = {
      id: crypto.randomUUID(),
      livestockId: data.livestockId,
      date: data.date || Date.now(),
      type: data.type,
      description: data.description || '',
      cost: Number(data.cost) || undefined,
      performedBy: data.performedBy
    };
    return ok(c, await HealthLogEntity.create(c.env, log));
  });
  app.delete('/api/health-logs/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await HealthLogEntity.delete(c.env, id) });
  });
  // --- INVENTORY ---
  app.get('/api/inventory', async (c) => {
    await InventoryEntity.ensureSeed(c.env);
    const page = await InventoryEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/inventory', async (c) => {
    const data = await c.req.json() as Partial<InventoryItem>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const item: InventoryItem = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      category: data.category || 'other',
      categoryId: data.categoryId,
      quantity: Number(data.quantity) || 0,
      unit: data.unit || 'units',
      lowStockThreshold: Number(data.lowStockThreshold) || 0,
      lastUpdated: Date.now(),
      germinationRate: Number(data.germinationRate) || undefined,
      lotNumber: data.lotNumber,
      expiryDate: data.expiryDate,
      storageLocation: data.storageLocation,
      customAttributes: data.customAttributes || []
    };
    return ok(c, await InventoryEntity.create(c.env, item));
  });
  app.put('/api/inventory/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<InventoryItem>;
    const entity = new InventoryEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Item not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id,
      lastUpdated: Date.now()
    }));
    return ok(c, updated);
  });
  app.delete('/api/inventory/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await InventoryEntity.delete(c.env, id) });
  });
  // --- INVENTORY CATEGORIES ---
  app.get('/api/inventory-categories', async (c) => {
    await InventoryCategoryEntity.ensureSeed(c.env);
    const page = await InventoryCategoryEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/inventory-categories', async (c) => {
    const data = await c.req.json() as Partial<InventoryCategory>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const category: InventoryCategory = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description
    };
    return ok(c, await InventoryCategoryEntity.create(c.env, category));
  });
  app.put('/api/inventory-categories/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<InventoryCategory>;
    const entity = new InventoryCategoryEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Category not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id
    }));
    return ok(c, updated);
  });
  app.delete('/api/inventory-categories/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await InventoryCategoryEntity.delete(c.env, id) });
  });
  // --- TRANSACTIONS ---
  app.get('/api/transactions', async (c) => {
    await TransactionEntity.ensureSeed(c.env);
    const page = await TransactionEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/transactions', async (c) => {
    const data = await c.req.json() as Partial<Transaction>;
    if (!data.amount || !data.category) return bad(c, 'Amount and category required');
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date: data.date || Date.now(),
      amount: Number(data.amount),
      type: data.type || 'expense',
      category: data.category,
      description: data.description || '',
      relatedEntityId: data.relatedEntityId
    };
    return ok(c, await TransactionEntity.create(c.env, transaction));
  });
  app.delete('/api/transactions/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await TransactionEntity.delete(c.env, id) });
  });
  // --- CUSTOMERS ---
  app.get('/api/customers', async (c) => {
    await CustomerEntity.ensureSeed(c.env);
    const page = await CustomerEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/customers', async (c) => {
    const data = await c.req.json() as Partial<Customer>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const customer: Customer = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      type: data.type || 'retail',
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes
    };
    return ok(c, await CustomerEntity.create(c.env, customer));
  });
  app.put('/api/customers/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<Customer>;
    const entity = new CustomerEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Customer not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id
    }));
    return ok(c, updated);
  });
  app.delete('/api/customers/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await CustomerEntity.delete(c.env, id) });
  });
  // --- ORDERS ---
  app.get('/api/orders', async (c) => {
    await OrderEntity.ensureSeed(c.env);
    const page = await OrderEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/orders', async (c) => {
    const data = await c.req.json() as Partial<Order>;
    if (!data.customerId) return bad(c, 'Customer required');
    const order: Order = {
      id: crypto.randomUUID(),
      customerId: data.customerId,
      date: data.date || Date.now(),
      status: data.status || 'pending',
      paymentStatus: data.paymentStatus || 'unpaid',
      items: data.items || [],
      totalAmount: Number(data.totalAmount) || 0,
      notes: data.notes
    };
    return ok(c, await OrderEntity.create(c.env, order));
  });
  app.put('/api/orders/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<Order>;
    const entity = new OrderEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Order not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id
    }));
    return ok(c, updated);
  });
  app.delete('/api/orders/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await OrderEntity.delete(c.env, id) });
  });
  // --- COMPLIANCE ---
  app.get('/api/compliance', async (c) => {
    await ComplianceLogEntity.ensureSeed(c.env);
    const page = await ComplianceLogEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/compliance', async (c) => {
    const data = await c.req.json() as Partial<ComplianceLog>;
    if (!data.title?.trim() || !data.type) return bad(c, 'Title and type required');
    const log: ComplianceLog = {
      id: crypto.randomUUID(),
      date: data.date || Date.now(),
      type: data.type,
      title: data.title.trim(),
      description: data.description || '',
      status: data.status || 'pending',
      inspector: data.inspector,
      nextDueDate: data.nextDueDate,
      notes: data.notes
    };
    return ok(c, await ComplianceLogEntity.create(c.env, log));
  });
  app.put('/api/compliance/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<ComplianceLog>;
    const entity = new ComplianceLogEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Log not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id
    }));
    return ok(c, updated);
  });
  app.delete('/api/compliance/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await ComplianceLogEntity.delete(c.env, id) });
  });
  // --- RESOURCES ---
  app.get('/api/resources', async (c) => {
    await ResourceLogEntity.ensureSeed(c.env);
    const page = await ResourceLogEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/resources', async (c) => {
    const data = await c.req.json() as Partial<ResourceLog>;
    if (!data.amount || !data.type) return bad(c, 'Amount and type required');
    const log: ResourceLog = {
      id: crypto.randomUUID(),
      date: data.date || Date.now(),
      type: data.type,
      flow: data.flow || 'consumption',
      source: data.source || 'Other',
      amount: Number(data.amount),
      unit: data.unit || (data.type === 'energy' ? 'kWh' : 'liters'),
      notes: data.notes
    };
    return ok(c, await ResourceLogEntity.create(c.env, log));
  });
  app.put('/api/resources/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<ResourceLog>;
    const entity = new ResourceLogEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Log not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id
    }));
    return ok(c, updated);
  });
  app.delete('/api/resources/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await ResourceLogEntity.delete(c.env, id) });
  });
  // --- CHATS (Legacy/Demo) ---
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const page = await ChatBoardEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  // --- WEATHER ---
  app.get('/api/weather', async (c) => {
    const page = await WeatherLogEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/weather', async (c) => {
    const data = await c.req.json() as Partial<WeatherLog>;
    if (!data.date || !data.condition) return bad(c, 'Date and condition required');
    const log: WeatherLog = {
      id: crypto.randomUUID(),
      date: data.date,
      condition: data.condition,
      tempHigh: Number(data.tempHigh) || undefined,
      tempLow: Number(data.tempLow) || undefined,
      precipitation: Number(data.precipitation) || undefined,
      humidity: Number(data.humidity) || undefined,
      windSpeed: Number(data.windSpeed) || undefined,
      notes: data.notes
    };
    return ok(c, await WeatherLogEntity.create(c.env, log));
  });
  app.put('/api/weather/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<WeatherLog>;
    const entity = new WeatherLogEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Log not found');
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: current.id
    }));
    return ok(c, updated);
  });
  app.delete('/api/weather/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await WeatherLogEntity.delete(c.env, id) });
  });
  // --- BUDGET PLANS ---
  app.get('/api/budget-plans', async (c) => {
    const page = await BudgetPlanEntity.list(c.env, c.req.query('cursor'), Number(c.req.query('limit') || 50));
    return ok(c, page);
  });
  app.post('/api/budget-plans', async (c) => {
    const data = await c.req.json() as Partial<BudgetPlan>;
    if (!data.name?.trim()) return bad(c, 'Name required');
    const plan: BudgetPlan = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      totalBudget: Number(data.totalBudget) || 0,
      startDate: data.startDate || Date.now(),
      endDate: data.endDate || Date.now(),
      status: data.status || 'draft',
      items: data.items || []
    };
    return ok(c, await BudgetPlanEntity.create(c.env, plan));
  });
  app.put('/api/budget-plans/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<BudgetPlan>;
    const entity = new BudgetPlanEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Plan not found');
    const updated = await entity.mutate(current => ({ ...current, ...data, id: current.id }));
    return ok(c, updated);
  });
  app.delete('/api/budget-plans/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await BudgetPlanEntity.delete(c.env, id) });
  });
  // --- IMAGE UPLOAD ---
  app.post('/api/upload', async (c) => {
    const { image, mimeType } = await c.req.json<{ image: string; mimeType: string }>();
    if (!image || !mimeType) return bad(c, 'Image data and mimeType required');
    // Basic validation: check if base64
    if (!image.startsWith('data:image')) {
       // It might be raw base64 without prefix, which is fine if handled correctly
    }
    // Strip prefix if present for storage
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const id = crypto.randomUUID();
    const imageEntity = await ImageEntity.create(c.env, {
      id,
      data: base64Data,
      mimeType,
      createdAt: Date.now()
    });
    return ok(c, { url: `/api/images/${id}` });
  });
  app.get('/api/images/:id', async (c) => {
    const id = c.req.param('id');
    const entity = new ImageEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Image not found');
    const imageState = await entity.getState();
    // Convert base64 to buffer
    const binaryString = atob(imageState.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return c.body(bytes.buffer as any, 200, {
      'Content-Type': imageState.mimeType,
      'Cache-Control': 'public, max-age=31536000'
    });
  });
  // --- FARM SETTINGS ---
  app.get('/api/settings/farm', async (c) => {
    await FarmSettingsEntity.ensureSeed(c.env);
    // We expect a singleton, so we list and take the first, or get specific 'default'
    const page = await FarmSettingsEntity.list(c.env, undefined, 1);
    let settings = page.items[0];
    if (!settings) {
        // Fallback if seed didn't work or list is empty for some reason
        settings = FarmSettingsEntity.initialState;
        await FarmSettingsEntity.create(c.env, settings);
    }
    return ok(c, settings);
  });
  app.put('/api/settings/farm', async (c) => {
    const data = await c.req.json() as Partial<FarmSettings>;
    const entity = new FarmSettingsEntity(c.env, 'default');
    if (!await entity.exists()) {
        // Create if missing
        const newSettings: FarmSettings = {
            ...FarmSettingsEntity.initialState,
            ...data,
            id: 'default'
        };
        await FarmSettingsEntity.create(c.env, newSettings);
        return ok(c, newSettings);
    }
    const updated = await entity.mutate(current => ({
      ...current,
      ...data,
      id: 'default' // Ensure ID stays default
    }));
    return ok(c, updated);
  });
  // --- SYSTEM RESET ---
  app.delete('/api/reset', async (c) => {
    const entities = [
      UserEntity, ChatBoardEntity, FieldEntity, TaskEntity, CropEntity,
      LivestockEntity, InventoryEntity, TransactionEntity, HarvestLogEntity,
      HealthLogEntity, CustomerEntity, OrderEntity, ComplianceLogEntity,
      ContactEntity, LivestockTypeEntity, CropVarietyEntity, RotationEntity,
      InventoryCategoryEntity, ResourceLogEntity, WeatherLogEntity, BudgetPlanEntity,
      ImageEntity, FarmSettingsEntity
    ];
    for (const EntityClass of entities) {
      const idx = new Index(c.env, EntityClass.indexName);
      const ids = await idx.list();
      if (ids.length > 0) {
        await EntityClass.deleteMany(c.env, ids);
      }
      await idx.clear();
    }
    return ok(c, { success: true });
  });
}