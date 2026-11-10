import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/services/supabase';
import {
  Asset,
  MaintenanceTask,
  MaintenanceHistory,
  Reminder,
  MaintenanceTaskWithAsset,
  AssetCategory,
  MaintenanceFrequencyUnit,
} from '@/types/models';
import { calculateNextDate, getDaysRemaining, getTaskStatus, getTodayDateString, addDaysToDate } from '@/utils/dateUtils';
import { isValidDateString, validateInteger, validateText, trimmedText, MAX_TEXT_LENGTH } from '@/utils/validation';
import { scheduleTaskNotification, cancelNotification } from '@/services/notifications';

const CACHE_KEYS = {
  ASSETS: '@keepup_mobile/cache_assets',
  TASKS: '@keepup_mobile/cache_tasks',
  HISTORY: '@keepup_mobile/cache_history',
  PENDING_SYNC: '@keepup_mobile/pending_sync_queue',
  DEVICE_ID: '@keepup_mobile/device_id',
};

export function generateUUID(): string {
  return Crypto.randomUUID();
}

/**
 * Obtiene o genera un UUID de dispositivo único para registrar en la tabla devices
 */
export async function getDeviceId(): Promise<string> {
  let devId = await AsyncStorage.getItem(CACHE_KEYS.DEVICE_ID);
  if (!devId) {
    devId = generateUUID();
    await AsyncStorage.setItem(CACHE_KEYS.DEVICE_ID, devId);
  }
  return devId;
}

/**
 * Registra o actualiza el dispositivo en Supabase (tabla devices)
 */
export async function registerDevice(userId: string): Promise<void> {
  try {
    const devId = await getDeviceId();
    const now = new Date().toISOString();

    await supabase.from('devices').upsert({
      id: devId,
      user_id: userId,
      device_name: 'Teléfono Android (Mobile)',
      device_type: 'android',
      app_role: 'mobile',
      last_seen_at: now,
      created_at: now,
    });
  } catch (err) {
    console.warn('Error registrando dispositivo en Supabase:', err);
  }
}

/* =========================================================================
   GESTIÓN DE CACHÉ LOCAL OFFLINE
   ========================================================================= */

