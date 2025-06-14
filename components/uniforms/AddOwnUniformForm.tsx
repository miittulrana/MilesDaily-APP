import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormInput from '../FormInput';
import LoadingIndicator from '../LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { UniformType, UniformSize, CreateSelfReportData } from '../../utils/uniformTypes';
import { useUniformTypes, useUniformSizes } from '../../lib/hooks/useUniforms';

interface AddOwnUniformFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reportData: CreateSelfReportData) => Promise<void>;
}

export default function AddOwnUniformForm({ visible, onClose, onSubmit }: AddOwnUniformFormProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { types } = useUniformTypes();
  const { sizes } = useUniformSizes(selectedTypeId);

  const conditionOptions = [
    { key: 'new', label: 'New' },
    { key: 'good', label: 'Good' },
    { key: 'worn', label: 'Worn' },
    { key: 'damaged', label: 'Damaged' }
  ];

  const handleSubmit = async () => {
    if (!selectedTypeId || !selectedSizeId) {
      Alert.alert('Selection Required', 'Please select both uniform type and size');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      
      const reportData: CreateSelfReportData = {
        uniform_type_id: selectedTypeId,
        uniform_size_id: selectedSizeId,
        quantity_owned: quantityNum,
        condition,
        notes: notes.trim() || undefined
      };

      await onSubmit(reportData);
      
      setSelectedTypeId('');
      setSelectedSizeId('');
      setQuantity('1');
      setCondition('good');
      setNotes('');
      onClose();
    } catch (error) {
      Alert.alert(
        'Failed to Add Uniform', 
        error instanceof Error ? error.message : 'Failed to add uniform'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTypeId('');
    setSelectedSizeId('');
    setQuantity('1');
    setCondition('good');
    setNotes('');
    onClose();
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
    setSelectedSizeId('');
  };

  const selectedType = types.find(type => type.id === selectedTypeId);
  const availableSizes = sizes.filter(size => {
    if (!selectedType) return false;
    
    if (selectedType.name === 'Trousers') {
      return size.size_type === 'trouser';
    }
    return size.size_type === 'clothing';
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Items I Have</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Self-Report Your Uniforms</Text>
            <Text style={styles.infoText}>
              Add uniform items you currently have so we can track your complete inventory.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Select Uniform Type</Text>
          <View style={styles.optionsContainer}>
            {types.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.optionButton,
                  selectedTypeId === type.id && styles.optionButtonSelected
                ]}
                onPress={() => handleTypeChange(type.id)}
              >
                <Text style={[
                  styles.optionButtonText,
                  selectedTypeId === type.id && styles.optionButtonTextSelected
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedTypeId && (
            <>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.optionsContainer}>
                {availableSizes.length === 0 ? (
                  <Text style={styles.noSizesText}>
                    No sizes available for this uniform type
                  </Text>
                ) : (
                  availableSizes.map(size => (
                    <TouchableOpacity
                      key={size.id}
                      style={[
                        styles.optionButton,
                        selectedSizeId === size.id && styles.optionButtonSelected
                      ]}
                      onPress={() => setSelectedSizeId(size.id)}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        selectedSizeId === size.id && styles.optionButtonTextSelected
                      ]}>
                        {size.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          )}

          {selectedTypeId && selectedSizeId && (
            <>
              <FormInput
                label="Quantity"
                placeholder="How many do you have?"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                required
              />

              <Text style={styles.sectionTitle}>Condition</Text>
              <View style={styles.conditionContainer}>
                {conditionOptions.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.conditionButton,
                      condition === option.key && styles.conditionButtonSelected
                    ]}
                    onPress={() => setCondition(option.key)}
                  >
                    <Text style={[
                      styles.conditionButtonText,
                      condition === option.key && styles.conditionButtonTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FormInput
                label="Notes (Optional)"
                placeholder="Any additional information..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                containerStyle={{ marginBottom: layouts.spacing.xl }}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedTypeId || !selectedSizeId) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading || !selectedTypeId || !selectedSizeId}
          >
            {loading ? (
              <LoadingIndicator size="small" color={colors.background} message="" />
            ) : (
              <Text style={styles.submitButtonText}>Add to My Inventory</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: layouts.spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
    marginTop: layouts.spacing.lg,
  },
  optionsContainer: {
    marginBottom: layouts.spacing.md,
    gap: layouts.spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  optionButtonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  noSizesText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: layouts.spacing.sm,
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layouts.spacing.sm,
    marginBottom: layouts.spacing.md,
  },
  conditionButton: {
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.md,
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  conditionButtonSelected: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  conditionButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  conditionButtonTextSelected: {
    color: colors.success,
    fontWeight: '600',
  },
  footer: {
    padding: layouts.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: layouts.borderRadius.lg,
    paddingVertical: layouts.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});