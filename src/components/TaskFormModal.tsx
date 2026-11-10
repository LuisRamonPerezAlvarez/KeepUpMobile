import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { Asset, MaintenanceFrequencyUnit, MaintenanceTask } from '@/types/models';
import { getTodayDateString } from '@/utils/dateUtils';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { dateToString, limitText, limitMoney, onlyDigits, validateInteger, validateMoney, validateText, isValidDateString, MAX_TEXT_LENGTH } from '@/utils/validation';

interface TaskModalProps {
  visible: boolean;
  assets: Asset[];
  initialAssetId?: string;
  taskToEdit?: MaintenanceTask | null;
  onClose: () => void;
  onSave: (data: {
    asset_id: string;
    title: string;
    description?: string;
    frequency_value: number;
    frequency_unit: MaintenanceFrequencyUnit;
    last_date?: string;
    estimated_cost?: number;
    enable_reminder?: boolean;
    is_one_time?: boolean;
  }) => Promise<void>;
}

const FREQUENCY_UNITS: { key: MaintenanceFrequencyUnit; label: string }[] = [
  { key: 'days', label: 'Días' },
  { key: 'weeks', label: 'Semanas' },
  { key: 'months', label: 'Meses' },
  { key: 'years', label: 'Años' },
];

export const TaskFormModal: React.FC<TaskModalProps> = ({
  visible,
  assets,
  initialAssetId,
  taskToEdit,
  onClose,
  onSave,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyValue, setFrequencyValue] = useState('1');
  const [frequencyUnit, setFrequencyUnit] = useState<MaintenanceFrequencyUnit>('months');
  const [lastDate, setLastDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [enableReminder, setEnableReminder] = useState(true);
  const [isOneTime, setIsOneTime] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  React.useEffect(() => {
    if (taskToEdit) {
      setSelectedAssetId(taskToEdit.asset_id);
      setTitle(taskToEdit.title);
      const cleanDesc = (taskToEdit.description || '').replace('[ONE_TIME] ', '').replace('[ONE_TIME]', '');
      setDescription(cleanDesc);
      setFrequencyValue(String(taskToEdit.frequency_value));
      setFrequencyUnit(taskToEdit.frequency_unit);
      setLastDate(taskToEdit.last_completed_at ? taskToEdit.last_completed_at.split('T')[0] : '');
      setEstimatedCost('');
      setEnableReminder(true);
      setIsOneTime(Boolean(taskToEdit.is_one_time || taskToEdit.description?.includes('[ONE_TIME]')));
    } else {
      setSelectedAssetId(initialAssetId || (assets.length > 0 ? assets[0].id : ''));
      setTitle('');
      setDescription('');
      setFrequencyValue('3');
      setFrequencyUnit('months');
      setLastDate(getTodayDateString());
      setEstimatedCost('');
      setEnableReminder(true);
      setIsOneTime(false);
    }
    setError(null);
  }, [taskToEdit, initialAssetId, assets, visible]);

  const handleSubmit = async () => {
    if (!selectedAssetId) {
      setError('Debes seleccionar un objeto para este mantenimiento');
      return;
    }
    const titleError = validateText(title, 'El título del mantenimiento', true);
    if (titleError) {
      setError(titleError);
      return;
    }
    const freqNum = parseInt(frequencyValue, 10);
    const frequencyError = validateInteger(frequencyValue, 'La frecuencia', true, 999999);
    if (!isOneTime && (frequencyError || isNaN(freqNum) || freqNum <= 0)) {
      setError(frequencyError || 'La frecuencia debe ser un número entero mayor a 0');
      return;
    }
    const costError = validateMoney(estimatedCost, 'El costo');
    if (costError) { setError(costError); return; }
    if (lastDate && !isValidDateString(lastDate)) { setError('La fecha del último servicio no es válida'); return; }

    try {
      setSaving(true);
      await onSave({
        asset_id: selectedAssetId,
        title: limitText(title).trim(),
        description: limitText(description).trim() || undefined,
        frequency_value: isOneTime ? 1 : freqNum,
        frequency_unit: isOneTime ? 'days' : frequencyUnit,
        last_date: lastDate.trim() || undefined,
        estimated_cost: estimatedCost ? Number(estimatedCost) : undefined,
        enable_reminder: enableReminder,
        is_one_time: isOneTime,
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al guardar tarea');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {taskToEdit ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={Palette.textMuted} />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {!taskToEdit && (
              <>
                <Text style={styles.label}>Objeto asignado *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetSelector}>
                  {assets.map((asset) => {
                    const isSelected = selectedAssetId === asset.id;
                    return (
                      <TouchableOpacity
                        key={asset.id}
                        style={[
                          styles.assetChip,
                          isSelected && styles.assetChipSelected,
                        ]}
                        onPress={() => setSelectedAssetId(asset.id)}>
                        <Text
                          style={[
                            styles.assetChipText,
                            isSelected && styles.assetChipTextSelected,
                          ]}>
                          {asset.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <Text style={styles.label}>Título del mantenimiento *</Text>
            <TextInput
              style={[styles.input, error && !title.trim() && styles.inputError]}
              placeholder="Ej. Cambio de bujías, Limpieza de filtro, Calibración"
              placeholderTextColor={Palette.textMuted}
              value={title}
              onChangeText={(value) => { setError(null); setTitle(limitText(value)); }}
              maxLength={MAX_TEXT_LENGTH}
            />
            <Text style={styles.counter}>{title.length}/{MAX_TEXT_LENGTH}</Text>

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.switchTitle}>Recordatorio de un solo uso</Text>
                <Text style={styles.switchSubtitle}>
                  No se repite periódicamente. Al marcarse como completado se elimina automáticamente.
                </Text>
              </View>
              <Switch
                value={isOneTime}
                onValueChange={setIsOneTime}
                thumbColor={isOneTime ? Palette.forest : '#E0E0E0'}
                trackColor={{ false: '#D1D5DB', true: Palette.sageLight }}
              />
            </View>

            {!isOneTime && (
              <>
                <Text style={styles.label}>Frecuencia recomendada *</Text>
                <View style={styles.freqContainer}>
                  <View style={styles.freqInputWrapper}>
                    <Text style={styles.freqPrefix}>Cada</Text>
                    <TextInput
                      style={styles.freqInput}
                      keyboardType="numeric"
                      value={frequencyValue}
                      onChangeText={(value) => setFrequencyValue(onlyDigits(value))}
                      maxLength={9}
                    />
                  </View>

                  <View style={styles.unitButtonsRow}>
                    {FREQUENCY_UNITS.map((u) => {
                      const isSelected = frequencyUnit === u.key;
                      return (
                        <TouchableOpacity
                          key={u.key}
                          style={[styles.unitBtn, isSelected && styles.unitBtnSelected]}
                          onPress={() => setFrequencyUnit(u.key)}>
                          <Text
                            style={[
                              styles.unitBtnText,
                              isSelected && styles.unitBtnTextSelected,
                            ]}>
                            {u.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            <Text style={styles.label}>Fecha del último servicio</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: lastDate ? Palette.charcoal : Palette.textMuted }}>{lastDate || 'Seleccionar fecha'}</Text>
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker value={lastDate ? new Date(`${lastDate}T12:00:00`) : new Date()} mode="date" presentation="dialog" onValueChange={(_, date) => { if (date) setLastDate(dateToString(date)); setShowDatePicker(false); }} onDismiss={() => setShowDatePicker(false)} />}

            <Text style={styles.label}>Costo estimado ($ opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 50.00"
              placeholderTextColor={Palette.textMuted}
              keyboardType="numeric"
              value={estimatedCost}
              onChangeText={(value) => setEstimatedCost(limitMoney(value))}
            />

            <Text style={styles.label}>Instrucciones o notas adicionales</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Pasos a seguir, especificación del repuesto o herramientas..."
              placeholderTextColor={Palette.textMuted}
              value={description}
              onChangeText={(value) => setDescription(limitText(value))}
              maxLength={MAX_TEXT_LENGTH}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.counter}>{description.length}/{MAX_TEXT_LENGTH}</Text>

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.switchTitle}>Recordatorio local</Text>
                <Text style={styles.switchSubtitle}>
                  Notificación automática en Android a las 9:00 AM el día que venza.
                </Text>
              </View>
              <Switch
                value={enableReminder}
                onValueChange={setEnableReminder}
                thumbColor={enableReminder ? Palette.forest : '#E0E0E0'}
                trackColor={{ false: '#D1D5DB', true: Palette.sageLight }}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={saving}>
              <Check size={18} color={Palette.white} />
              <Text style={styles.saveBtnText}>
                {saving ? 'Guardando...' : taskToEdit ? 'Actualizar' : 'Crear Tarea'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  errorText: {
    color: Palette.danger,
    fontSize: 13,
    marginBottom: 8,
  },
  counter: { color: Palette.textMuted, fontSize: 10, textAlign: 'right', marginTop: 2 },
  scroll: {
    marginVertical: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.charcoal,
    marginBottom: 6,
    marginTop: 12,
  },
  assetSelector: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  assetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginRight: 8,
  },
  assetChipSelected: {
    backgroundColor: Palette.sageLight,
    borderColor: Palette.forest,
  },
  assetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  assetChipTextSelected: {
    color: Palette.forest,
  },
  input: {
    backgroundColor: Palette.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Palette.charcoal,
  },
  inputError: { borderColor: Palette.danger },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  freqContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freqInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 10,
  },
  freqPrefix: {
    fontSize: 13,
    color: Palette.textMuted,
    marginRight: 6,
  },
  freqInput: {
    width: 44,
    height: 42,
    fontSize: 15,
    fontWeight: '700',
    color: Palette.charcoal,
    textAlign: 'center',
  },
  unitButtonsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
  },
  unitBtnSelected: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  unitBtnTextSelected: {
    color: Palette.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.cream,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.charcoal,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0ED',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Palette.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.forest,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  saveBtnText: {
    color: Palette.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

