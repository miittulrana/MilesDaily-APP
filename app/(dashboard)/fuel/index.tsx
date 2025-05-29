import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../../components/ErrorMessage';
import FuelRecordCard from '../../../components/fuel/FuelRecordCard';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { getAllFuelRecords, getAssignedVehicle } from '../../../lib/fuelService';
import { DriverInfo, FuelRecord } from '../../../utils/types';
import { supabase } from '../../../lib/supabase';

export default function FuelRecordsScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDriver = async () => {
      try {
        setLoading(true);
        const driverData = await getDriverInfo();
        setDriver(driverData);
        
        if (driverData?.id) {
          const vehicleData = await getAssignedVehicle(driverData.id);
          setVehicle(vehicleData);
        }
      } catch (error) {
        console.error('Error loading driver info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, []);
  
  const fetchRecords = useCallback(async () => {
    if (driver?.id && vehicle?.id) {
      try {
        setRecordsLoading(true);
        setError(null);
        
        const data = await getAllFuelRecords(driver.id, vehicle.id);
        setRecords(data);
      } catch (err) {
        setError('Failed to load fuel records');
        console.error('Error fetching fuel records:', err);
      } finally {
        setRecordsLoading(false);
      }
    }
  }, [driver, vehicle]);

  // Setup realtime listener for fuel records
  useEffect(() => {
    if (!vehicle?.id) return;

    let isSubscribed = true;
    const channelName = `fuel-records-${vehicle.id}`;
    
    // Remove any existing channel with the same name first
    const existingChannels = supabase.getChannels();
    existingChannels.forEach(channel => {
      if (channel.topic === `realtime:${channelName}`) {
        supabase.removeChannel(channel);
      }
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fuel_records',
          filter: `vehicle_id=eq.${vehicle.id}`
        },
        (payload) => {
          if (!isSubscribed) return;
          
          console.log('Fuel record changed:', payload);
          // Refresh records when changes occur
          if (driver?.id && vehicle?.id) {
            getAllFuelRecords(driver.id, vehicle.id).then(data => {
              if (isSubscribed) {
                setRecords(data);
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  }, [vehicle?.id]); // Only depend on vehicle ID

  useFocusEffect(
    useCallback(() => {
      if (driver?.id && vehicle?.id) {
        fetchRecords();
      }
    }, [driver, vehicle, fetchRecords])
  );

  const handleAddFuel = () => {
    router.push('/(dashboard)/fuel/add');
  };

  if (loading) {
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
              renderItem={({ item }) => (
                <FuelRecordCard 
                  record={item} 
                  showManualTag={true}
                />
              )}
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