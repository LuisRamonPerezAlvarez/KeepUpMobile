import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  Asset,
  MaintenanceHistory,
  MaintenanceTaskWithAsset,
  AssetCategory,
  MaintenanceFrequencyUnit,
} from '@/types/models';
import * as dataService from '@/services/supabaseData';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';

interface DataContextType {
  loading: boolean;
  syncing: boolean;
  isOnline: boolean;
  assets: Asset[];
  tasks: MaintenanceTaskWithAsset[];
  history: (MaintenanceHistory & { task_title: string; asset_name: string; asset_category: AssetCategory })[];
  stats: {
    totalAssets: number;
    totalTasks: number;
    overdueTasks: number;
    pendingTasks: number;
    upcomingTasks: number;
    completedTasks: number;
    totalInvestedCost: number;
  };
  syncPendingCount: number;
  lastSyncTime: string | null;
  refreshData: () => Promise<void>;
  addAsset: (data: {
    name: string;
    category: AssetCategory;
    description?: string;
    brand?: string;
    model?: string;
    purchase_date?: string;
  }) => Promise<Asset>;
  editAsset: (
    id: string,
    data: Partial<Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => Promise<Asset | null>;
  removeAsset: (id: string) => Promise<boolean>;
  addTask: (data: {
    asset_id: string;
    title: string;
    description?: string;
    frequency_value: number;
    frequency_unit: MaintenanceFrequencyUnit;
    last_date?: string;
    estimated_cost?: number;
    enable_reminder?: boolean;
  }) => Promise<void>;
  editTask: (
    id: string,
    data: Parameters<typeof dataService.updateTask>[2]
  ) => Promise<void>;
  removeTask: (id: string) => Promise<boolean>;
  markTaskComplete: (
    taskId: string,
    details?: { completed_date?: string; notes?: string; cost?: number }
  ) => Promise<void>;
  snoozeMaintenanceTask: (taskId: string, days?: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTaskWithAsset[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [syncPendingCount, setSyncPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalAssets: 0,
    totalTasks: 0,
    overdueTasks: 0,
    pendingTasks: 0,
    upcomingTasks: 0,
    completedTasks: 0,
    totalInvestedCost: 0,
  });

  const refreshData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setSyncing(true);
    try {
      // 1. Procesar cola offline pendiente si hay conexión
      await dataService.processOfflineQueue(user.id);

      // 2. Consultar datos
      const [assetsData, tasksData, historyData, pendingQueue] = await Promise.all([
        dataService.getAssets(user.id),
        dataService.getTasksWithAsset(user.id),
        dataService.getHistory(user.id),
        dataService.getOfflineQueue(),
      ]);

      setAssets(assetsData);
      setTasks(tasksData);
      setHistory(historyData);
      setSyncPendingCount(pendingQueue.length);
      setLastSyncTime(new Date().toISOString());
      setIsOnline(true);

      // Calcular estadísticas
      let overdue = 0;
      let pending = 0;
      let upcoming = 0;
      tasksData.forEach((t) => {
        if (t.computed_status === 'overdue') overdue++;
        else if (t.computed_status === 'pending') pending++;
        else upcoming++;
      });

      const totalCost = historyData.reduce((acc, h) => acc + (h.cost || 0), 0);

      setStats({
        totalAssets: assetsData.length,
        totalTasks: tasksData.length,
        overdueTasks: overdue,
        pendingTasks: pending,
        upcomingTasks: upcoming,
        completedTasks: historyData.length,
        totalInvestedCost: totalCost,
      });
    } catch (error) {
      console.warn('Error refrescando datos en Mobile:', error);
      setIsOnline(false);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [user]);

  // Registro de dispositivo y carga inicial
  useEffect(() => {
    if (user) {
      dataService.registerDevice(user.id);
      refreshData();
    } else {
      setAssets([]);
      setTasks([]);
      setHistory([]);
      setLoading(false);
    }
  }, [user, refreshData]);

  // SUSCRIPCIÓN REALTIME A SUPABASE
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('keepup_mobile_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assets' },
        () => refreshData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_tasks' },
        () => refreshData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_history' },
        () => refreshData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sync_operations' },
        () => refreshData()
      )
      .subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshData]);

  const addAsset = async (data: any) => {
    if (!user) throw new Error('Usuario no autenticado');
    const asset = await dataService.createAsset(user.id, data);
    await refreshData();
    return asset;
  };

  const editAsset = async (id: string, data: any) => {
    if (!user) throw new Error('Usuario no autenticado');
    const res = await dataService.updateAsset(user.id, id, data);
    await refreshData();
    return res;
  };

  const removeAsset = async (id: string) => {
    if (!user) throw new Error('Usuario no autenticado');
    const ok = await dataService.deleteAsset(user.id, id);
    await refreshData();
    return ok;
  };

  const addTask = async (data: any) => {
    if (!user) throw new Error('Usuario no autenticado');
    await dataService.createTask(user.id, data);
    await refreshData();
  };

  const editTask = async (id: string, data: any) => {
    if (!user) throw new Error('Usuario no autenticado');
    await dataService.updateTask(user.id, id, data);
    await refreshData();
  };

  const removeTask = async (id: string) => {
    if (!user) throw new Error('Usuario no autenticado');
    const ok = await dataService.deleteTask(user.id, id);
    await refreshData();
    return ok;
  };

  const markTaskComplete = async (taskId: string, details?: any) => {
    if (!user) throw new Error('Usuario no autenticado');
    await dataService.completeMaintenanceTask(user.id, taskId, {
      completed_at: details?.completed_date ? new Date(details.completed_date).toISOString() : new Date().toISOString(),
      notes: details?.notes,
      cost: details?.cost,
      completed_from: 'mobile',
    });
    await refreshData();
  };

  const snoozeMaintenanceTask = async (taskId: string, days: number = 3) => {
    if (!user) throw new Error('Usuario no autenticado');
    await dataService.snoozeTask(user.id, taskId, days);
    await refreshData();
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        syncing,
        isOnline,
        assets,
        tasks,
        history,
        stats,
        syncPendingCount,
        lastSyncTime,
        refreshData,
        addAsset,
        editAsset,
        removeAsset,
        addTask,
        editTask,
        removeTask,
        markTaskComplete,
        snoozeMaintenanceTask,
      }}>
      {children}
    </DataContext.Provider>
  );
};

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
}
