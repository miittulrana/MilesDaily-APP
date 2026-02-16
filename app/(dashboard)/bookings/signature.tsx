import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { updateBooking } from '../../../lib/bizhandleApi';
import { savePOD } from '../../../lib/podStorage';
import { supabase } from '../../../lib/supabase';
import { PICKED_UP_STATUS_ID } from '../../../lib/statusPermissions';
import FormInput from '../../../components/FormInput';
import SignatureCanvas from '../../../components/SignatureCanvas';
import PhotoCapture from '../../../components/PhotoCapture';
import PhotoGallery from '../../../components/PhotoGallery';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { CompressedImage } from '../../../lib/imageCompression';

export default function SignatureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CompressedImage[]>([]);
  const [step, setStep] = useState<'photo' | 'details'>('photo');

  const statusId = params.status_id ? Number(params.status_id) : 10;
  const isPickedUp = statusId === PICKED_UP_STATUS_ID;

  const handlePhotosCapture = (capturedPhotos: CompressedImage[]) => {
    setPhotos(capturedPhotos);
  };

  const handleContinueToDetails = () => {
    if (photos.length === 0) {
      Alert.alert('Required', 'Please capture at least one photo for POD');
      return;
    }
    setStep('details');
  };

  const canSubmit = () => {
    if (photos.length === 0) return false;
    if (!clientName) return false;
    if (isPickedUp) {
      return true;
    }
    return !!idCard && !!signature;
  };

  const handleUpdate = async () => {
    if (!clientName) {
      Alert.alert('Required', 'Please enter client name');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Required', 'Please capture at least one photo for POD');
      return;
    }

    if (!isPickedUp && (!idCard || !signature)) {
      Alert.alert('Required', 'Please fill in all fields and add signature');
      return;
    }

    setLoading(true);

    const now = new Date();
    const delivered_date = now.toISOString().split('T')[0];
    const delivered_time = now.toTimeString().split(' ')[0];

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      if (params.mode === 'single') {
        const result = await updateBooking({
          booking_id: Number(params.booking_id),
          status_id: statusId,
          delivered_date,
          delivered_time,
          client_name: clientName,
          id_card: idCard || '',
          signature: signature ? `data:image/png;base64,${signature}` : '',
        });

        savePOD({
          booking_id: Number(params.booking_id),
          miles_ref: params.miles_ref as string || '',
          photos: photos,
          client_name: clientName,
          id_card: idCard || '',
          signature_base64: signature || '',
          delivered_date,
          delivered_time,
          captured_by: user.id,
          status_id: statusId,
        }).then((podResult) => {
          console.log('POD save completed successfully:', podResult);
        }).catch(err => {
          console.error('POD SAVE ERROR:', err);
        });

        setLoading(false);

        if (result.success) {
          router.back();
          router.back();
        } else {
          Alert.alert('Error', result.error || 'Update failed');
        }
      } else {
        const bookingIds = (params.booking_ids as string).split(',').map(Number);
        const milesRefs = params.miles_refs ? (params.miles_refs as string).split(',') : [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < bookingIds.length; i++) {
          const bookingId = bookingIds[i];
          const milesRef = milesRefs[i] || '';

          const result = await updateBooking({
            booking_id: bookingId,
            status_id: statusId,
            delivered_date,
            delivered_time,
            client_name: clientName,
            id_card: idCard || '',
            signature: signature ? `data:image/png;base64,${signature}` : '',
          });

          savePOD({
            booking_id: bookingId,
            miles_ref: milesRef,
            photos: photos,
            client_name: clientName,
            id_card: idCard || '',
            signature_base64: signature || '',
            delivered_date,
            delivered_time,
            captured_by: user.id,
            status_id: statusId,
          }).catch(err => {
            console.log('POD save failed for booking', bookingId, err);
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        }

        setLoading(false);

        router.back();
        router.back();
      }
    } catch (error) {
      console.error('Update error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Updating with POD photos..." />;
  }

  if (step === 'photo') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Capture POD Photos</Text>
          <Text style={styles.subtitle}>Take photos of delivered items (1-5 photos required)</Text>
        </View>
        <PhotoCapture onPhotosCapture={handlePhotosCapture} maxPhotos={5} />
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, photos.length === 0 && styles.continueButtonDisabled]}
            onPress={handleContinueToDetails}
            disabled={photos.length === 0}
          >
            <Text style={styles.continueButtonText}>
              Continue to Customer Details ({photos.length} photos)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('photo')}
        >
          <Text style={styles.backButtonText}>← Back to Photos</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Customer Details</Text>
        <Text style={styles.subtitle}>
          {isPickedUp
            ? 'Please enter customer name (ID and signature are optional)'
            : 'Please collect customer information and signature'
          }
        </Text>

        <PhotoGallery
          photos={photos}
          onRemovePhoto={(index) => {
            const newPhotos = photos.filter((_, i) => i !== index);
            setPhotos(newPhotos);
            if (newPhotos.length === 0) {
              setStep('photo');
            }
          }}
        />

        <View style={styles.form}>
          <FormInput
            label="Customer Name"
            placeholder="Enter customer name"
            value={clientName}
            onChangeText={setClientName}
            required
          />

          <FormInput
            label={isPickedUp ? "ID Card Number (Optional)" : "ID Card Number"}
            placeholder="Enter ID card number"
            value={idCard}
            onChangeText={setIdCard}
            required={!isPickedUp}
          />

          {isPickedUp ? (
            <View style={styles.optionalSignatureSection}>
              <Text style={styles.optionalLabel}>Signature (Optional)</Text>
              <SignatureCanvas onSignature={setSignature} />
            </View>
          ) : (
            <View style={styles.signatureSection}>
              <Text style={styles.signatureLabel}>
                Customer Signature <Text style={styles.required}>*</Text>
              </Text>
              <SignatureCanvas onSignature={setSignature} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
          onPress={handleUpdate}
          disabled={!canSubmit()}
        >
          <Text style={styles.submitButtonText}>
            {isPickedUp ? 'Complete Pickup' : 'Update Booking with POD'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: layouts.spacing.lg,
    backgroundColor: colors.primary,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.background,
    marginBottom: layouts.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    padding: layouts.spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  continueButton: {
    backgroundColor: colors.success,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  backButton: {
    marginBottom: layouts.spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  form: {
    marginBottom: layouts.spacing.xl,
  },
  signatureSection: {
    marginTop: layouts.spacing.md,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  optionalSignatureSection: {
    marginTop: layouts.spacing.md,
  },
  optionalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: layouts.spacing.sm,
  },
  required: {
    color: colors.error,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});