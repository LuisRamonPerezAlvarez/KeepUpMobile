export type AssetCategory = 'electronica' | 'transporte' | 'hogar' | 'herramientas' | 'otras';
export type MaintenanceFrequencyUnit = 'days' | 'weeks' | 'months' | 'years';
export type TaskStatus = 'overdue' | 'pending' | 'upcoming';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskDbStatus = 'active' | 'paused';
export type AppRole = 'mobile' | 'watch';
export type DeviceType = 'android' | 'ios' | 'web';

export interface Profile {
  id: string; // UUID (auth.users.id)
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string; // UUID
  user_id: string;
  name: string;
  category: AssetCategory;
  description?: string | null;
  brand?: string | null;
  model?: string | null;
  purchase_date?: string | null; // ISO YYYY-MM-DD
  status: string; // 'active', etc.
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTask {
  id: string; // UUID
  asset_id: string;
  title: string;
  description?: string | null;
  frequency_value: number;
  frequency_unit: MaintenanceFrequencyUnit;
  next_due_date: string; // ISO YYYY-MM-DD
  last_completed_at?: string | null;
  status: 'active' | 'paused'; // Base de datos check (status in ('active', 'paused'))
  priority?: TaskPriority | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  is_one_time?: boolean;
}

export interface MaintenanceHistory {
  id: string; // UUID
  user_id: string;
  task_id: string;
  completed_at: string; // ISO datetime
  notes?: string | null;
  cost?: number | null;
  operation_id?: string | null;
  created_at: string;
}

export interface Reminder {
  id: string; // UUID
  task_id: string;
  enabled: boolean;
  days_before: number;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string; // UUID
  user_id: string;
  device_name: string;
  device_type: DeviceType;
  app_role: AppRole;
  last_seen_at: string;
  created_at: string;
}

export interface SyncOperation {
  id: string; // UUID
  user_id: string;
  device_id?: string | null;
  operation_id: string;
  entity_type: 'asset' | 'maintenance_task' | 'maintenance_history' | 'reminder';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'complete' | 'snooze';
  payload: any;
  created_at: string;
}

export interface MaintenanceTaskWithAsset extends MaintenanceTask {
  asset_name: string;
  asset_category: AssetCategory;
  days_remaining: number;
  computed_status: TaskStatus;
}
