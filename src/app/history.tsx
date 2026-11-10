import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  History as HistoryIcon,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  CheckCircle2,
} from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useData } from '@/context/DataContext';
import { CategoryBadge } from '@/components/CategoryBadge';
import { formatDate } from '@/utils/dateUtils';

export default function HistoryScreen() {
  const { history, stats } = useData();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Resumen de Inversión y Servicios Realizados */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.completedTasks}</Text>
            <Text style={styles.summaryLabel}>Mantenimientos Realizados</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Palette.forest }]}>
              ${stats.totalInvestedCost.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Total Invertido</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bitácora de Actividades</Text>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <HistoryIcon size={44} color={Palette.sage} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>Aún no hay mantenimientos completados</Text>
            <Text style={styles.emptySubtitle}>
              Cuando completes un mantenimiento desde el Inicio o la lista de Objetos, quedará registrado aquí con su costo y notas.
            </Text>
          </View>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <CategoryBadge category={item.asset_category} size="small" />
                  <Text style={styles.assetName} numberOfLines={1}>
                    {item.asset_name}
                  </Text>
                </View>
              </View>

              <View style={styles.titleRow}>
                <CheckCircle2 size={17} color={Palette.success} style={{ marginRight: 6 }} />
                <Text style={styles.taskTitle}>{item.task_title}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Calendar size={13} color={Palette.forest} />
                  <Text style={styles.metaText}>
                    Realizado: {formatDate(item.completed_at ? item.completed_at.split('T')[0] : '')}
                  </Text>
                </View>

                {item.cost !== null && item.cost !== undefined ? (
                  <View style={[styles.metaBadge, { backgroundColor: Palette.successLight }]}>
                    <DollarSign size={13} color={Palette.success} />
                    <Text style={[styles.metaText, { color: Palette.success, fontWeight: '700' }]}>
                      Costo: ${item.cost}
                    </Text>
                  </View>
                ) : null}
              </View>

              {item.notes ? (
                <View style={styles.notesContainer}>
                  <FileText size={14} color={Palette.textMuted} style={{ marginTop: 2 }} />
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
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
  summaryCard: {
    backgroundColor: Palette.white,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  summaryLabel: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Palette.cardBorder,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.charcoal,
    marginBottom: 12,
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
  historyCard: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
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
    fontWeight: '600',
    color: Palette.textSecondary,
    flexShrink: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.charcoal,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.cream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: Palette.charcoal,
    fontWeight: '500',
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F9FAF7',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ECEEE6',
  },
  notesText: {
    fontSize: 13,
    color: Palette.charcoal,
    flex: 1,
    lineHeight: 18,
  },
});

