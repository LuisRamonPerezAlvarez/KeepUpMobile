import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Check, X, Calendar, DollarSign, FileText } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { MaintenanceTaskWithAsset } from '@/types/models';
import { getTodayDateString } from '@/utils/dateUtils';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { dateToString, limitMoney, limitText, validateMoney, isValidDateString, MAX_TEXT_LENGTH } from '@/utils/validation';

interface CompleteModalProps {
  visible: boolean;
  task: MaintenanceTaskWithAsset | null;
  onClose: () => void;
  onConfirm: (data: { completed_date: string; notes?: string; cost?: number }) => Promise<void>;
}

export const CompleteTaskModal: React.FC<CompleteModalProps> = ({
  visible,
  task,
  onClose,
  onConfirm,
}) => {
  const [completedDate, setCompletedDate] = useState<string>(getTodayDateString());
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar costo sugerido si la tarea tiene costo estimado
  React.useEffect(() => {
    if (task) {
      setCompletedDate(getTodayDateString());
      setCost('');
      setNotes('');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    if (!isValidDateString(completedDate)) { setError('La fecha de realización no es válida'); return; }
    const costError = validateMoney(cost, 'El costo');
    if (costError) { setError(costError); return; }
    try {
      setSaving(true);
      await onConfirm({
        completed_date: completedDate || getTodayDateString(),
        cost: cost ? parseFloat(cost) : undefined,
        notes: limitText(notes).trim() || undefined,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Registrar Mantenimiento</Text>
              <Text style={styles.subtitle}>{task.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={Palette.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Text style={styles.inputLabel}>Fecha de realización (YYYY-MM-DD)</Text>
            <View style={styles.inputGroup}>
              <Calendar size={18} color={Palette.forest} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={completedDate}
                editable={false}
                onTouchStart={() => setShowDatePicker(true)}
                placeholder="Seleccionar fecha"
                placeholderTextColor={Palette.textMuted}
              />
            </View>
            {showDatePicker && <DateTimePicker value={new Date(`${completedDate}T12:00:00`)} mode="date" presentation="dialog" onValueChange={(_, date) => { if (date) setCompletedDate(dateToString(date)); setShowDatePicker(false); }} onDismiss={() => setShowDatePicker(false)} />}

            <Text style={styles.inputLabel}>Costo real (opcional)</Text>
            <View style={styles.inputGroup}>
              <DollarSign size={18} color={Palette.forest} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={cost}
                onChangeText={(value) => setCost(limitMoney(value))}
                placeholder="Ej. 45.00"
                keyboardType="numeric"
                placeholderTextColor={Palette.textMuted}
              />
            </View>

            <Text style={styles.inputLabel}>Notas o detalles del servicio (opcional)</Text>
            <View style={[styles.inputGroup, styles.textAreaGroup]}>
              <FileText size={18} color={Palette.forest} style={[styles.inputIcon, { marginTop: 10 }]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={(value) => setNotes(limitText(value))}
                maxLength={MAX_TEXT_LENGTH}
                placeholder="Taller utilizado, piezas reemplazadas, observaciones..."
                multiline
                numberOfLines={3}
                placeholderTextColor={Palette.textMuted}
              />
            <Text style={styles.counter}>{notes.length}/{MAX_TEXT_LENGTH}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}>
              <Check size={18} color={Palette.white} />
              <Text style={styles.saveBtnText}>
                {saving ? 'Guardando...' : 'Completar y Reprogramar'}
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
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.forest,
    fontWeight: '600',
    marginTop: 2,
  },
  body: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.charcoal,
    marginBottom: 6,
    marginTop: 10,
  },
  errorText: { color: Palette.danger, fontSize: 12, marginBottom: 6 },
  counter: { color: Palette.textMuted, fontSize: 10, textAlign: 'right', marginTop: 2 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 12,
  },
  textAreaGroup: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Palette.charcoal,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  saveBtnText: {
    color: Palette.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

