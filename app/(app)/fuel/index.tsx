import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../../components/ErrorMessage';
import FuelRecordCard from '../../../components/FuelRecordCard';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { useAssignedVehicle, useFuelRecords } from '../../../modules/fuel/fuelHooks';
import { DriverInfo } from '../../../modules/fuel/fuelTypes';

export default function FuelRecordsScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
  const { records, loading: recordsLoading, error, refetch } = useFuelRecords(driver?.id || '');

  useEffect(() => {
    // Refresh records when the screen comes into focus
    const unsubscribe = router.addListener('focus', () => {
      if (driver?.id) {
        refetch();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [driver, refetch, router]);

  const handleAddFuel = () => {
    router.push('/fuel/add');
  };

  if (loading || vehicleLoading) {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Vehicle:</Text>
          <Text style={styles.vehicleText}>
            {vehicle.license_plate} • {vehicle.brand} {vehicle.model}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddFuel}>
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={styles.addButtonText}>Add Fuel</Text>
        </TouchableOpacity>
      </View>

      {recordsLoading ? (
        <LoadingIndicator message="Loading fuel records..." />
      ) : (
        <>
          {error && <ErrorMessage message={error} />}

          {records.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="water-outline" size={64} color={colors.gray300} />
              <Text style={styles.emptyStateTitle}>No Fuel Records</Text>
              <Text style={styles.emptyStateDescription}>
                Start recording your fuel expenses by adding your first record
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddFuel}>
                <Text style={styles.emptyStateButtonText}>Add First Record</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={records}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <FuelRecordCard record={item} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </View>
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
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
    marginRight: layouts.spacing.xs,
  },
  vehicleText: {
    fontSize: 14,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: layouts.borderRadius.md,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: layouts.spacing.xs,
  },
  listContent: {
    padding: layouts.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layouts.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.lg,
    marginBottom: layouts.spacing.sm,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: layouts.spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: layouts.borderRadius.md,
  },
  emptyStateButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
});