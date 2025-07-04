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
  const [returnQuantity, setReturnQuantity] = useState('0');
  const [returnReason, setReturnReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!item) return;

    const quantityNum = parseInt(quantity);
    const returnQuantityNum = parseInt(returnQuantity);
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    if (returnQuantityNum < 0 || isNaN(returnQuantityNum)) {
      Alert.alert('Invalid Return Quantity', 'Please enter a valid return quantity');
      return;
    }

    if (returnQuantityNum > 0 && !returnReason.trim()) {
      Alert.alert('Return Reason Required', 'Please provide a reason for returning items');
      return;
    }

    const currentTotal = (item.driver_current_allocation || 0);
    const netChange = quantityNum - returnQuantityNum;
    
    if (currentTotal + netChange > (item.max_requestable || 0) + currentTotal) {
      const minReturnNeeded = (currentTotal + netChange) - item.maximum_limit_per_driver;
      Alert.alert(
        'Exceeds Limit', 
        `You need to return at least ${minReturnNeeded} items to stay within your limit of ${item.maximum_limit_per_driver}`
      );
      return;
    }

    try {
      setLoading(true);
      
      const requestData: CreateRequestData = {
        uniform_type_id: item.uniform_type_id,
        uniform_size_id: item.uniform_size_id,
        quantity_requested: quantityNum,
        request_reason: reason.trim() || undefined,
        return_quantity: returnQuantityNum,
        return_reason: returnQuantityNum > 0 ? returnReason.trim() : undefined
      };

      await onSubmit(requestData);
      
      setQuantity('1');
      setReason('');
      setReturnQuantity('0');
      setReturnReason('');
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
    setReturnQuantity('0');
    setReturnReason('');
    onClose();
  };

  if (!item) return null;

  const isAtLimit = (item.driver_current_allocation || 0) >= item.maximum_limit_per_driver;

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
              <Text style={styles.statusLabel}>You can request up to:</Text>
              <Text style={[styles.statusValue, { color: colors.primary }]}>
                {item.max_requestable}
              </Text>
            </View>
          </View>

          {isAtLimit && (
            <View style={styles.limitWarning}>
              <Text style={styles.limitWarningTitle}>At Maximum Limit</Text>
              <Text style={styles.limitWarningText}>
                You're at your maximum limit. To request more, you need to return some old items.
              </Text>
            </View>
          )}

          <FormInput
            label="Quantity Requesting"
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            required
          />

          <FormInput
            label="Request Reason (Optional)"
            placeholder="Why do you need this uniform?"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={2}
          />

          <View style={styles.returnSection}>
            <Text style={styles.returnSectionTitle}>Return Old Items (Optional)</Text>
            <Text style={styles.returnSectionDescription}>
              If you're at your limit, you can return old items to make room for new ones.
            </Text>
            
            <FormInput
              label="Quantity Returning"
              placeholder="How many are you returning?"
              value={returnQuantity}
              onChangeText={setReturnQuantity}
              keyboardType="numeric"
            />

            {parseInt(returnQuantity) > 0 && (
              <FormInput
                label="Return Reason"
                placeholder="Why are you returning these items?"
                value={returnReason}
                onChangeText={setReturnReason}
                multiline
                numberOfLines={2}
                required
              />
            )}
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current:</Text>
              <Text style={styles.summaryValue}>{item.driver_current_allocation}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Requesting:</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>+{quantity}</Text>
            </View>
            {parseInt(returnQuantity) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Returning:</Text>
                <Text style={[styles.summaryValue, { color: colors.warning }]}>-{returnQuantity}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabel}>Final Total:</Text>
              <Text style={styles.summaryValue}>
                {(item.driver_current_allocation || 0) + parseInt(quantity) - parseInt(returnQuantity)}
              </Text>
            </View>
          </View>
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
  limitWarning: {
    backgroundColor: colors.warning + '20',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  limitWarningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: layouts.spacing.xs,
  },
  limitWarningText: {
    fontSize: 14,
    color: colors.text,
  },
  returnSection: {
    backgroundColor: colors.info + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  returnSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.info,
    marginBottom: layouts.spacing.xs,
  },
  returnSectionDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: layouts.spacing.md,
  },
  summary: {
    backgroundColor: colors.primary + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: layouts.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.primary + '30',
    marginTop: layouts.spacing.sm,
    paddingTop: layouts.spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text,
  },
  summaryValue: {
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