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
import FormInput from '../../../components/FormInput';
import SignatureCanvas from '../../../components/SignatureCanvas';
import LoadingIndicator from '../../../components/LoadingIndicator';

export default function SignatureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [signature, setSignature] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!clientName || !idCard || !signature) {
      Alert.alert('Required', 'Please fill in all fields and add signature');
      return;
    }

    setLoading(true);

    const now = new Date();
    const delivered_date = now.toISOString().split('T')[0];
    const delivered_time = now.toTimeString().split(' ')[0];

    if (params.mode === 'single') {
      const result = await updateBooking({
        booking_id: Number(params.booking_id),
        status_id: Number(params.status_id),
        delivered_date,
        delivered_time,
        client_name: clientName,
        id_card: idCard,
        signature: signature,
      });

      setLoading(false);

      if (result.success) {
        Alert.alert('Success', 'Booking updated successfully', [
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
          signature: signature,
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
        `Success: ${successCount}\nFailed: ${failCount}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Updating..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Customer Details</Text>
        <Text style={styles.subtitle}>
          Please collect customer information and signature
        </Text>

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
          <Text style={styles.submitButtonText}>Update Booking</Text>
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
  content: {
    padding: layouts.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.xl,
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