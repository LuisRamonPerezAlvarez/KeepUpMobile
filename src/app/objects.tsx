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
  Plus,
  Edit2,
  Trash2,
  Wrench,
  Info,
  Calendar,
  ChevronRight,
  Package,
} from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useData } from '@/context/DataContext';
import { Asset, AssetCategory, MaintenanceTaskWithAsset } from '@/types/models';
import { CategoryBadge } from '@/components/CategoryBadge';
import { AssetFormModal } from '@/components/AssetFormModal';
import { TaskFormModal } from '@/components/TaskFormModal';
import { TaskCard } from '@/components/TaskCard';
import { CompleteTaskModal } from '@/components/CompleteTaskModal';
import { formatDate } from '@/utils/dateUtils';

const CATEGORY_FILTERS: { key: string; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'electronica', label: 'Electrónica' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'hogar', label: 'Hogar' },
  { key: 'herramientas', label: 'Herramientas' },
  { key: 'otras', label: 'Otras' },
];

export default function ObjectsScreen() {
  const { assets, tasks, addAsset, editAsset, removeAsset, addTask, markTaskComplete, removeTask } =
    useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskAssetTarget, setTaskAssetTarget] = useState<string | undefined>(undefined);

  const [selectedTaskToComplete, setSelectedTaskToComplete] =
    useState<MaintenanceTaskWithAsset | null>(null);

  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  const filteredAssets = assets.filter((a) => {
    if (selectedCategory === 'todas') return true;
    return a.category === selectedCategory;
  });

  const handleOpenEdit = (asset: Asset) => {
    setAssetToEdit(asset);
    setAssetModalOpen(true);
  };

  const handleDelete = (asset: Asset) => {
    Alert.alert(
      'Eliminar Objeto',
      `¿Deseas eliminar "${asset.name}"? También se eliminarán todos sus mantenimientos e historial asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeAsset(asset.id);
          },
        },
      ]
    );
  };

  const handleAddTaskForAsset = (assetId: string) => {
    setTaskAssetTarget(assetId);
    setTaskModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera y botón para nuevo objeto */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>Mis Objetos Registrados</Text>
            <Text style={styles.subtitle}>
              {assets.length} {assets.length === 1 ? 'objeto registrado' : 'objetos registrados'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setAssetToEdit(null);
              setAssetModalOpen(true);
            }}>
            <Plus size={18} color={Palette.white} />
            <Text style={styles.addBtnText}>Nuevo Objeto</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros por Categoría */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}>
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedCategory(cat.key)}>
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista de Objetos */}
        {filteredAssets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Package size={48} color={Palette.sage} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No hay objetos en esta categoría</Text>
            <Text style={styles.emptySubtitle}>
              Presiona "Nuevo Objeto" para registrar computadoras, autos, bicicletas, electrodomésticos o herramientas.
            </Text>
          </View>
        ) : (
          filteredAssets.map((asset) => {
            const assetTasks = tasks.filter((t) => t.asset_id === asset.id);
            const isExpanded = expandedAssetId === asset.id;

            return (
              <View key={asset.id} style={styles.assetCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                  style={styles.assetHeader}>
                  <View style={styles.assetHeaderLeft}>
                    <CategoryBadge category={asset.category} size="medium" />
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetMeta}>
                        {[asset.brand, asset.model].filter(Boolean).join(' • ') ||
                          'Sin marca especificada'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.assetActions}>
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(asset)}
                      style={styles.iconActionBtn}>
                      <Edit2 size={16} color={Palette.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(asset)}
                      style={styles.iconActionBtn}>
                      <Trash2 size={16} color={Palette.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Detalles extra del objeto */}
                <View style={styles.assetDetailsRow}>
                  {asset.purchase_date ? (
                    <Text style={styles.detailTag}>
                      Adquirido: {formatDate(asset.purchase_date)}
                    </Text>
                  ) : null}
                  <Text style={styles.detailTagTasks}>
                    {assetTasks.length} {assetTasks.length === 1 ? 'mantenimiento' : 'mantenimientos'}
                  </Text>
                </View>

                {asset.description ? (
                  <Text style={styles.assetDescription}>{asset.description}</Text>
                ) : null}

                {/* Sublista de Mantenimientos asociados */}
                <View style={styles.tasksSection}>
                  <View style={styles.tasksSectionHeader}>
                    <Text style={styles.tasksSectionTitle}>Mantenimientos Preventivos</Text>
                    <TouchableOpacity
                      style={styles.addTaskMiniBtn}
                      onPress={() => handleAddTaskForAsset(asset.id)}>
                      <Plus size={14} color={Palette.forest} />
                      <Text style={styles.addTaskMiniBtnText}>Añadir Mantenimiento</Text>
                    </TouchableOpacity>
                  </View>

                  {assetTasks.length === 0 ? (
                    <View style={styles.noTasksBox}>
                      <Text style={styles.noTasksText}>
                        No hay mantenimientos programados para este objeto.
                      </Text>
                    </View>
                  ) : (
                    assetTasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        showAsset={false}
                        onComplete={() => setSelectedTaskToComplete(t)}
                      />
                    ))
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Crear / Editar Objeto */}
      <AssetFormModal
        visible={assetModalOpen}
        assetToEdit={assetToEdit}
        onClose={() => {
          setAssetModalOpen(false);
          setAssetToEdit(null);
        }}
        onSave={async (data) => {
          if (assetToEdit) {
            await editAsset(assetToEdit.id, data);
          } else {
            await addAsset(data);
          }
        }}
      />

      {/* Modal Crear Mantenimiento */}
      <TaskFormModal
        visible={taskModalOpen}
        assets={assets}
        initialAssetId={taskAssetTarget}
        onClose={() => {
          setTaskModalOpen(false);
          setTaskAssetTarget(undefined);
        }}
        onSave={async (data) => {
          await addTask(data);
        }}
      />

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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  subtitle: {
    fontSize: 13,
    color: Palette.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.forest,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addBtnText: {
    color: Palette.white,
    fontWeight: '700',
    fontSize: 13,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryScrollContent: {
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  filterChipSelected: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  filterChipTextSelected: {
    color: Palette.white,
  },
  emptyCard: {
    backgroundColor: Palette.white,
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginTop: 20,
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
  assetCard: {
    backgroundColor: Palette.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  assetMeta: {
    fontSize: 13,
    color: Palette.textMuted,
    marginTop: 1,
  },
  assetActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Palette.cream,
  },
  assetDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F2',
  },
  detailTag: {
    fontSize: 11,
    color: Palette.textSecondary,
    backgroundColor: Palette.cream,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailTagTasks: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forest,
    backgroundColor: Palette.sageLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  assetDescription: {
    fontSize: 13,
    color: Palette.textMuted,
    marginTop: 10,
    lineHeight: 18,
  },
  tasksSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F2EB',
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tasksSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  addTaskMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.sageLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  addTaskMiniBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.forest,
  },
  noTasksBox: {
    backgroundColor: Palette.cream,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  noTasksText: {
    fontSize: 12,
    color: Palette.textMuted,
  },
});

