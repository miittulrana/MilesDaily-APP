import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormInput from '../FormInput';
import LoadingIndicator from '../LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { TempAssignment } from '../../utils/tempAssignmentTypes';
import { requestExtension } from '../../lib/tempAssignmentService';

interface ExtensionModalProps {
  visible: boolean;
  assignment: TempAssignment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExtensionModal({
  visible,
  assignment,
  onClose,
  onSuccess,
}: ExtensionModalProps) {
  const [reason, setReason] = useState('');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for the extension');
      return;
    }

    if (!hours || parseInt(hours) < 0 || parseInt(minutes) < 0) {
      Alert.alert('Invalid', 'Please enter valid hours and minutes');
      return;
    }

    if (parseInt(hours) === 0 && parseInt(minutes) === 0) {
      Alert.alert('Invalid', 'Extension time must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      const currentEndTime = new Date(assignment.end_datetime);
      const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
      const newEndTime = new Date(currentEndTime.getTime() + totalMinutes * 60 * 1000);

      await requestExtension({
        assignment_id: assignment.id,
        new_end_datetime: newEndTime.toISOString(),
        reason: reason.trim(),
        extended_by_driver: true,
      });

      Alert.alert(
        'Extension Requested',
        'Your extension request has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              handleClose();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to request extension. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setHours('1');
    setMinutes('0');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Request Extension</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.assignmentInfo}>
            <Text style={styles.vehiclePlate}>
              {assignment.vehicle?.license_plate}
            </Text>
            <Text style={styles.vehicleDetails}>
              {assignment.vehicle?.brand} {assignment.vehicle?.model}
            </Text>
            <Text style={styles.currentEnd}>
              Current End: {new Date(assignment.end_datetime).toLocaleString()}
            </Text>
          </View>

          <View style={styles.timeInputRow}>
            <View style={styles.timeInputContainer}>
              <FormInput
                label="Hours"
                placeholder="0"
                value={hours}
                onChangeText={setHours}
                keyboardType="numeric"
                required
              />
            </View>
            <View style={styles.timeInputContainer}>
              <FormInput
                label="Minutes"
                placeholder="0"
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="numeric"
                required
              />
            </View>
          </View>

          <FormInput
            label="Reason for Extension"
            placeholder="Please explain why you need more time..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            required
          />

          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>New End Time:</Text>
            <Text style={styles.previewTime}>
              {(hours && minutes && (parseInt(hours) > 0 || parseInt(minutes) > 0))
                ? new Date(
                    new Date(assignment.end_datetime).getTime() +
                      (parseInt(hours) * 60 + parseInt(minutes)) * 60 * 1000
                  ).toLocaleString()
                : 'Enter valid time'}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!reason.trim() || !hours || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!reason.trim() || (!hours && !minutes) || submitting}
          >
            {submitting ? (
              <LoadingIndicator size="small" color={colors.background} message="" />
            ) : (
              <>
                <Ionicons name="time" size={16} color={colors.background} />
                <Text style={styles.submitButtonText}>Request Extension</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingTop: 50,
  },
  closeButton: {
    padding: layouts.spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: layouts.spacing.lg,
  },
  assignmentInfo: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  vehiclePlate: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  vehicleDetails: {
    fontSize: 14,
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  currentEnd: {
    fontSize: 14,
    color: colors.textLight,
  },
  previewContainer: {
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    marginTop: layouts.spacing.md,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  previewTime: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: layouts.spacing.md,
  },
  timeInputContainer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: layouts.spacing.md,
    padding: layouts.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray100,
    paddingVertical: 14,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});