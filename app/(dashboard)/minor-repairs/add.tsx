import { useState, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo, getAssignedVehicle } from '../../../lib/auth';
import { createMinorRepair, fetchRepairTypes } from '../../../lib/minorRepairsService';
import { RepairType } from '../../../utils/minorRepairsTypes';

export default function AddMinorRepairScreen() {
  const router = useRouter();
  const [repairTypes, setRepairTypes] = useState<RepairType[]>([]);
  const [selectedRepairType, setSelectedRepairType] = useState<string>('');
  const [costEuros, setCostEuros] = useState<string>('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const driverInfo = await getDriverInfo();
      if (!driverInfo?.id) {
        setError('Driver information not found');
        return;
      }

      const [vehicleData, repairTypesData] = await Promise.all([
        getAssignedVehicle(driverInfo.id),
        fetchRepairTypes()
      ]);

      setVehicle(vehicleData);
      setRepairTypes(repairTypesData);

      if (!vehicleData) {
        setError('No assigned vehicle found');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos of repairs.');
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
    if (!selectedRepairType) {
      Alert.alert('Repair Type Required', 'Please select a repair type.');
      return;
    }

    if (!costEuros.trim() || parseFloat(costEuros) <= 0) {
      Alert.alert('Cost Required', 'Please enter a valid cost amount.');
      return;
    }

    if (!vehicle) {
      Alert.alert('Vehicle Error', 'No assigned vehicle found.');
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

      await createMinorRepair({
        repair_type_id: selectedRepairType,
        vehicle_id: vehicle.id,
        cost_euros: parseFloat(costEuros),
        description: description.trim() || undefined,
        image_uri: imageUri || undefined,
      });

      Alert.alert(
        'Success',
        'Minor repair has been reported successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Error submitting repair:', err);
      setError('Failed to submit repair. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Minor Repair</Text>
          <Text style={styles.subtitle}>
            Document minor vehicle repairs and associated costs
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {vehicle && (
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleLabel}>Vehicle:</Text>
            <Text style={styles.vehicleText}>
              {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repair Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRepairType}
              onValueChange={(value) => setSelectedRepairType(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select repair type..." value="" />
              {repairTypes.map((type) => (
                <Picker.Item
                  key={type.id}
                  label={type.name}
                  value={type.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost (EUR)</Text>
          <TextInput
            style={styles.textInput}
            value={costEuros}
            onChangeText={setCostEuros}
            placeholder="Enter cost amount"
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter repair description..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {description.length}/500 characters
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Take a photo of the repair if applicable
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
                <Ionicons name="camera" size={32} color={colors.warning} />
                <Text style={styles.cameraButtonText}>Take Photo</Text>
              </View>
            </TouchableOpacity>
          )}
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
              <Text style={styles.submitButtonText}>Submit Repair</Text>
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
  vehicleInfo: {
    backgroundColor: colors.card,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.background,
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textAreaInput: {
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: layouts.spacing.xs,
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
    height: 150,
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.warning,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.warning + '05',
  },
  cameraButtonContent: {
    alignItems: 'center',
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginTop: layouts.spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.warning,
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