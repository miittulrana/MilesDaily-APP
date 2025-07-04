import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LoadingIndicator from '../LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { UniformType, UniformSize, CreatePreferenceData } from '../../utils/uniformTypes';

interface PreferenceSelectorProps {
  visible: boolean;
  uniformTypes: UniformType[];
  uniformSizes: UniformSize[];
  onClose: () => void;
  onSubmit: (preferenceData: CreatePreferenceData) => Promise<void>;
  onTypeChange: (typeId: string) => void;
  selectedTypeId?: string;
}

export default function PreferenceSelector({
  visible,
  uniformTypes,
  uniformSizes,
  onClose,
  onSubmit,
  onTypeChange,
  selectedTypeId
}: PreferenceSelectorProps) {
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedTypeId || !selectedSizeId) {
      Alert.alert('Selection Required', 'Please select both uniform type and size');
      return;
    }

    try {
      setLoading(true);
      
      const preferenceData: CreatePreferenceData = {
        uniform_type_id: selectedTypeId,
        uniform_size_id: selectedSizeId
      };

      await onSubmit(preferenceData);
      
      setSelectedSizeId('');
      onClose();
    } catch (error) {
      Alert.alert(
        'Failed to Save Preference', 
        error instanceof Error ? error.message : 'Failed to save preference'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSizeId('');
    onClose();
  };

  const handleTypeChange = (typeId: string) => {
    onTypeChange(typeId);
    setSelectedSizeId('');
  };

  const selectedType = uniformTypes.find(type => type.id === selectedTypeId);
  const availableSizes = uniformSizes.filter(size => {
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
          <Text style={styles.title}>Set Size Preference</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Select Uniform Type</Text>
          <View style={styles.optionsContainer}>
            {uniformTypes.map(type => (
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

          {selectedType && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{selectedType.name}</Text>
              {selectedType.description && (
                <Text style={styles.infoDescription}>{selectedType.description}</Text>
              )}
              <Text style={styles.infoCategory}>Category: {selectedType.category}</Text>
            </View>
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
              <Text style={styles.submitButtonText}>Save Preference</Text>
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
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginTop: layouts.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  infoCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
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