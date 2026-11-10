import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Calendar, Repeat, Edit3, Trash2 } from 'lucide-react-native';
import { MaintenanceTaskWithAsset } from '@/types/models';
import { Palette } from '@/constants/Colors';
import { CategoryBadge } from '@/components/CategoryBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatFrequency } from '@/utils/dateUtils';

interface TaskCardProps {
  task: MaintenanceTaskWithAsset;
  onPress?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showAsset?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onEdit,
  onDelete,
  showAsset = true,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showAsset && (
            <CategoryBadge category={task.asset_category} size="small" />
          )}
          <Text style={styles.assetName} numberOfLines={1}>
            {task.asset_name}
          </Text>
        </View>
        <StatusBadge status={task.computed_status} daysRemaining={task.days_remaining} />
      </View>

      <Text style={styles.title}>{task.title}</Text>
      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description.replace('[ONE_TIME] ', '').replace('[ONE_TIME]', '')}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Calendar size={13} color={Palette.textMuted} />
          <Text style={styles.metaText}>Próximo: {formatDate(task.next_due_date)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Repeat size={13} color={Palette.textMuted} />
          <Text style={styles.metaText}>
            {task.is_one_time || task.description?.includes('[ONE_TIME]')
              ? 'Única vez (sin repetición)'
              : formatFrequency(task.frequency_value, task.frequency_unit)}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          {onEdit && (
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}>
              <Edit3 size={15} color={Palette.forest} />
              <Text style={styles.iconActionText}>Editar</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.iconActionBtn, styles.deleteActionBtn]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}>
              <Trash2 size={15} color={Palette.danger} />
              <Text style={[styles.iconActionText, { color: Palette.danger }]}>Borrar</Text>
            </TouchableOpacity>
          )}
        </View>

        {onComplete && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={(e) => {
              e.stopPropagation();
              onComplete();
            }}>
            <CheckCircle2 size={16} color={Palette.forest} />
            <Text style={styles.completeBtnText}>Completar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  assetName: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.charcoal,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Palette.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F1',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Palette.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EEF4F0',
  },
  deleteActionBtn: {
    backgroundColor: Palette.dangerLight,
  },
  iconActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.forest,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.sageLight,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.forest,
  },
});

