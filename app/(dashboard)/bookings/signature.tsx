import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { updateBooking } from '../../../lib/bizhandleApi';
import { savePOD } from '../../../lib/podStorage';
import { getAuthUser } from '../../../lib/supabase';
import { compressImage, CompressedImage } from '../../../lib/imageCompression';
import LoadingIndicator from '../../../components/LoadingIndicator';
import {
  DELIVERED_STATUS_ID,
  PICKED_UP_STATUS_ID,
  STATUS_NAMES,
} from '../../../lib/statusPermissions';

type Step = 'info' | 'photos' | 'signature';

export default function SignatureScreen_() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const signatureRef = useRef<SignatureViewRef>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CompressedImage[]>([]);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [capturing, setCapturing] = useState(false);

  const bookingId = params.booking_id as string;
  const bookingIds = params.booking_ids as string;
  const statusId = parseInt(params.status_id as string);
  const mode = params.mode as 'single' | 'bulk';
  const milesRef = params.miles_ref as string;
  const milesRefs = params.miles_refs as string;

  const isBulkMode = mode === 'bulk';
  const bookingIdList = isBulkMode ? bookingIds.split(',').map(id => parseInt(id)) : [parseInt(bookingId)];
  const milesRefList = isBulkMode ? milesRefs.split(',') : [milesRef];

  const statusName = STATUS_NAMES[statusId] || `Status ${statusId}`;
  const isDelivered = statusId === DELIVERED_STATUS_ID;
  const isPickedUp = statusId === PICKED_UP_STATUS_ID;

  const getStepTitle = () => {
    switch (step) {
      case 'info':
        return 'Customer Information';
      case 'photos':
        return 'Take Photos';
      case 'signature':
        return 'Customer Signature';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    if (isDelivered) {
      switch (step) {
        case 'info':
          return 'Enter the customer details who is receiving the parcel';
        case 'photos':
          return 'Take photos of the delivered parcel(s)';
        case 'signature':
          return 'Get customer signature to confirm delivery';
        default:
          return '';
      }
    } else if (isPickedUp) {
      switch (step) {
        case 'info':
          return 'Enter details of person handing over the parcel';
        case 'photos':
          return 'Take photos of the parcel(s) being picked up';
        case 'signature':
          return 'Get signature to confirm pickup';
        default:
          return '';
      }
    }
    return '';
  };

  const handleNextStep = () => {
    if (step === 'info') {
      if (!clientName.trim()) {
        Alert.alert('Required', 'Please enter the client name');
        return;
      }
      setStep('photos');
    } else if (step === 'photos') {
      if (photos.length === 0) {
        Alert.alert('Required', 'Please take at least one photo');
        return;
      }
      setStep('signature');
    }
  };

  const handlePrevStep = () => {
    if (step === 'photos') {
      setStep('info');
    } else if (step === 'signature') {
      setStep('photos');
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef || capturing || photos.length >= 5) return;

    try {
      setCapturing(true);
      const photoResult = await cameraRef.takePictureAsync({ quality: 0.8 });
      const compressed = await compressImage(photoResult.uri);
      setPhotos(prev => [...prev, compressed]);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSignatureOK = (sig: string) => {
    setSignature(sig);
  };

  const handleSignatureClear = () => {
    signatureRef.current?.clearSignature();
    setSignature(null);
  };

  const handleSignatureEmpty = () => {
    setSignature(null);
  };

  const handleComplete = async () => {
    if (!signature) {
      Alert.alert('Required', 'Please get the customer signature');
      return;
    }

    setLoading(true);

    try {
      const user = await getAuthUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        setLoading(false);
        return;
      }

      const now = new Date();
      const delivered_date = now.toISOString().split('T')[0];
      const delivered_time = now.toTimeString().split(' ')[0];

      let successCount = 0;
      let failedBookings: string[] = [];

      for (let i = 0; i < bookingIdList.length; i++) {
        const currentBookingId = bookingIdList[i];
        const currentMilesRef = milesRefList[i];

        try {
          const podResult = await savePOD({
            booking_id: currentBookingId,
            miles_ref: currentMilesRef,
            photos: photos,
            client_name: clientName,
            id_card: idCard,
            signature_base64: signature,
            delivered_date,
            delivered_time,
            captured_by: user.id,
            status_id: statusId,
          });

          if (!podResult.success) {
            console.error(`POD save failed for ${currentMilesRef}:`, podResult.error);
          }

          const updateResult = await updateBooking({
            booking_id: currentBookingId,
            status_id: statusId,
            delivered_date,
            delivered_time,
            client_name: clientName,
            id_card: idCard,
            signature: signature,
          });

          if (updateResult.success) {
            successCount++;
          } else {
            failedBookings.push(currentMilesRef);
          }
        } catch (error) {
          console.error(`Error processing ${currentMilesRef}:`, error);
          failedBookings.push(currentMilesRef);
        }
      }

      setLoading(false);

      if (failedBookings.length === 0) {
        const message = isBulkMode
          ? `All ${successCount} bookings updated successfully`
          : 'Booking updated successfully';

        Alert.alert('Success', message, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert(
          'Partial Success',
          `${successCount} updated. Failed: ${failedBookings.join(', ')}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Complete error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to complete the process');
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Saving..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{statusName}</Text>
          <Text style={styles.headerSubtitle}>
            {isBulkMode ? `${bookingIdList.length} bookings` : milesRef}
          </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressSteps}>
          {['info', 'photos', 'signature'].map((s, index) => (
            <View key={s} style={styles.progressStepWrapper}>
              <View
                style={[
                  styles.progressStep,
                  step === s && styles.progressStepActive,
                  (['info', 'photos', 'signature'].indexOf(step) > index) && styles.progressStepCompleted,
                ]}
              >
                {(['info', 'photos', 'signature'].indexOf(step) > index) ? (
                  <Ionicons name="checkmark" size={16} color={colors.background} />
                ) : (
                  <Text style={[
                    styles.progressStepText,
                    step === s && styles.progressStepTextActive,
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              {index < 2 && (
                <View
                  style={[
                    styles.progressLine,
                    (['info', 'photos', 'signature'].indexOf(step) > index) && styles.progressLineCompleted,
                  ]}
                />
              )}
            </View>
          ))}
        </View>
        <Text style={styles.stepTitle}>{getStepTitle()}</Text>
        <Text style={styles.stepDescription}>{getStepDescription()}</Text>
      </View>

      {step === 'info' && (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Client Name *</Text>
            <TextInput
              style={styles.formInput}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Enter client name"
              placeholderTextColor={colors.gray400}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>ID Card (Optional)</Text>
            <TextInput
              style={styles.formInput}
              value={idCard}
              onChangeText={setIdCard}
              placeholder="Enter ID card number"
              placeholderTextColor={colors.gray400}
              autoCapitalize="characters"
            />
          </View>

          {isBulkMode && (
            <View style={styles.bulkInfoBox}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.bulkInfoText}>
                This information will be applied to all {bookingIdList.length} bookings
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextStep}
          >
            <Text style={styles.nextButtonText}>Next: Take Photos</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 'photos' && (
        <View style={styles.photoStepContainer}>
          {!permission?.granted ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="camera-outline" size={64} color={colors.gray400} />
              <Text style={styles.permissionText}>Camera permission required</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  ref={(ref) => setCameraRef(ref)}
                />
                <View style={styles.cameraOverlay}>
                  <View style={styles.photoCountBadge}>
                    <Text style={styles.photoCountText}>{photos.length} / 5</Text>
                  </View>
                </View>
              </View>

              {photos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photoThumbnails}
                  contentContainerStyle={styles.photoThumbnailsContent}
                >
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.thumbnailWrapper}>
                      <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                      <TouchableOpacity
                        style={styles.thumbnailRemove}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.photoControls}>
                <TouchableOpacity
                  style={styles.backStepButton}
                  onPress={handlePrevStep}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.text} />
                  <Text style={styles.backStepButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    (capturing || photos.length >= 5) && styles.captureButtonDisabled,
                  ]}
                  onPress={handleTakePhoto}
                  disabled={capturing || photos.length >= 5}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.nextStepButton,
                    photos.length === 0 && styles.nextStepButtonDisabled,
                  ]}
                  onPress={handleNextStep}
                  disabled={photos.length === 0}
                >
                  <Text style={styles.nextStepButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.background} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {step === 'signature' && (
        <View style={styles.signatureStepContainer}>
          <View style={styles.signatureContainer}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSignatureOK}
              onEmpty={handleSignatureEmpty}
              onClear={handleSignatureClear}
              autoClear={false}
              descriptionText=""
              clearText="Clear"
              confirmText="Confirm"
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: none;
                  margin: 0;
                  width: 100%;
                  height: 100%;
                }
                .m-signature-pad--body {
                  border: 2px dashed ${colors.gray300};
                  border-radius: 12px;
                }
                .m-signature-pad--footer {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px;
                }
                .m-signature-pad--footer .button {
                  background-color: ${colors.primary};
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 8px;
                  font-size: 14px;
                  font-weight: 600;
                }
                .m-signature-pad--footer .button.clear {
                  background-color: ${colors.gray300};
                  color: ${colors.text};
                }
              `}
            />
          </View>

          <View style={styles.signatureFooter}>
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={handlePrevStep}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
              <Text style={styles.backStepButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.completeButton,
                !signature && styles.completeButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={!signature}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.background} />
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
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
    paddingHorizontal: layouts.spacing.md,
    paddingVertical: layouts.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
  },
  headerPlaceholder: {
    width: 40,
  },
  progressContainer: {
    padding: layouts.spacing.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  progressStepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressStepCompleted: {
    backgroundColor: colors.success,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  progressStepTextActive: {
    color: colors.background,
  },
  progressLine: {
    width: 40,
    height: 3,
    backgroundColor: colors.gray300,
    marginHorizontal: layouts.spacing.xs,
  },
  progressLineCompleted: {
    backgroundColor: colors.success,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: layouts.spacing.lg,
  },
  formGroup: {
    marginBottom: layouts.spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  bulkInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.lg,
    gap: layouts.spacing.sm,
  },
  bulkInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: layouts.spacing.sm,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  photoStepContainer: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layouts.spacing.xl,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text,
    marginTop: layouts.spacing.lg,
    marginBottom: layouts.spacing.xl,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.xl,
    borderRadius: layouts.borderRadius.md,
  },
  permissionButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: layouts.spacing.md,
    right: layouts.spacing.md,
  },
  photoCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: layouts.spacing.md,
    paddingVertical: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.full,
  },
  photoCountText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  photoThumbnails: {
    maxHeight: 80,
    backgroundColor: colors.gray100,
  },
  photoThumbnailsContent: {
    padding: layouts.spacing.sm,
    gap: layouts.spacing.sm,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: layouts.spacing.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: layouts.borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: 11,
  },
  photoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: layouts.spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    gap: layouts.spacing.xs,
  },
  backStepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureButtonDisabled: {
    borderColor: colors.gray400,
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  nextStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    gap: layouts.spacing.xs,
  },
  nextStepButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  nextStepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  signatureStepContainer: {
    flex: 1,
  },
  signatureContainer: {
    flex: 1,
    padding: layouts.spacing.md,
  },
  signatureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: layouts.spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.xl,
    borderRadius: layouts.borderRadius.md,
    gap: layouts.spacing.sm,
  },
  completeButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});