export async function getCachedAssets(): Promise<Asset[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.ASSETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedAssets(assets: Asset[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.ASSETS, JSON.stringify(assets));
}

export async function getCachedTasks(): Promise<MaintenanceTask[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedTasks(tasks: MaintenanceTask[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.TASKS, JSON.stringify(tasks));
}

export async function getCachedHistory(): Promise<MaintenanceHistory[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedHistory(history: MaintenanceHistory[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.HISTORY, JSON.stringify(history));
}

/* =========================================================================
   COLA DE OPERACIONES PENDIENTES OFFLINE
   ========================================================================= */

interface OfflineOp {
  id: string; // operation_id
  entity_type: 'asset' | 'maintenance_task' | 'maintenance_history' | 'reminder';
  action: 'create' | 'update' | 'delete' | 'complete' | 'snooze';
  payload: any;
  created_at: string;
}

export async function getOfflineQueue(): Promise<OfflineOp[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.PENDING_SYNC);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function enqueueOfflineOp(op: OfflineOp): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push(op);
  await AsyncStorage.setItem(CACHE_KEYS.PENDING_SYNC, JSON.stringify(queue));
}

export async function clearOfflineOp(opId: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter((o) => o.id !== opId);
  await AsyncStorage.setItem(CACHE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
}

/* =========================================================================
   ASSETS CRUD (CON SUPABASE & CACHÉ LOCAL)
   ========================================================================= */

export async function getAssets(userId: string): Promise<Asset[]> {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    if (data) {
      await setCachedAssets(data as Asset[]);
      return data as Asset[];
    }
  } catch (err) {
    console.warn('Error obteniendo assets de Supabase, usando caché local:', err);
  }
  return await getCachedAssets();
}

export async function createAsset(
  userId: string,
  data: {
    name: string;
    category: AssetCategory;
    description?: string;
    brand?: string;
    model?: string;
    purchase_date?: string;
  }
): Promise<Asset> {
  const name = trimmedText(data.name);
  const textError = validateText(data.name, 'El nombre del objeto', true);
  if (textError) throw new Error(textError);
  for (const [value, label] of [[data.description, 'La descripción'], [data.brand, 'La marca'], [data.model, 'El modelo']] as const) {
    if (value && value.length > MAX_TEXT_LENGTH) throw new Error(`${label} no puede superar 255 caracteres`);
  }
  if (data.purchase_date && !isValidDateString(data.purchase_date)) throw new Error('La fecha de compra no es válida');
  const id = generateUUID();
  const now = new Date().toISOString();

  const newAsset: Asset = {
    id,
    user_id: userId,
    name,
    category: data.category,
    description: data.description?.trim() || null,
    brand: data.brand?.trim() || null,
    model: data.model?.trim() || null,
    purchase_date: data.purchase_date || null,
    status: 'active',
    deleted_at: null,
    created_at: now,
    updated_at: now,
  };

  // Guardar en caché primero (optimistic update)
  const cached = await getCachedAssets();
  cached.push(newAsset);
  await setCachedAssets(cached);

  try {
    const { error } = await supabase.from('assets').insert([newAsset]);
    if (error) {
      console.error('Error insertando objeto en Supabase:', error);
      throw error;
    }

    try {
      await supabase.from('sync_operations').insert([{
        id: generateUUID(),
        user_id: userId,
        operation_id: generateUUID(),
        entity_type: 'asset',
        entity_id: id,
        action: 'create',
        payload: newAsset,
        created_at: now,
      }]);
    } catch {}
  } catch (err) {
    console.warn('Sin conexión: encolando creación de objeto para sincronización posterior');
    await enqueueOfflineOp({
      id: generateUUID(),
      entity_type: 'asset',
      action: 'create',
      payload: newAsset,
      created_at: now,
    });
  }

  return newAsset;
}

export async function updateAsset(
  userId: string,
  id: string,
  data: Partial<Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Asset | null> {
  if (data.name !== undefined) {
    const textError = validateText(data.name, 'El nombre del objeto', true);
    if (textError) throw new Error(textError);
  }
  for (const [value, label] of [[data.description, 'La descripción'], [data.brand, 'La marca'], [data.model, 'El modelo']] as const) {
    if (value && value.length > MAX_TEXT_LENGTH) throw new Error(`${label} no puede superar 255 caracteres`);
  }
  if (data.purchase_date && !isValidDateString(data.purchase_date)) throw new Error('La fecha de compra no es válida');
  const now = new Date().toISOString();
  const cached = await getCachedAssets();
  const index = cached.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updated: Asset = {
    ...cached[index],
    ...data,
    name: trimmedText(data.name ?? cached[index].name),
    description: data.description === undefined ? cached[index].description : (trimmedText(data.description ?? '') || null),
    brand: data.brand === undefined ? cached[index].brand : (trimmedText(data.brand ?? '') || null),
    model: data.model === undefined ? cached[index].model : (trimmedText(data.model ?? '') || null),
    updated_at: now,
  };
  cached[index] = updated;
  await setCachedAssets(cached);

  try {
    const { error } = await supabase
      .from('assets')
      .update({
        name: updated.name,
        category: updated.category,
        description: updated.description,
        brand: updated.brand,
        model: updated.model,
        purchase_date: updated.purchase_date,
        updated_at: now,
      })
      .eq('id', id);

    if (error) throw error;

    try {
      await supabase.from('sync_operations').insert([{
        id: generateUUID(),
        user_id: userId,
        operation_id: generateUUID(),
        entity_type: 'asset',
        entity_id: id,
        action: 'update',
        payload: updated,
        created_at: now,
      }]);
    } catch {}
  } catch (err) {
    await enqueueOfflineOp({
      id: generateUUID(),
      entity_type: 'asset',
      action: 'update',
      payload: updated,
      created_at: now,
    });
  }

  return updated;
}

/**
 * Eliminación lógica obligatoria
 */
export async function deleteAsset(userId: string, id: string): Promise<boolean> {
  const now = new Date().toISOString();
  const cached = await getCachedAssets();
  const filtered = cached.filter((a) => a.id !== id);
  await setCachedAssets(filtered);

  try {
    const { error } = await supabase
      .from('assets')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', id);

    if (error) throw error;

    try {
      await supabase.from('sync_operations').insert([{
        id: generateUUID(),
        user_id: userId,
        operation_id: generateUUID(),
        entity_type: 'asset',
        entity_id: id,
        action: 'delete',
        payload: { id, deleted_at: now },
        created_at: now,
      }]);
    } catch {}
  } catch (err) {
    await enqueueOfflineOp({
      id: generateUUID(),
      entity_type: 'asset',
      action: 'delete',
      payload: { id, deleted_at: now },
      created_at: now,
    });
  }

  return true;
}

/* =========================================================================
   MAINTENANCE TASKS CRUD
   ========================================================================= */

export async function getTasksWithAsset(userId: string): Promise<MaintenanceTaskWithAsset[]> {
  let tasks: MaintenanceTask[] = [];
  let assets: Asset[] = await getAssets(userId);

  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true });

    if (error) throw error;
    if (data) {
      tasks = (data as any[]).map((t) => ({
        ...t,
        is_one_time: Boolean(t.description?.includes('[ONE_TIME]') || t.is_one_time),
      })) as MaintenanceTask[];
      await setCachedTasks(tasks);
    }
  } catch (err) {
    console.warn('Error obteniendo tasks de Supabase, usando caché local:', err);
    tasks = await getCachedTasks();
  }

  const assetMap = new Map(assets.map((a) => [a.id, a]));

  return tasks
    .filter((t) => !t.deleted_at && assetMap.has(t.asset_id))
    .map((t) => {
      const asset = assetMap.get(t.asset_id)!;
      return {
        ...t,
        asset_name: asset.name,
        asset_category: asset.category,
        days_remaining: getDaysRemaining(t.next_due_date),
        computed_status: getTaskStatus(t.next_due_date),
      };
    })
    .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
}

