import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo, getAssignedVehicleWithTemp } from '../../../lib/auth';
import { createBreakdownReport, getAssistanceNumbers } from '../../../lib/breakdownService';
import { AssistanceNumber } from '../../../utils/breakdownTypes';

export default function AddBreakdownScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [assistanceNumbers, setAssistanceNumbers] = useState<AssistanceNumber[]>([]);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos of vehicle breakdown.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setError(null);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removePhoto = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Photo Required', 'Please take a photo of the vehicle breakdown.');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Location Required', 'Please enter the breakdown location.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const driverInfo = await getDriverInfo();
      if (!driverInfo?.id) {
        setError('Driver information not found');
        return;
      }

      const vehicle = await getAssignedVehicleWithTemp(driverInfo.id);
      if (!vehicle?.id) {
        setError('No assigned vehicle found');
        return;
      }

      const reportData = {
        driver_id: driverInfo.id,
        vehicle_id: vehicle.id,
        location_address: location.trim(),
        notes: notes.trim() || undefined,
        image_uri: imageUri,
      };

      await createBreakdownReport(reportData);

      const numbers = await getAssistanceNumbers();
      setAssistanceNumbers(numbers);
      setShowContacts(true);

    } catch (err) {
      console.error('Error submitting breakdown report:', err);
      setError('Failed to submit breakdown report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNumber = async (phoneNumber: string) => {
    try {
      const url = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert('Error', 'Failed to make phone call');
    }
  };

  const handleContactsClose = () => {
    setShowContacts(false);
    Alert.alert(
      'Report Submitted',
      'Your breakdown report has been submitted successfully.',
      [{ text: 'OK', onPress: () => router.replace('/breakdown' as any) }]
    );
  };

  if (showContacts) {
    return (
      <View style={styles.container}>
        <View style={styles.contactsModal}>
          <View style={styles.contactsHeader}>
            <Text style={styles.contactsTitle}>Emergency Assistance</Text>
            <TouchableOpacity onPress={handleContactsClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.contactsSubtitle}>
            Your breakdown report has been submitted. Contact emergency assistance if needed:
          </Text>

          <ScrollView style={styles.contactsList}>
            {assistanceNumbers.length > 0 ? (
              assistanceNumbers.map((number) => (
                <TouchableOpacity
                  key={number.id}
                  style={styles.contactCard}
                  onPress={() => handleCallNumber(number.phone_number)}
                >
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactPhone}>{number.phone_number}</Text>
                    {number.description && (
                      <Text style={styles.contactDescription}>{number.description}</Text>
                    )}
                  </View>
                  <Ionicons name="call" size={24} color={colors.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noContactsText}>
                No emergency contact numbers available
              </Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={handleContactsClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Vehicle Breakdown</Text>
          <Text style={styles.subtitle}>
            Take a photo and provide details about the breakdown
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown Photo</Text>
          <Text style={styles.sectionDescription}>
            Take a clear photo showing the vehicle breakdown
          </Text>
          
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity style={styles.removeButton} onPress={removePhoto}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
              <View style={styles.cameraButtonContent}>
                <Ionicons name="camera" size={32} color={colors.error} />
                <Text style={styles.cameraButtonText}>Take Photo</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.sectionDescription}>
            Enter the exact location of the breakdown
          </Text>
          
          <TextInput
            style={styles.textInput}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter breakdown location..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={styles.characterCount}>
            {location.length}/200 characters
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Describe what happened and any additional details
          </Text>
          
          <TextInput
            style={styles.textInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter additional details..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {notes.length}/500 characters
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <LoadingIndicator size="small" color={colors.background} message="" />
          ) : (
            <>
              <Ionicons name="warning" size={20} color={colors.background} />
              <Text style={styles.submitButtonText}>Submit Breakdown Report</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 22,
  },
  section: {
    marginBottom: layouts.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.lg,
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.gray100,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.background,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cameraButton: {
    height: 200,
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.error,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error + '05',
  },
  cameraButtonContent: {
    alignItems: 'center',
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginTop: layouts.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: layouts.spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.error,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginTop: layouts.spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: layouts.spacing.sm,
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
  contactsModal: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layouts.spacing.lg,
  },
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
  },
  contactsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  contactsSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: layouts.spacing.xl,
    lineHeight: 22,
  },
  contactsList: {
    flex: 1,
    marginBottom: layouts.spacing.lg,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: layouts.spacing.lg,
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfo: {
    flex: 1,
  },
  contactPhone: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  contactDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  noContactsText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: layouts.spacing.xl,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  doneButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});