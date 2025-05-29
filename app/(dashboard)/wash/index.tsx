import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, RefreshControl, ScrollView, Image, Alert } from 'react-native';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getTodayWashSchedule, WashScheduleResponse, completeWash } from '../../../lib/washService';
import { showImagePickerOptions, ImagePickerResult } from '../../../components/ImagePicker';

export default function WashScheduleScreen() {
  const [washData, setWashData] = useState<WashScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [completing, setCompleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWashSchedule = useCallback(async () => {
    try {
      setError(null);
      const data = await getTodayWashSchedule();
      setWashData(data);
    } catch (err) {
      console.error('Error fetching wash schedule:', err);
      setError('Failed to load wash schedule');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchWashSchedule();
    }, [fetchWashSchedule])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWashSchedule();
  };

  const handleCompleteWash = async () => {
    try {
      setCompleting(true);
      
      // Show image picker options
      const imageResult = await showImagePickerOptions();
      
      if (!imageResult) {
        setCompleting(false);
        return; // User canceled
      }
      
      setSelectedImage(imageResult);
      console.log('Image selected:', imageResult);
      
      // TODO: Upload image and complete wash
      // For now, just show the selected image
      
    } catch (error) {
      console.error('Error in handleCompleteWash:', error);
    } finally {
      setCompleting(false);
    }
  }; // <-- This closing brace was missing!

  const handleSubmitWash = async () => {
    if (!selectedImage || !todaySchedule) {
      return;
    }

    try {
      setSubmitting(true);
      
      const success = await completeWash(todaySchedule.id, selectedImage.uri);
      
      if (success) {
        // Clear selected image and refresh data
        setSelectedImage(null);
        await fetchWashSchedule();
      } else {
        Alert.alert('Error', 'Failed to complete wash. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting wash:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading wash schedule..." />;
  }

  const todaySchedule = washData?.schedules?.[0];
  const hasWashToday = washData?.has_wash_today || false;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Wash</Text>
        <Text style={styles.date}>Today: {washData?.date}</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Main Content */}
      {hasWashToday && todaySchedule ? (
        <View style={styles.washCard}>
          {/* Vehicle Info */}
          <View style={styles.vehicleInfo}>
            <Ionicons name="car-outline" size={24} color={colors.primary} />
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehiclePlate}>
                {todaySchedule.vehicle?.license_plate}
              </Text>
              <Text style={styles.vehicleModel}>
                {todaySchedule.vehicle?.brand} {todaySchedule.vehicle?.model}
              </Text>
            </View>
          </View>

          {/* Status */}
          <View style={styles.statusSection}>
            {todaySchedule.status === 'pending' ? (
              <>
                <View style={styles.statusBadge}>
                  <Ionicons name="time-outline" size={16} color={colors.warning} />
                  <Text style={styles.statusText}>Wash Scheduled</Text>
                </View>
                
                <Text style={styles.instructions}>
                  Your vehicle is scheduled for washing today. Please complete the wash and upload a photo.
                </Text>

                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={handleCompleteWash}
                  disabled={completing}
                >
                  {completing ? (
                    <LoadingIndicator size="small" color={colors.background} message="" />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={20} color={colors.background} />
                      <Text style={styles.completeButtonText}>Complete Wash</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {/* Show selected image preview */}
                {selectedImage && (
                  <View style={styles.imagePreview}>
                    <Text style={styles.imagePreviewTitle}>Selected Photo:</Text>
                    <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                    
                    <View style={styles.imageActions}>
                      <TouchableOpacity 
                        style={styles.changeImageButton}
                        onPress={() => setSelectedImage(null)}
                      >
                        <Text style={styles.changeImageText}>Change Photo</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={handleSubmitWash}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <LoadingIndicator size="small" color={colors.background} message="" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={20} color={colors.background} />
                            <Text style={styles.submitButtonText}>Complete Wash</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={[styles.statusBadge, styles.statusCompleted]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                  <Text style={[styles.statusText, styles.statusCompletedText]}>
                    Completed
                  </Text>
                </View>
                
                <Text style={styles.completedInfo}>
                  Wash completed at {new Date(todaySchedule.completed_at!).toLocaleTimeString()}
                </Text>
              </>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.noWashCard}>
          <Ionicons name="car-outline" size={64} color={colors.gray300} />
          <Text style={styles.noWashTitle}>No Wash Scheduled</Text>
          <Text style={styles.noWashMessage}>
            You don't have any vehicle wash scheduled for today.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  header: {
    marginBottom: layouts.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  date: {
    fontSize: 16,
    color: colors.textLight,
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  washCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
    paddingBottom: layouts.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  vehicleDetails: {
    marginLeft: layouts.spacing.md,
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  vehicleModel: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  statusSection: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: layouts.borderRadius.full,
    marginBottom: layouts.spacing.md,
  },
  statusCompleted: {
    backgroundColor: colors.success + '20',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 8,
  },
  statusCompletedText: {
    color: colors.success,
  },
  instructions: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: layouts.spacing.lg,
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: layouts.borderRadius.md,
    minWidth: 160,
  },
  completeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedInfo: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
  },
  noWashCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  noWashTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.md,
    marginBottom: layouts.spacing.sm,
  },
  noWashMessage: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  imagePreview: {
    marginTop: layouts.spacing.lg,
    alignItems: 'center',
  },
  imagePreviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.sm,
  },
  changeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: layouts.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changeImageText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  imageActions: {
    flexDirection: 'row',
    gap: layouts.spacing.md,
    marginTop: layouts.spacing.md,
  },
  submitButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: layouts.borderRadius.md,
    flex: 1,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});