export async function createTask(
  userId: string,
  data: {
    asset_id: string;
    title: string;
    description?: string;
    frequency_value: number;
    frequency_unit: MaintenanceFrequencyUnit;
    last_date?: string;
    estimated_cost?: number;
    enable_reminder?: boolean;
    is_one_time?: boolean;
  }
): Promise<MaintenanceTask> {
  const titleError = validateText(data.title, 'El título del mantenimiento', true);
  if (titleError) throw new Error(titleError);
  const frequencyError = validateInteger(String(data.frequency_value), 'La frecuencia', true, 999999);
  if (frequencyError || data.frequency_value <= 0) throw new Error(frequencyError || 'La frecuencia debe ser mayor a 0');
  if (data.description && data.description.length > MAX_TEXT_LENGTH) throw new Error('La descripción no puede superar 255 caracteres');
  if (data.last_date && !isValidDateString(data.last_date)) throw new Error('La fecha del último servicio no es válida');
  const id = generateUUID();
  const now = new Date().toISOString();
  const baseDate = data.last_date || getTodayDateString();
  const next_due_date = calculateNextDate(baseDate, data.frequency_value, data.frequency_unit);

  let desc = data.description?.trim() || null;
  if (data.is_one_time) {
    desc = desc ? `[ONE_TIME] ${desc}` : '[ONE_TIME]';
  }

  const newTask: MaintenanceTask = {
    id,
    asset_id: data.asset_id,
    title: data.title.trim(),
    description: desc,
    frequency_value: data.frequency_value,
    frequency_unit: data.frequency_unit,
    next_due_date,
    last_completed_at: data.last_date ? new Date(data.last_date).toISOString() : null,
    status: 'active',
    priority: 'medium',
    deleted_at: null,
    created_at: now,
    updated_at: now,
    is_one_time: Boolean(data.is_one_time),
  };

  const cached = await getCachedTasks();
  cached.push(newTask);
  await setCachedTasks(cached);

  try {
    const { error } = await supabase.from('maintenance_tasks').insert([newTask]);
    if (error) {
      console.error('Error insertando mantenimiento en Supabase:', error);
      throw error;
    }

    try {
      await supabase.from('sync_operations').insert([{
        id: generateUUID(),
        user_id: userId,
        operation_id: generateUUID(),
        entity_type: 'maintenance_task',
        entity_id: id,
        action: 'create',
        payload: newTask,
        created_at: now,
      }]);
    } catch {}
  } catch (err) {
    await enqueueOfflineOp({
      id: generateUUID(),
      entity_type: 'maintenance_task',
      action: 'create',
      payload: newTask,
      created_at: now,
    });
  }

  // Notificación local en Android
  if (data.enable_reminder !== false) {
    const assets = await getCachedAssets();
    const asset = assets.find((a) => a.id === data.asset_id);
    await scheduleTaskNotification(newTask.id, newTask.title, asset?.name || 'Objeto', newTask.next_due_date);
  }

  return newTask;
}

