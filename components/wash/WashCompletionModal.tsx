import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import FormInput from '../FormInput';
import LoadingIndicator from '../LoadingIndicator';
import CameraCapture from './CameraCapture';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { WashSchedule } from '../../utils/types';

type WashCompletionModalProps = {
  visible: boolean;
  schedule: WashSchedule | null;
  vehicle: any;
  onClose: () => void;
  onComplete: (scheduleId: string, imageUri: string, notes?: string) => Promise<void>;
};

export default function WashCompletionModal({
  visible,
  schedule,
  vehicle,
  onClose,
  onComplete
}: WashCompletionModalProps) {
  const [notes, setNotes] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handlePhotoTaken = (imageUri: string) => {
    setCapturedImage(imageUri);
    setShowCamera(false);
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      Alert.alert('Required', 'Please take a photo of the washed vehicle');
      return;
    }

    if (!schedule?.id) {
      Alert.alert('Error', 'Schedule information is missing');
      return;
    }

    try {
      setSubmitting(true);
      await onComplete(schedule.id, capturedImage, notes.trim() || undefined);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete wash. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setCapturedImage(null);
    setShowCamera(false);
    onClose();
  };

  if (!schedule || !vehicle) return null;

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
          <Text style={styles.title}>Complete Wash</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {showCamera ? (
          <CameraCapture
            onPhotoTaken={handlePhotoTaken}
            onCancel={handleCameraCancel}
          />
        ) : (
          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.scheduleInfo}>
              <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
              <Text style={styles.vehicleDetails}>
                {vehicle.brand} {vehicle.model}
              </Text>
              <Text style={styles.scheduleDate}>
                Scheduled: {new Date(schedule.scheduled_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>

            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Wash Photo *</Text>
              <Text style={styles.sectionDescription}>
                Take a photo of the cleaned vehicle
              </Text>
              
              {capturedImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
                  <TouchableOpacity 
                    style={styles.retakeButton}
                    onPress={handleTakePhoto}
                  >
                    <Text style={styles.retakeButtonText}>Retake Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.cameraButton}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.cameraButtonText}>📷 Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <FormInput
              label="Notes (Optional)"
              placeholder="Add any notes about the wash..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.buttonContainer}>
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
                  !capturedImage && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={submitting || !capturedImage}
              >
                {submitting ? (
                  <LoadingIndicator size="small" color="#ffffff" message="" />
                ) : (
                  <Text style={styles.submitButtonText}>Complete</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: layouts.spacing.xs,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textLight,
  },
  content: {
    flex: 1,
    padding: layouts.spacing.lg,
  },
  scheduleInfo: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  vehicleDetails: {
    fontSize: 14,
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  scheduleDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  photoSection: {
    marginBottom: layouts.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.md,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.md,
  },
  retakeButton: {
    backgroundColor: colors.gray100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  retakeButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  cameraButton: {
    backgroundColor: colors.primary,
    paddingVertical: 40,
    borderRadius: layouts.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryDark,
    marginBottom: layouts.spacing.md,
  },
  cameraButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: layouts.spacing.md,
    marginTop: layouts.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray100,
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '500',
  },
});