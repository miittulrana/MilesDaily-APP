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

  useEffect(() => {
    if (!vehicle?.id) return;

    let isSubscribed = true;
    const channelName = `fuel-records-${vehicle.id}`;
    
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
  }, [vehicle?.id]);

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
        <Text style={styles.headerTitle}>Fuel Records</Text>
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
    paddingVertical: layouts.spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: layouts.borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: layouts.spacing.sm,
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