export async function updateTask(
  userId: string,
  id: string,
  data: Partial<Omit<MaintenanceTask, 'id' | 'asset_id' | 'created_at' | 'updated_at'>>
): Promise<MaintenanceTask | null> {
  if (data.title !== undefined) {
    const titleError = validateText(data.title, 'El título del mantenimiento', true);
    if (titleError) throw new Error(titleError);
  }
  if (data.frequency_value !== undefined) {
    const frequencyError = validateInteger(String(data.frequency_value), 'La frecuencia', true, 999999);
    if (frequencyError || data.frequency_value <= 0) throw new Error(frequencyError || 'La frecuencia debe ser mayor a 0');
  }
  if (data.description && data.description.length > MAX_TEXT_LENGTH) throw new Error('La descripción no puede superar 255 caracteres');
  if (data.next_due_date && !isValidDateString(data.next_due_date)) throw new Error('La próxima fecha no es válida');
  const now = new Date().toISOString();
  const cached = await getCachedTasks();
  const index = cached.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updated: MaintenanceTask = {
    ...cached[index],
    ...data,
    title: trimmedText(data.title ?? cached[index].title),
    description: data.description === undefined ? cached[index].description : (trimmedText(data.description ?? '') || null),
    updated_at: now,
  };
  cached[index] = updated;
  await setCachedTasks(cached);

  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({
        title: updated.title,
        description: updated.description,
        frequency_value: updated.frequency_value,
        frequency_unit: updated.frequency_unit,
        next_due_date: updated.next_due_date,
        last_completed_at: updated.last_completed_at,
        status: updated.status,
        updated_at: now,
      })
      .eq('id', id);

    if (error) throw error;

    try {
      await supabase.from('sync_operations').insert([{
        id: generateUUID(),
        user_id: userId,
        operation_id: generateUUID(),
        entity_type: 'maintenance_task',
        entity_id: id,
        action: 'update',
        payload: updated,
        created_at: now,
      }]);
    } catch {}
  } catch (err) {
    await enqueueOfflineOp({
      id: generateUUID(),
      entity_type: 'maintenance_task',
      action: 'update',
      payload: updated,
      created_at: now,
    });
  }

  return updated;
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  const now = new Date().toISOString();
  const cached = await getCachedTasks();
  const filtered = cached.filter((t) => t.id !== id);
  await setCachedTasks(filtered);

  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', id);

    if (error) throw error;

    try {
      await supabase.from('sync_operations').insert([{
        id: generateUUID(),
        user_id: userId,
        operation_id: generateUUID(),
        entity_type: 'maintenance_task',
        entity_id: id,
        action: 'delete',
        payload: { id, deleted_at: now },
        created_at: now,
      }]);
    } catch {}
  } catch (err) {
    await enqueueOfflineOp({
      id: generateUUID(),
      entity_type: 'maintenance_task',
      action: 'delete',
      payload: { id, deleted_at: now },
      created_at: now,
    });
  }

  return true;
}

