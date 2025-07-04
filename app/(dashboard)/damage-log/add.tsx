import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo, getAssignedVehicle } from '../../../lib/auth';
import { createDamageLog } from '../../../lib/damageLogService';

export default function AddDamageLogScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos of vehicle damage.');
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
      Alert.alert('Photo Required', 'Please take a photo of the vehicle damage.');
      return;
    }

    if (!remarks.trim()) {
      Alert.alert('Remarks Required', 'Please enter remarks describing the damage.');
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

      const vehicle = await getAssignedVehicle(driverInfo.id);
      if (!vehicle?.id) {
        setError('No assigned vehicle found');
        return;
      }

      await createDamageLog({
        driver_id: driverInfo.id,
        vehicle_id: vehicle.id,
        image_uri: imageUri,
        remarks: remarks.trim(),
      });

      Alert.alert(
        'Success',
        'Damage log has been submitted successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Error submitting damage log:', err);
      setError('Failed to submit damage log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Vehicle Damage</Text>
          <Text style={styles.subtitle}>
            Take a photo and provide details about the damage
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Damage Photo</Text>
          <Text style={styles.sectionDescription}>
            Take a clear photo showing the damage to the vehicle
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
                <Ionicons name="camera" size={32} color={colors.primary} />
                <Text style={styles.cameraButtonText}>Take Photo</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remarks</Text>
          <Text style={styles.sectionDescription}>
            Describe the damage and how it occurred
          </Text>
          
          <TextInput
            style={styles.textInput}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Enter details about the damage..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {remarks.length}/500 characters
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
              <Ionicons name="checkmark-circle" size={20} color={colors.background} />
              <Text style={styles.submitButtonText}>Submit Damage Report</Text>
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
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary + '05',
  },
  cameraButtonContent: {
    alignItems: 'center',
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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
});