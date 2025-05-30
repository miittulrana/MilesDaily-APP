import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormInput from '../FormInput';
import LoadingIndicator from '../LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverUniformAllocation, CreateReturnData } from '../../utils/uniformTypes';

interface ReturnFormProps {
  visible: boolean;
  allocation: DriverUniformAllocation | null;
  onClose: () => void;
  onSubmit: (returnData: CreateReturnData) => Promise<void>;
}

export default function ReturnForm({ visible, allocation, onClose, onSubmit }: ReturnFormProps) {
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!allocation) return;

    const quantityNum = parseInt(quantity);
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    if (quantityNum > allocation.quantity_allocated) {
      Alert.alert(
        'Quantity Too High', 
        `You can only return up to ${allocation.quantity_allocated} items`
      );
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for the return');
      return;
    }

    try {
      setLoading(true);
      
      const returnData: CreateReturnData = {
        uniform_type_id: allocation.uniform_type_id,
        uniform_size_id: allocation.uniform_size_id,
        quantity_to_return: quantityNum,
        reason: reason.trim()
      };

      await onSubmit(returnData);
      
      setQuantity('1');
      setReason('');
      onClose();
    } catch (error) {
      Alert.alert(
        'Return Request Failed', 
        error instanceof Error ? error.message : 'Failed to submit return request'
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

  if (!allocation) return null;

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
          <Text style={styles.title}>Return Uniform</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{allocation.uniform_type?.name}</Text>
            <Text style={styles.itemDetails}>
              Size: {allocation.uniform_size?.name}
            </Text>
            <Text style={styles.itemDescription}>
              You currently have {allocation.quantity_allocated} of these uniforms
            </Text>
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Return Process</Text>
            <Text style={styles.warningText}>
              • Admin approval is required for returns{'\n'}
              • Return the physical items when instructed{'\n'}
              • Provide a clear reason for the return
            </Text>
          </View>

          <FormInput
            label="Quantity to Return"
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            required
          />

          <FormInput
            label="Reason for Return"
            placeholder="Why are you returning this uniform?"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            required
            containerStyle={{ marginBottom: layouts.spacing.xl }}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!reason.trim()) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading ? (
              <LoadingIndicator size="small" color={colors.background} message="" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Return Request</Text>
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
  warningCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: layouts.spacing.sm,
  },
  warningText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    padding: layouts.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  submitButton: {
    backgroundColor: colors.warning,
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