import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { uploadAccidentImage, submitAccidentReport, getDriverVehicles } from '../../../lib/accidentService';
import { GENERAL_SUB_TYPES, getRequiredReportType } from '../../../utils/accidentTypes';

interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model?: string;
}

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const reportId = params.reportId as string;
  const form1Images = params.form1Images ? (params.form1Images as string).split(',').filter(Boolean) : [];
  const form2Images = params.form2Images ? (params.form2Images as string).split(',').filter(Boolean) : [];
  const accidentPhotos = params.accidentPhotos ? (params.accidentPhotos as string).split(',').filter(Boolean) : [];

  useEffect(() => {
    loadVehicleInfo();
    uploadImages();
  }, []);

  const loadVehicleInfo = async () => {
    try {
      const data = await getDriverVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const uploadImages = async () => {
    const allImages = [
      ...form1Images.map((uri, index) => ({ uri, type: 'form1' as const, order: index })),
      ...form2Images.map((uri, index) => ({ uri, type: 'form2' as const, order: index })),
      ...accidentPhotos.map((uri, index) => ({ uri, type: 'accident_photo' as const, order: index })),
    ];

    if (allImages.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress({ current: 0, total: allImages.length });

      for (let i = 0; i < allImages.length; i++) {
        const image = allImages[i];
        setUploadProgress({ current: i + 1, total: allImages.length });
        
        const result = await uploadAccidentImage(reportId, image.uri, image.type, image.order);
        if (!result.success) {
          throw new Error(result.error || 'Failed to upload image');
        }
      }
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload some images. Please try again.');
      console.error('Error uploading images:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (uploading) {
      Alert.alert('Please Wait', 'Images are still uploading. Please wait for completion.');
      return;
    }

    Alert.alert(
      'Submit Accident Report',
      'Are you sure you want to submit this accident report? You will not be able to make changes after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          style: 'default',
          onPress: performSubmit
        }
      ]
    );
  };

  const performSubmit = async () => {
    try {
      setSubmitting(true);
      
      const result = await submitAccidentReport(reportId);
      
      if (result.success) {
        Alert.alert(
          'Success! 🎉',
          'Your accident report has been submitted successfully. An admin will review it and contact you if needed.',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/(dashboard)/accident') 
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit accident report');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while submitting the report');
    } finally {
      setSubmitting(false);
    }
  };

  const getVehicleInfo = () => {
    return vehicles.find(v => v.id === params.vehicleId);
  };

  const getAccidentTypeDisplay = () => {
    const typeDisplay = params.type === 'front-to-rear' ? 'Front-to-Rear' : 'General';
    if (params.subType) {
      const subTypeData = GENERAL_SUB_TYPES.find(st => st.id === params.subType);
      return `${typeDisplay} (${subTypeData?.title || params.subType})`;
    }
    return typeDisplay;
  };

  const getTotalImages = () => {
    return form1Images.length + form2Images.length + accidentPhotos.length;
  };

  const formatDateTime = () => {
    const date = new Date(`${params.date}T${params.time}`);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getReportNumbers = () => {
    const numbers = [];
    if (params.policeReportNo) numbers.push(`Police: ${params.policeReportNo}`);
    if (params.lesaReportNo) numbers.push(`LESA: ${params.lesaReportNo}`);
    return numbers;
  };

  const vehicleInfo = getVehicleInfo();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Review & Submit</Text>
          <Text style={styles.description}>
            Please review all information before submitting your accident report
          </Text>
        </View>

        {uploading && (
          <View style={styles.uploadingBanner}>
            <View style={styles.uploadingContent}>
              <LoadingIndicator size="small" color={colors.primary} message="" />
              <Text style={styles.uploadingText}>
                Uploading images ({uploadProgress.current}/{uploadProgress.total})
              </Text>
            </View>
          </View>
        )}

        <View style={styles.reviewContent}>
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>📋 Report Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Report ID:</Text>
                <Text style={styles.summaryValue}>#{reportId.slice(0, 8).toUpperCase()}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Ready to Submit</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>🚗 Vehicle Information</Text>
            <View style={styles.infoCard}>
              {vehicleInfo ? (
                <Text style={styles.infoText}>
                  {vehicleInfo.license_plate} - {vehicleInfo.brand} {vehicleInfo.model}
                </Text>
              ) : (
                <Text style={styles.infoText}>Loading vehicle information...</Text>
              )}
            </View>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>⚠️ Accident Details</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoText}>{getAccidentTypeDisplay()}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date & Time:</Text>
                <Text style={styles.infoText}>{formatDateTime()}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoText}>{params.location}</Text>
              </View>
            </View>
          </View>

          {getReportNumbers().length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>📄 Report Numbers</Text>
              <View style={styles.infoCard}>
                {getReportNumbers().map((reportNum, index) => (
                  <Text key={index} style={styles.infoText}>{reportNum}</Text>
                ))}
              </View>
            </View>
          )}

          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>📸 Uploaded Images</Text>
            <View style={styles.imagesCard}>
              <View style={styles.imagesSummary}>
                <Ionicons name="images-outline" size={24} color={colors.primary} />
                <Text style={styles.imagesSummaryText}>
                  {getTotalImages()} images uploaded
                </Text>
              </View>
              
              <View style={styles.imageBreakdown}>
                {form1Images.length > 0 && (
                  <Text style={styles.imageBreakdownItem}>• Form 1: {form1Images.length}</Text>
                )}
                {form2Images.length > 0 && (
                  <Text style={styles.imageBreakdownItem}>• Form 2: {form2Images.length}</Text>
                )}
                {accidentPhotos.length > 0 && (
                  <Text style={styles.imageBreakdownItem}>• Scene Photos: {accidentPhotos.length}</Text>
                )}
              </View>
              
              {getTotalImages() > 0 && (
                <View style={styles.imagePreview}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[...form1Images, ...form2Images, ...accidentPhotos].slice(0, 5).map((uri, index) => (
                      <Image key={index} source={{ uri }} style={styles.previewImage} />
                    ))}
                    {getTotalImages() > 5 && (
                      <View style={styles.moreImagesIndicator}>
                        <Text style={styles.moreImagesText}>+{getTotalImages() - 5}</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.submitNotice}>
            <Ionicons name="information-circle-outline" size={24} color={colors.warning} />
            <Text style={styles.submitNoticeText}>
              After submission, your report will be reviewed by an admin. You will be contacted if additional information is needed.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={submitting || uploading}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || uploading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={submitting || uploading}
        >
          {submitting ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="small" color={colors.background} message="" />
              <Text style={styles.loadingText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: layouts.spacing.lg,
    paddingBottom: layouts.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  uploadingBanner: {
    backgroundColor: colors.info + '15',
    borderWidth: 1,
    borderColor: colors.info + '30',
    margin: layouts.spacing.lg,
    marginTop: 0,
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
  },
  uploadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.info,
  },
  reviewContent: {
    padding: layouts.spacing.lg,
    paddingTop: 0,
  },
  reviewSection: {
    marginBottom: layouts.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingVertical: layouts.spacing.xs,
    paddingHorizontal: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: layouts.spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textLight,
    width: 100,
    flexShrink: 0,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  imagesCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  imagesSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
    marginBottom: layouts.spacing.md,
  },
  imagesSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  imageBreakdown: {
    marginBottom: layouts.spacing.md,
  },
  imageBreakdownItem: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  imagePreview: {
    marginTop: layouts.spacing.md,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: layouts.borderRadius.sm,
    marginRight: layouts.spacing.sm,
  },
  moreImagesIndicator: {
    width: 60,
    height: 60,
    borderRadius: layouts.borderRadius.sm,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  submitNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layouts.spacing.sm,
    backgroundColor: colors.warning + '15',
    padding: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  submitNoticeText: {
    fontSize: 14,
    color: colors.warning,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: layouts.spacing.lg,
    gap: layouts.spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  backButton: {
    flex: 1,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    flex: 2,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
});