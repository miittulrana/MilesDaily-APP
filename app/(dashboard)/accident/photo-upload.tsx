import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PhotoCapture from '../../../components/accident/PhotoCapture';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { createAccidentReport } from '../../../lib/accidentService';

export default function PhotoUploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [form1Images, setForm1Images] = useState<string[]>([]);
  const [form2Images, setForm2Images] = useState<string[]>([]);
  const [accidentPhotos, setAccidentPhotos] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const handleContinue = async () => {
    if (form1Images.length === 0 && form2Images.length === 0) {
      Alert.alert('Error', 'Please upload at least one accident form');
      return;
    }

    try {
      setCreating(true);
      
      const accidentData = {
        vehicle_id: params.vehicleId as string,
        accident_type: params.type as any,
        general_sub_type: params.subType as any,
        location_address: params.location as string,
        location_latitude: params.locationLat ? parseFloat(params.locationLat as string) : undefined,
        location_longitude: params.locationLng ? parseFloat(params.locationLng as string) : undefined,
        accident_date: params.date as string,
        accident_time: params.time as string,
        lesa_report_no: params.lesaReportNo as string,
        police_report_no: params.policeReportNo as string,
      };

      const result = await createAccidentReport(accidentData);
      
      if (result.success && result.reportId) {
        const reviewData = {
          ...params,
          reportId: result.reportId,
          form1Images: form1Images.join(','),
          form2Images: form2Images.join(','),
          accidentPhotos: accidentPhotos.join(','),
        };

        router.push({
          pathname: '/(dashboard)/accident/review',
          params: reviewData
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to create accident report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create accident report');
    } finally {
      setCreating(false);
    }
  };

  const getAccidentTypeDisplay = () => {
    const typeDisplay = params.type === 'front-to-rear' ? 'Front-to-Rear' : 'General';
    if (params.subType) {
      return `${typeDisplay} (${(params.subType as string).toUpperCase()})`;
    }
    return typeDisplay;
  };

  const getTotalImages = () => {
    return form1Images.length + form2Images.length + accidentPhotos.length;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Photos</Text>
          <Text style={styles.description}>
            Upload clear photos of accident forms and the accident scene
          </Text>
          <View style={styles.typeDisplay}>
            <Text style={styles.typeText}>Type: {getAccidentTypeDisplay()}</Text>
          </View>
        </View>

        <View style={styles.uploadSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {getTotalImages()} images uploaded
            </Text>
            <View style={styles.progressIndicator}>
              <Ionicons 
                name={getTotalImages() > 0 ? "checkmark-circle" : "camera-outline"} 
                size={20} 
                color={getTotalImages() > 0 ? colors.success : colors.gray400} 
              />
            </View>
          </View>

          <PhotoCapture
            imageType="form1"
            title="Accident Form 1"
            description="Upload the first accident form document"
            maxImages={1}
            images={form1Images}
            onImagesChange={setForm1Images}
          />

          <PhotoCapture
            imageType="form2"
            title="Accident Form 2"
            description="Upload the second accident form document (if applicable)"
            maxImages={1}
            images={form2Images}
            onImagesChange={setForm2Images}
          />

          <PhotoCapture
            imageType="accident_photo"
            title="Accident Scene Photos"
            description="Upload clear photos showing vehicle damage and the accident scene"
            maxImages={10}
            images={accidentPhotos}
            onImagesChange={setAccidentPhotos}
          />

          <View style={styles.uploadTips}>
            <Text style={styles.tipsTitle}>📸 Photo Tips</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Take clear, well-lit photos</Text>
              <Text style={styles.tipItem}>• Include all vehicle damage</Text>
              <Text style={styles.tipItem}>• Show the overall accident scene</Text>
              <Text style={styles.tipItem}>• Capture license plates if visible</Text>
              <Text style={styles.tipItem}>• Forms should be fully visible and readable</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={creating}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            creating && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={creating}
        >
          {creating ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="small" color={colors.background} message="" />
              <Text style={styles.loadingText}>Creating Report...</Text>
            </View>
          ) : (
            <Text style={styles.continueButtonText}>Continue to Review</Text>
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
    marginBottom: layouts.spacing.md,
  },
  typeDisplay: {
    backgroundColor: colors.primary + '15',
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  uploadSection: {
    padding: layouts.spacing.lg,
    paddingTop: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
    padding: layouts.spacing.md,
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTips: {
    marginTop: layouts.spacing.xl,
    padding: layouts.spacing.lg,
    backgroundColor: colors.info + '10',
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.info,
    marginBottom: layouts.spacing.md,
  },
  tipsList: {
    gap: layouts.spacing.sm,
  },
  tipItem: {
    fontSize: 14,
    color: colors.info,
    lineHeight: 20,
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
  continueButton: {
    flex: 2,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
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