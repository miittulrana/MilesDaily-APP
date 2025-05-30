import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormInput from '../FormInput';
import LoadingIndicator from '../LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { UniformInventoryItem, CreateRequestData } from '../../utils/uniformTypes';

interface RequestFormProps {
  visible: boolean;
  item: UniformInventoryItem | null;
  onClose: () => void;
  onSubmit: (requestData: CreateRequestData) => Promise<void>;
}

export default function RequestForm({ visible, item, onClose, onSubmit }: RequestFormProps) {
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!item) return;

    const quantityNum = parseInt(quantity);
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    if (quantityNum > (item.max_requestable || 0)) {
      Alert.alert(
        'Quantity Exceeds Limit', 
        `You can only request up to ${item.max_requestable} items`
      );
      return;
    }

    try {
      setLoading(true);
      
      const requestData: CreateRequestData = {
        uniform_type_id: item.uniform_type_id,
        uniform_size_id: item.uniform_size_id,
        quantity_requested: quantityNum,
        request_reason: reason.trim() || undefined
      };

      await onSubmit(requestData);
      
      setQuantity('1');
      setReason('');
      onClose();
    } catch (error) {
      Alert.alert(
        'Request Failed', 
        error instanceof Error ? error.message : 'Failed to submit request'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity('1');
    setReason('');
    onClose();
  };

  if (!item) return null;

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
          <Text style={styles.title}>Request Uniform</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.uniform_type?.name}</Text>
            <Text style={styles.itemDetails}>
              Size: {item.uniform_size?.name} • Category: {item.uniform_type?.category}
            </Text>
            <Text style={styles.itemDescription}>{item.uniform_type?.description}</Text>
          </View>

          <View style={styles.currentStatus}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>You currently have:</Text>
              <Text style={styles.statusValue}>
                {item.driver_current_allocation}/{item.maximum_limit_per_driver}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Available stock:</Text>
              <Text style={styles.statusValue}>{item.available_stock}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>You can request up to:</Text>
              <Text style={[styles.statusValue, { color: colors.primary }]}>
                {item.max_requestable}
              </Text>
            </View>
          </View>

          <FormInput
            label="Quantity"
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            required
          />

          <FormInput
            label="Reason (Optional)"
            placeholder="Why do you need this uniform?"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: layouts.spacing.xl }}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <LoadingIndicator size="small" color={colors.background} message="" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
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
  itemInfo: {
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  itemDetails: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.sm,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.text,
  },
  currentStatus: {
    marginBottom: layouts.spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xs,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});