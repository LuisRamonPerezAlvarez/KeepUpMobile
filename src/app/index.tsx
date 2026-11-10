import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  CalendarDays,
  Wrench,
  TrendingUp,
} from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useData } from '@/context/DataContext';
import { TaskCard } from '@/components/TaskCard';
import { CompleteTaskModal } from '@/components/CompleteTaskModal';
import { TaskFormModal } from '@/components/TaskFormModal';
import { MaintenanceTaskWithAsset, MaintenanceTask } from '@/types/models';

type FilterTab = 'todos' | 'atrasados' | 'pendientes' | 'proximos';

export default function HomeScreen() {
  const {
    tasks,
    assets,
    stats,
    loading,
    refreshData,
    markTaskComplete,
    addTask,
    editTask,
    removeTask,
  } = useData();
  const [filter, setFilter] = useState<FilterTab>('todos');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTaskToComplete, setSelectedTaskToComplete] =
    useState<MaintenanceTaskWithAsset | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<MaintenanceTask | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleEditTask = (task: MaintenanceTaskWithAsset) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: MaintenanceTaskWithAsset) => {
    Alert.alert(
      'Eliminar Mantenimiento',
      `¿Estás seguro de que deseas eliminar "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTask(task.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el mantenimiento');
            }
          },
        },
      ]
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'atrasados') return t.computed_status === 'overdue';
    if (filter === 'pendientes') return t.computed_status === 'pending';
    if (filter === 'proximos') return t.computed_status === 'upcoming';
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={Palette.forest}
            colors={[Palette.forest]}
          />
        }>
        {/* Banner de Bienvenida y Resumen */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeGreeting}>KeepUp Mantenimiento</Text>
          <Text style={styles.welcomeSub}>
            Control preventivo y cuidado de tus objetos personales
          </Text>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statBox, filter === 'atrasados' && styles.statBoxActive]}
              onPress={() => setFilter('atrasados')}>
              <View style={[styles.statIconBadge, { backgroundColor: Palette.dangerLight }]}>
                <AlertTriangle size={16} color={Palette.danger} />
              </View>
              <Text style={styles.statNumber}>{stats.overdueTasks}</Text>
              <Text style={styles.statLabel}>Atrasados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statBox, filter === 'pendientes' && styles.statBoxActive]}
              onPress={() => setFilter('pendientes')}>
              <View style={[styles.statIconBadge, { backgroundColor: Palette.warningLight }]}>
                <Clock size={16} color={Palette.warning} />
              </View>
              <Text style={styles.statNumber}>{stats.pendingTasks}</Text>
              <Text style={styles.statLabel}>Próximos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statBox, filter === 'proximos' && styles.statBoxActive]}
              onPress={() => setFilter('proximos')}>
              <View style={[styles.statIconBadge, { backgroundColor: Palette.sageLight }]}>
                <CalendarDays size={16} color={Palette.forest} />
              </View>
              <Text style={styles.statNumber}>{stats.upcomingTasks}</Text>
              <Text style={styles.statLabel}>Al día</Text>
            </TouchableOpacity>

            <View style={styles.statBox}>
              <View style={[styles.statIconBadge, { backgroundColor: Palette.successLight }]}>
                <CheckCircle size={16} color={Palette.success} />
              </View>
              <Text style={styles.statNumber}>{stats.completedTasks}</Text>
              <Text style={styles.statLabel}>Hechos</Text>
            </View>
          </View>
        </View>

        {/* Sección de Acciones Rápidas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mantenimientos Programados</Text>
          {assets.length > 0 && (
            <TouchableOpacity
              style={styles.addMiniBtn}
              onPress={() => setIsTaskModalOpen(true)}>
              <Plus size={16} color={Palette.white} />
              <Text style={styles.addMiniBtnText}>Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de Pestaña */}
        <View style={styles.filterPills}>
          {(['todos', 'atrasados', 'pendientes', 'proximos'] as FilterTab[]).map((tab) => {
            const labels = {
              todos: 'Todos',
              atrasados: `Atrasados (${stats.overdueTasks})`,
              pendientes: `Pendientes (${stats.pendingTasks})`,
              proximos: `Futuros (${stats.upcomingTasks})`,
            };
            const isSelected = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => setFilter(tab)}>
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Listado de Tareas */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Wrench size={44} color={Palette.sage} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>Sin mantenimientos en esta sección</Text>
            <Text style={styles.emptySubtitle}>
              {assets.length === 0
                ? 'Comienza registrando tus objetos en la pestaña "Mis Objetos".'
                : 'Crea un mantenimiento preventivo con recordatorios y frecuencias.'}
            </Text>
            {assets.length > 0 && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setIsTaskModalOpen(true)}>
                <Plus size={18} color={Palette.white} />
                <Text style={styles.primaryBtnText}>Crear Mantenimiento</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => setSelectedTaskToComplete(task)}
              onEdit={() => handleEditTask(task)}
              onDelete={() => handleDeleteTask(task)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal para completar y registrar historial */}
      <CompleteTaskModal
        visible={Boolean(selectedTaskToComplete)}
        task={selectedTaskToComplete}
        onClose={() => setSelectedTaskToComplete(null)}
        onConfirm={async (data) => {
          if (selectedTaskToComplete) {
            await markTaskComplete(selectedTaskToComplete.id, data);
          }
        }}
      />

      {/* Modal para crear o editar tarea */}
      <TaskFormModal
        visible={isTaskModalOpen}
        assets={assets}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={async (data) => {
          if (taskToEdit) {
            await editTask(taskToEdit.id, data);
          } else {
            await addTask(data);
          }
          setTaskToEdit(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  welcomeGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.forest,
  },
  welcomeSub: {
    fontSize: 13,
    color: Palette.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Palette.cream,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statBoxActive: {
    borderColor: Palette.forest,
    backgroundColor: Palette.sageLight,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.forest,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addMiniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.white,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  pillSelected: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  pillTextSelected: {
    color: Palette.white,
  },
  emptyContainer: {
    backgroundColor: Palette.white,
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.charcoal,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.forest,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 18,
  },
  primaryBtnText: {
    color: Palette.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
