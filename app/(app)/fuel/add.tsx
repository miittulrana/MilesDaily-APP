import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import FormInput from '../../../components/FormInput';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { useAssignedVehicle, useFuelPrice } from '../../../modules/fuel/fuelHooks';
import { createFuelRecord } from '../../../modules/fuel/fuelService';
import { DriverInfo } from '../../../modules/fuel/fuelTypes';
import { parseFloatSafe } from '../../../utils/numberUtils';
import { validateFuelRecordForm } from '../../../utils/validators';

export default function AddFuelScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount_euros: '',
    current_km: '',
    notes: '',
    location: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDriver = async () => {
      try {
        const driverData = await getDriverInfo();
        setDriver(driverData);
      } catch (error) {
        console.error('Error loading driver info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, []);

  const { vehicle, loading: vehicleLoading } = useAssignedVehicle(driver?.id || '');
  const { price, loading: priceLoading } = useFuelPrice(vehicle?.fuel_type || 'diesel');

  const handleChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when value changes
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleSubmit = async () => {
    // Validate form
    const validation = validateFuelRecordForm(formData);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    if (!driver?.id) {
      Alert.alert('Error', 'Driver information not available');
      return;
    }
    
    if (!vehicle?.id) {
      Alert.alert('Error', 'No vehicle assigned to your account');
      return;
    }
    
    if (!price) {
      Alert.alert('Error', 'Could not determine fuel price');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const result = await createFuelRecord(
        {
          vehicle_id: vehicle.id,
          amount_euros: parseFloatSafe(formData.amount_euros),
          current_km: parseFloatSafe(formData.current_km),
          notes: formData.notes || undefined,
          location: formData.location || undefined,
        },
        driver.id,
        price
      );
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to save fuel record');
        return;
      }
      
      Alert.alert(
        'Success',
        'Fuel record added successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting fuel record:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading || vehicleLoading || priceLoading) {
    return <LoadingIndicator fullScreen message="Loading..." />;
  }

  if (!driver) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Unable to load driver information</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No vehicle assigned to your account</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleCardTitle}>Selected Vehicle</Text>
          <Text style={styles.vehicleLicensePlate}>{vehicle.license_plate}</Text>
          <Text style={styles.vehicleDetails}>
            {vehicle.brand} {vehicle.model} • {vehicle.fuel_type}
          </Text>
        </View>
        
        <View style={styles.priceInfo}>
          <Text style={styles.priceInfoText}>
            Current fuel price: <Text style={styles.priceValue}>€{price?.toFixed(2)}/L</Text>
          </Text>
        </View>

        <View style={styles.formContainer}>
          <FormInput
            label="Amount (€)"
            placeholder="Enter amount in euros"
            value={formData.amount_euros}
            onChangeText={(value) => handleChange('amount_euros', value)}
            keyboardType="numeric"
            error={errors.amount_euros}
            required
          />
          
          <FormInput
            label="Current Odometer (km)"
            placeholder="Enter current kilometers"
            value={formData.current_km}
            onChangeText={(value) => handleChange('current_km', value)}
            keyboardType="numeric"
            error={errors.current_km}
            required
          />
          
          <FormInput
            label="Location"
            placeholder="Enter location (optional)"
            value={formData.location}
            onChangeText={(value) => handleChange('location', value)}
          />
          
          <FormInput
            label="Notes"
            placeholder="Enter notes (optional)"
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <LoadingIndicator size="small" color="#ffffff" message="" />
            ) : (
              <Text style={styles.submitButtonText}>Save Record</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: layouts.spacing.lg,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  vehicleCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  vehicleCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: layouts.spacing.sm,
  },
  vehicleLicensePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  vehicleDetails: {
    fontSize: 14,
    color: colors.text,
  },
  priceInfo: {
    backgroundColor: colors.primary + '10',
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    marginBottom: layouts.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  priceInfoText: {
    fontSize: 14,
    color: colors.text,
  },
  priceValue: {
    fontWeight: '600',
    color: colors.primary,
  },
  formContainer: {
    marginBottom: layouts.spacing.lg,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layouts.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray100,
    paddingVertical: 12,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '500',
  },
});