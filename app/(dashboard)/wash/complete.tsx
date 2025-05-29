import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image
} from 'react-native';
import FormInput from '../../../components/FormInput';
import LoadingIndicator from '../../../components/LoadingIndicator';
import CameraCapture from '../../../components/wash/CameraCapture';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { completeWashByDriver, getWashScheduleById } from '../../../lib/washService';
import { DriverInfo, WashSchedule } from '../../../utils/types';

export default function CompleteWashScreen() {
  const router = useRouter();
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [schedule, setSchedule] = useState<WashSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const driverData = await getDriverInfo();
        setDriver(driverData);
        
        if (scheduleId) {
          const scheduleData = await getWashScheduleById(scheduleId);
          setSchedule(scheduleData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load wash schedule');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [scheduleId]);

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

    if (!driver?.id || !schedule?.id) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    try {
      setSubmitting(true);
      
      const success = await completeWashByDriver({
        schedule_id: schedule.id,
        image_uri: capturedImage,
        notes: notes.trim() || undefined
      });

      if (success) {
        Alert.alert(
          'Success',
          'Wash completed successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(dashboard)/wash')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to complete wash. Please try again.');
      }
    } catch (error) {
      console.error('Error completing wash:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading..." />;
  }

  if (!driver || !schedule) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Unable to load wash schedule</Text>
      </View>
    );
  }

  if (showCamera) {
    return (
      <CameraCapture
        onPhotoTaken={handlePhotoTaken}
        onCancel={handleCameraCancel}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleCardTitle}>Wash Schedule</Text>
          <Text style={styles.scheduledDate}>
            Date: {new Date(schedule.scheduled_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.vehicleInfo}>
            Vehicle: {schedule.vehicle?.license_plate} - {schedule.vehicle?.brand} {schedule.vehicle?.model}
          </Text>
        </View>

        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Wash Photo *</Text>
          <Text style={styles.sectionDescription}>
            Take a photo of the cleaned vehicle to complete the wash
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

        <View style={styles.formContainer}>
          <FormInput
            label="Notes (Optional)"
            placeholder="Add any additional notes about the wash..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
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
              <Text style={styles.submitButtonText}>Complete Wash</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: layouts.spacing.lg,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  scheduleCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  scheduleCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: layouts.spacing.sm,
  },
  scheduledDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  vehicleInfo: {
    fontSize: 14,
    color: colors.text,
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
  },
  cameraButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: layouts.spacing.lg,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layouts.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray100,
    paddingVertical: 12,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'center',
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