/* =========================================================================
   COMPLETAR MANTENIMIENTO CON RPC DE SUPABASE & IDEMPOTENCIA
   ========================================================================= */

export async function completeMaintenanceTask(
  userId: string,
  taskId: string,
  details?: {
    completed_at?: string;
    notes?: string;
    cost?: number;
    completed_from?: 'mobile' | 'watch';
    operation_id?: string;
  }
): Promise<void> {
  if (details?.notes && details.notes.length > MAX_TEXT_LENGTH) throw new Error('Las notas no pueden superar 255 caracteres');
  if (details?.completed_at && !Number.isFinite(new Date(details.completed_at).getTime())) throw new Error('La fecha de realización no es válida');
  if (details?.cost !== undefined && (!Number.isFinite(details.cost) || details.cost < 0 || !/^\d{1,6}(\.\d{1,2})?$/.test(String(details.cost)))) {
    throw new Error('El costo debe ser no negativo y tener máximo 6 dígitos enteros');
  }
  const opId = details?.operation_id || generateUUID();
  const completed_at = details?.completed_at || new Date().toISOString();
  const completed_from = details?.completed_from || 'mobile';
  const notes = details?.notes || null;
  const cost = details?.cost !== undefined ? details.cost : null;

  // Optimistic update inmediato en caché local para que la UI refresque al instante la próxima fecha y el contador
  const cached = await getCachedTasks();
  const task = cached.find((t) => t.id === taskId);
  const isOneTime = Boolean(task?.is_one_time || task?.description?.includes('[ONE_TIME]'));

  if (task) {
    if (isOneTime) {
      // Recordatorio de un solo uso: se elimina al completarse
      task.deleted_at = completed_at;
      task.updated_at = new Date().toISOString();
      await setCachedTasks(cached.filter((t) => t.id !== taskId));
    } else {
      const nextDate = calculateNextDate(
        getTodayDateString(),
        task.frequency_value,
        task.frequency_unit
      );
      task.last_completed_at = completed_at;
      task.next_due_date = nextDate;
      task.updated_at = new Date().toISOString();
      await setCachedTasks(cached);
    }

    // Guardar en historial local
    const history = await getCachedHistory();
    history.unshift({
      id: generateUUID(),
      user_id: userId,
      task_id: taskId,
      completed_at,
      notes,
      cost,
      operation_id: opId,
      created_at: new Date().toISOString(),
    });
    await setCachedHistory(history);
  }

  try {
    // Llamada oficial al RPC de Supabase con los parámetros exactos
    const { data, error } = await supabase.rpc('complete_maintenance', {
      p_task_id: taskId,
      p_operation_id: opId,
      p_completed_at: completed_at,
      p_completed_from: completed_from,
      p_notes: notes,
      p_cost: cost,
    });

    if (error) throw error;

    // Si es de un solo uso, marcar borrado en Supabase
    if (isOneTime) {
      await supabase
        .from('maintenance_tasks')
        .update({ deleted_at: completed_at, updated_at: new Date().toISOString() })
        .eq('id', taskId);
    }
  } catch (err: any) {
    console.warn('RPC complete_maintenance falló o sin conexión, encolando offline:', err.message);

    if (isOneTime) {
      await enqueueOfflineOp({
        id: generateUUID(),
        entity_type: 'maintenance_task',
        action: 'delete',
        payload: { id: taskId, deleted_at: completed_at },
        created_at: new Date().toISOString(),
      });
    }

    // Encolar para reintento
    await enqueueOfflineOp({
      id: opId,
      entity_type: 'maintenance_history',
      action: 'complete',
      payload: {
        taskId,
        opId,
        completed_at,
        completed_from,
        notes,
        cost,
      },
      created_at: new Date().toISOString(),
    });
  }
}

/* =========================================================================
   POSPONER MANTENIMIENTO (SNOOZE)
   ========================================================================= */

