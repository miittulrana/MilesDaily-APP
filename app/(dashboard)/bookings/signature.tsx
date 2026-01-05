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

  const handleUpdate = async () => {
    console.log('=== HANDLE UPDATE STARTED ===');
    console.log('Client Name:', clientName);
    console.log('ID Card:', idCard);
    console.log('Signature exists:', !!signature);
    console.log('Photos count:', photos.length);

    if (!clientName || !idCard || !signature) {
      Alert.alert('Required', 'Please fill in all fields and add signature');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Required', 'Please capture at least one photo for POD');
      return;
    }

    setLoading(true);

    const now = new Date();
    const delivered_date = now.toISOString().split('T')[0];
    const delivered_time = now.toTimeString().split(' ')[0];

    console.log('Delivered date:', delivered_date);
    console.log('Delivered time:', delivered_time);

    try {
      console.log('Getting authenticated user...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User ID:', user?.id);

      if (!user) {
        console.error('ERROR: No authenticated user');
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      if (params.mode === 'single') {
        console.log('=== SINGLE MODE UPDATE ===');
        console.log('Booking ID:', params.booking_id);
        console.log('Status ID:', params.status_id);
        console.log('Miles Ref:', params.miles_ref);

        console.log('Calling BizHandle API...');
        const result = await updateBooking({
          booking_id: Number(params.booking_id),
          status_id: Number(params.status_id),
          delivered_date,
          delivered_time,
          client_name: clientName,
          id_card: idCard,
          signature: `data:image/png;base64,${signature}`,
        });
        console.log('BizHandle API result:', result);

        console.log('Saving POD in background...');
        savePOD({
          booking_id: Number(params.booking_id),
          miles_ref: params.miles_ref as string || '',
          photos: photos,
          client_name: clientName,
          id_card: idCard,
          signature_base64: signature,
          delivered_date,
          delivered_time,
          captured_by: user.id,
        }).then((podResult) => {
          console.log('POD save completed successfully:', podResult);
        }).catch(err => {
          console.error('POD SAVE ERROR:', err);
          console.error('Error details:', JSON.stringify(err, null, 2));
        });

        setLoading(false);

        if (result.success) {
          Alert.alert('Success', 'Booking updated successfully with POD photos', [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]);
        } else {
          Alert.alert('Error', result.error || 'Update failed');
        }
      } else {
        const bookingIds = JSON.parse(params.booking_ids as string);
        let successCount = 0;
        let failCount = 0;

        for (const bookingId of bookingIds) {
          const result = await updateBooking({
            booking_id: bookingId,
            status_id: Number(params.status_id),
            delivered_date,
            delivered_time,
            client_name: clientName,
            id_card: idCard,
            signature: `data:image/png;base64,${signature}`,
          });

          savePOD({
            booking_id: bookingId,
            miles_ref: params.miles_ref as string || '',
            photos: photos,
            client_name: clientName,
            id_card: idCard,
            signature_base64: signature,
            delivered_date,
            delivered_time,
            captured_by: user.id,
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

        Alert.alert(
          'Update Complete',
          `Success: ${successCount}\nFailed: ${failCount}\nPOD photos saved for all bookings`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
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
          Please collect customer information and signature
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
            label="ID Card Number"
            placeholder="Enter ID card number"
            value={idCard}
            onChangeText={setIdCard}
            required
          />

          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>
              Customer Signature <Text style={styles.required}>*</Text>
            </Text>
            <SignatureCanvas onSignature={setSignature} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!clientName || !idCard || !signature) && styles.submitButtonDisabled]}
          onPress={handleUpdate}
          disabled={!clientName || !idCard || !signature}
        >
          <Text style={styles.submitButtonText}>Update Booking with POD</Text>
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