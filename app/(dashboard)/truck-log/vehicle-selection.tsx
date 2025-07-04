import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../../../components/LoadingIndicator';
import VehicleCard from '../../../components/truck-log/VehicleCard';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getAssignedVehicles, punchInOut, getCurrentLocation } from '../../../lib/truckLogService';
import { AssignedVehicle } from '../../../utils/truckLogTypes';

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<AssignedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAssignedVehicles();
      setVehicles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles');
      console.error('Error loading vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const handlePunchIn = async () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle first');
      return;
    }

    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    if (!vehicle) {
      Alert.alert('Error', 'Selected vehicle not found');
      return;
    }

    if (!vehicle.is_available) {
      Alert.alert(
        'Vehicle Unavailable',
        `${vehicle.license_plate} is currently in use by another driver. Please select a different vehicle.`
      );
      return;
    }

    try {
      setPunching(true);
      
      const location = await getCurrentLocation();
      
      const result = await punchInOut({
        vehicle_id: selectedVehicle,
        action: 'punch_in',
        location: location || undefined,
      });

      if (result.success) {
        Alert.alert(
          'Punch In Successful',
          `You've successfully punched in with ${vehicle.license_plate}`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(dashboard)/truck-log/active-session');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to punch in');
      }
    } catch (err: any) {
      console.error('Error punching in:', err);
      Alert.alert('Error', err.message || 'Failed to punch in');
    } finally {
      setPunching(false);
    }
  };

  const getAvailableVehicles = () => {
    return vehicles.filter(vehicle => vehicle.is_available);
  };

  const getUnavailableVehicles = () => {
    return vehicles.filter(vehicle => !vehicle.is_available);
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading vehicles..." />;
  }

  const availableVehicles = getAvailableVehicles();
  const unavailableVehicles = getUnavailableVehicles();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Vehicle</Text>
          <Text style={styles.description}>
            Choose an available vehicle to start your session
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadVehicles} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {availableVehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Vehicles</Text>
            <View style={styles.vehiclesList}>
              {availableVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  selected={selectedVehicle === vehicle.id}
                  onSelect={() => handleVehicleSelect(vehicle.id)}
                  disabled={false}
                />
              ))}
            </View>
          </View>
        )}

        {unavailableVehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currently In Use</Text>
            <View style={styles.vehiclesList}>
              {unavailableVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  selected={false}
                  onSelect={() => {}}
                  disabled={true}
                />
              ))}
            </View>
          </View>
        )}

        {vehicles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No Vehicles Assigned</Text>
            <Text style={styles.emptyDescription}>
              You don't have any vehicles assigned for truck log. Contact admin for assignments.
            </Text>
          </View>
        )}

        {availableVehicles.length === 0 && unavailableVehicles.length > 0 && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              All assigned vehicles are currently in use. Please wait for a vehicle to become available.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={punching}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.punchButton,
            (!selectedVehicle || punching) && styles.punchButtonDisabled
          ]}
          onPress={handlePunchIn}
          disabled={!selectedVehicle || punching}
        >
          {punching ? (
            <LoadingIndicator size="small" color={colors.background} message="" />
          ) : (
            <>
              <Ionicons name="play-circle" size={20} color={colors.background} />
              <Text style={styles.punchButtonText}>Punch In</Text>
            </>
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    margin: layouts.spacing.lg,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginLeft: layouts.spacing.sm,
    flex: 1,
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingVertical: layouts.spacing.xs,
    paddingHorizontal: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.sm,
  },
  retryText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    margin: layouts.spacing.lg,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  warningText: {
    color: colors.warning,
    fontSize: 14,
    marginLeft: layouts.spacing.sm,
    flex: 1,
  },
  section: {
    padding: layouts.spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
  },
  vehiclesList: {
    gap: layouts.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: layouts.spacing.xl,
    margin: layouts.spacing.lg,
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.md,
    marginBottom: layouts.spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
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
  punchButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.primary,
    gap: layouts.spacing.sm,
  },
  punchButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  punchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});