export async function snoozeTask(
  userId: string,
  taskId: string,
  daysToSnooze: number = 3
): Promise<void> {
  const snoozeError = validateInteger(String(daysToSnooze), 'Los días para posponer', true, 999999);
  if (snoozeError || daysToSnooze <= 0) throw new Error(snoozeError || 'Los días para posponer deben ser mayores a 0');
  const cached = await getCachedTasks();
  const task = cached.find((t) => t.id === taskId);
  if (!task) return;

  const newDate = addDaysToDate(task.next_due_date, daysToSnooze);
  const now = new Date().toISOString();
  task.next_due_date = newDate;
  task.updated_at = now;
  await setCachedTasks(cached);

  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({ next_due_date: newDate, updated_at: now })
      .eq('id', taskId);

    if (error) throw error;

    try {
      await supabase.from('sync_operations').insert([{
        id: generateUUID(),
        user_id: userId,
        operation_id: generateUUID(),
        entity_type: 'maintenance_task',
        entity_id: taskId,
        action: 'snooze',
        payload: { taskId, daysToSnooze, newDate },
        created_at: now,
      }]);
    } catch {}
  } catch (err) {
    await enqueueOfflineOp({
      id: generateUUID(),
      entity_type: 'maintenance_task',
      action: 'snooze',
      payload: { taskId, daysToSnooze, newDate },
      created_at: now,
    });
  }
}

/* =========================================================================
   HISTORIAL Y ESTADÍSTICAS
   ========================================================================= */

export async function getHistory(userId: string): Promise<(MaintenanceHistory & { task_title: string; asset_name: string; asset_category: AssetCategory })[]> {
  let historyItems: MaintenanceHistory[] = [];
  const [tasks, assets] = await Promise.all([getCachedTasks(), getCachedAssets()]);

  try {
    const { data, error } = await supabase
      .from('maintenance_history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    if (data) {
      historyItems = data as MaintenanceHistory[];
      await setCachedHistory(historyItems);
    }
  } catch (err) {
    console.warn('Error obteniendo historial de Supabase, usando caché:', err);
    historyItems = await getCachedHistory();
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  return historyItems.map((h) => {
    const task = taskMap.get(h.task_id);
    const asset = task ? assetMap.get(task.asset_id) : undefined;

    return {
      ...h,
      task_title: task?.title || 'Mantenimiento',
      asset_name: asset?.name || 'Objeto',
      asset_category: asset?.category || 'otras',
    };
  });
}

export async function processOfflineQueue(userId: string): Promise<void> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  for (const op of queue) {
    try {
      if (op.action === 'complete') {
        const p = op.payload;
        await supabase.rpc('complete_maintenance', {
          p_task_id: p.taskId,
          p_operation_id: p.opId,
          p_completed_at: p.completed_at,
          p_completed_from: p.completed_from,
          p_notes: p.notes,
          p_cost: p.cost,
        });
      } else if (op.action === 'snooze') {
        await supabase
          .from('maintenance_tasks')
          .update({ next_due_date: op.payload.newDate, updated_at: new Date().toISOString() })
          .eq('id', op.payload.taskId);
      } else if (op.action === 'create') {
        if (op.entity_type === 'asset') {
          await supabase.from('assets').insert([op.payload]);
        } else if (op.entity_type === 'maintenance_task') {
          await supabase.from('maintenance_tasks').insert([op.payload]);
        }
      } else if (op.action === 'update') {
        if (op.entity_type === 'asset') {
          await supabase.from('assets').update(op.payload).eq('id', op.payload.id);
        } else if (op.entity_type === 'maintenance_task') {
          await supabase.from('maintenance_tasks').update(op.payload).eq('id', op.payload.id);
        }
      } else if (op.action === 'delete') {
        if (op.entity_type === 'asset') {
          await supabase.from('assets').update({ deleted_at: op.payload.deleted_at }).eq('id', op.payload.id);
        } else if (op.entity_type === 'maintenance_task') {
          await supabase.from('maintenance_tasks').update({ deleted_at: op.payload.deleted_at }).eq('id', op.payload.id);
        }
      }
      await clearOfflineOp(op.id);
    } catch (err) {
      console.warn(`Error procesando op offline ${op.id}:`, err);
    }
  }
}
