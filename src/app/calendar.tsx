import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useData } from '@/context/DataContext';
import { TaskCard } from '@/components/TaskCard';
import { CompleteTaskModal } from '@/components/CompleteTaskModal';
import { MaintenanceTaskWithAsset } from '@/types/models';
import { formatDate } from '@/utils/dateUtils';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarScreen() {
  const { tasks, markTaskComplete } = useData();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
  );

  const [selectedTaskToComplete, setSelectedTaskToComplete] =
    useState<MaintenanceTaskWithAsset | null>(null);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generar cuadrícula de días para el mes seleccionado
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Mapeo de fechas a tareas para indicadores
  const tasksByDate: Record<string, MaintenanceTaskWithAsset[]> = {};
  tasks.forEach((t) => {
    if (!tasksByDate[t.next_due_date]) {
      tasksByDate[t.next_due_date] = [];
    }
    tasksByDate[t.next_due_date].push(t);
  });

  const calendarDays: ({ dayNumber: number; dateStr: string } | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: d, dateStr: dStr });
  }

  // Tareas para la fecha seleccionada
  const selectedTasks = tasksByDate[selectedDateStr] || [];

  // Mantenimientos en el mes actual
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthTasks = tasks.filter((t) => t.next_due_date.startsWith(monthPrefix));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Encabezado del Mes y Botones de Navegación */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
            <ChevronLeft size={20} color={Palette.forest} />
          </TouchableOpacity>
          <View style={styles.monthTitleContainer}>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
            <Text style={styles.monthSubtitle}>
              {monthTasks.length} {monthTasks.length === 1 ? 'mantenimiento este mes' : 'mantenimientos este mes'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
            <ChevronRight size={20} color={Palette.forest} />
          </TouchableOpacity>
        </View>

        {/* Tarjeta del Calendario */}
        <View style={styles.calendarCard}>
          {/* Fila de nombres de días */}
          <View style={styles.daysHeaderRow}>
            {DAY_NAMES.map((d) => (
              <Text key={d} style={styles.dayColHeader}>
                {d}
              </Text>
            ))}
          </View>

          {/* Días del Mes */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              if (!item) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const isSelected = item.dateStr === selectedDateStr;
              const hasTasks = Boolean(tasksByDate[item.dateStr]?.length);
              const hasOverdue = tasksByDate[item.dateStr]?.some((t) => t.computed_status === 'overdue');

              return (
                <TouchableOpacity
                  key={item.dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDateStr(item.dateStr)}>
                  <Text
                    style={[
                      styles.dayNumberText,
                      isSelected && styles.dayNumberSelected,
                    ]}>
                    {item.dayNumber}
                  </Text>
                  {hasTasks && (
                    <View
                      style={[
                        styles.taskDot,
                        hasOverdue && { backgroundColor: Palette.danger },
                        isSelected && { backgroundColor: Palette.white },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tareas del día seleccionado */}
        <View style={styles.selectedDaySection}>
          <View style={styles.selectedDayHeader}>
            <CalendarIcon size={18} color={Palette.forest} />
            <Text style={styles.selectedDayTitle}>
              {formatDate(selectedDateStr)}
            </Text>
          </View>

          {selectedTasks.length === 0 ? (
            <View style={styles.noTasksCard}>
              <Text style={styles.noTasksText}>
                No hay mantenimientos programados para este día.
              </Text>
            </View>
          ) : (
            selectedTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={() => setSelectedTaskToComplete(t)}
              />
            ))
          )}
        </View>

        {/* Todos los eventos del mes */}
        <View style={styles.upcomingMonthSection}>
          <Text style={styles.upcomingMonthTitle}>Agenda del Mes</Text>
          {monthTasks.length === 0 ? (
            <Text style={styles.noMonthTasksText}>No hay actividades en todo el mes.</Text>
          ) : (
            monthTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={() => setSelectedTaskToComplete(t)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal Completar Tarea */}
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navBtn: {
    padding: 10,
    backgroundColor: Palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  monthSubtitle: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
  },
  calendarCard: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 20,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3EF',
    marginBottom: 8,
  },
  dayColHeader: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: Palette.forest,
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.charcoal,
  },
  dayNumberSelected: {
    color: Palette.white,
    fontWeight: '800',
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.forest,
    marginTop: 3,
  },
  selectedDaySection: {
    marginBottom: 20,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  noTasksCard: {
    backgroundColor: Palette.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  noTasksText: {
    fontSize: 13,
    color: Palette.textMuted,
  },
  upcomingMonthSection: {
    marginTop: 10,
  },
  upcomingMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.charcoal,
    marginBottom: 12,
  },
  noMonthTasksText: {
    fontSize: 13,
    color: Palette.textMuted,
  },
});

