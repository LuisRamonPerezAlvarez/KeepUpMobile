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
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { Asset, AssetCategory } from '@/types/models';
import { CategoryBadge } from '@/components/CategoryBadge';
import { getTodayDateString } from '@/utils/dateUtils';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { dateToString, limitText, validateText, isValidDateString, MAX_TEXT_LENGTH } from '@/utils/validation';

interface AssetModalProps {
  visible: boolean;
  assetToEdit?: Asset | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: AssetCategory;
    description?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    purchase_date?: string;
  }) => Promise<void>;
}

const CATEGORIES: { key: AssetCategory; label: string }[] = [
  { key: 'electronica', label: 'Electrónica' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'hogar', label: 'Hogar' },
  { key: 'herramientas', label: 'Herramientas' },
  { key: 'otras', label: 'Otras' },
];

export const AssetFormModal: React.FC<AssetModalProps> = ({
  visible,
  assetToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('transporte');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  React.useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name);
      setCategory(assetToEdit.category);
      setDescription(assetToEdit.description || '');
      setBrand(assetToEdit.brand || '');
      setModel(assetToEdit.model || '');
      setSerialNumber('');
      setPurchaseDate(assetToEdit.purchase_date || '');
    } else {
      setName('');
      setCategory('transporte');
      setDescription('');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setPurchaseDate(getTodayDateString());
    }
    setError(null);
  }, [assetToEdit, visible]);

  const handleSubmit = async () => {
    const nameError = validateText(name, 'El nombre del objeto', true);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (purchaseDate && !isValidDateString(purchaseDate)) { setError('La fecha de compra no es válida'); return; }
    try {
      setSaving(true);
      await onSave({
        name: name.trim(),
        category,
        description: limitText(description).trim() || undefined,
        brand: limitText(brand).trim() || undefined,
        model: limitText(model).trim() || undefined,
        serial_number: limitText(serialNumber).trim() || undefined,
        purchase_date: purchaseDate || undefined,
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
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
              {assetToEdit ? 'Editar Objeto' : 'Nuevo Objeto'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={Palette.textMuted} />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre del objeto *</Text>
            <TextInput
              style={[styles.input, error && !name.trim() && styles.inputError]}
              placeholder="Ej. MacBook Pro, Bicicleta Trek, Nevera LG"
              placeholderTextColor={Palette.textMuted}
              value={name}
              onChangeText={(value) => { setError(null); setName(limitText(value)); }}
              maxLength={MAX_TEXT_LENGTH}
            />
            <Text style={styles.counter}>{name.length}/{MAX_TEXT_LENGTH}</Text>

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryOption,
                      isSelected && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setCategory(cat.key)}>
                    <CategoryBadge category={cat.key} size="small" showLabel={false} />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextSelected,
                      ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Marca (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Apple, Toyota"
                  placeholderTextColor={Palette.textMuted}
                  value={brand}
                  onChangeText={(value) => setBrand(limitText(value))}
                  maxLength={MAX_TEXT_LENGTH}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Modelo (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. M2 14'', Corolla"
                  placeholderTextColor={Palette.textMuted}
                  value={model}
                  onChangeText={(value) => setModel(limitText(value))}
                  maxLength={MAX_TEXT_LENGTH}
                />
              </View>
            </View>

            <Text style={styles.label}>Número de serie o placa (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. SN-89218204"
              placeholderTextColor={Palette.textMuted}
              value={serialNumber}
              onChangeText={(value) => setSerialNumber(limitText(value))}
              maxLength={MAX_TEXT_LENGTH}
            />

            <Text style={styles.label}>Fecha de compra</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: purchaseDate ? Palette.charcoal : Palette.textMuted }}>{purchaseDate || 'Seleccionar fecha'}</Text>
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker value={purchaseDate ? new Date(`${purchaseDate}T12:00:00`) : new Date()} mode="date" presentation="dialog" onValueChange={(_, date) => { if (date) setPurchaseDate(dateToString(date)); setShowDatePicker(false); }} onDismiss={() => setShowDatePicker(false)} />}

            <Text style={styles.label}>Descripción o notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ubicación, especificaciones, detalles importantes..."
              placeholderTextColor={Palette.textMuted}
              value={description}
              onChangeText={(value) => setDescription(limitText(value))}
              maxLength={MAX_TEXT_LENGTH}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.counter}>{description.length}/{MAX_TEXT_LENGTH}</Text>
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
                {saving ? 'Guardando...' : assetToEdit ? 'Actualizar' : 'Guardar'}
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
    maxHeight: '90%',
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
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  categoryOptionSelected: {
    backgroundColor: Palette.sageLight,
    borderColor: Palette.forest,
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  categoryOptionTextSelected: {
    color: Palette.forest,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
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

