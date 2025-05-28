import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import ErrorMessage from '../../../components/ErrorMessage';
import WashScheduleCard from '../../../components/wash/WashScheduleCard';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { DriverInfo, WashSchedule } from '../../../utils/types';

export default function WashScheduleScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<WashSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    const loadDriver = async () => {
      try {
        setLoading(true);
        const driverData = await getDriverInfo();
        setDriver(driverData);
        
        if (driverData?.id) {
          try {
            const vehicleResponse = await fetch(`https://fleet.milesxp.com/api/drivers/${driverData.id}/vehicle`);
            if (vehicleResponse.ok) {
              const vehicleData = await vehicleResponse.json();
              if (vehicleData) {
                setVehicle(vehicleData);
              }
            } else {
              throw new Error('Web API vehicle fetch failed');
            }
          } catch (apiError) {
            console.error('Error fetching from API, falling back to local DB:', apiError);
            const { supabase } = await import('../../../lib/supabase');
            const { data: localVehicle } = await supabase
              .from('vehicles')
              .select('*')
              .eq('driver_id', driverData.id)
              .eq('status', 'assigned')
              .single();
              
            if (localVehicle) {
              setVehicle(localVehicle);
            }
          }
        }
      } catch (error) {
        console.error('Error loading driver info:', error);
        setError('Failed to load driver information');
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, []);

  const loadWashSchedules = useCallback(async () => {
    if (!driver?.id || !vehicle?.id) return;
    
    try {
      setError(null);
      const { fetchDriverWashSchedules } = await import('../../../lib/washService');
      
      // Try today first
      let data = await fetchDriverWashSchedules(driver.id, vehicle.id, todayStr);
      
      // If no schedules for today, try May 28, 2025 (the date from your webapp)
      if (data.length === 0) {
        console.log('No schedules for today, trying May 28, 2025...');
        data = await fetchDriverWashSchedules(driver.id, vehicle.id, '2025-05-28');
      }
      
      setSchedules(data);
    } catch (err) {
      console.error('Error loading wash schedules:', err);
      setError('Failed to load wash schedules');
    }
  }, [driver?.id, vehicle?.id, todayStr]);

  useFocusEffect(
    useCallback(() => {
      if (driver?.id && vehicle?.id) {
        loadWashSchedules();
      }
    }, [driver?.id, vehicle?.id, loadWashSchedules])
  );

  const handleCompleteWash = (schedule: WashSchedule) => {
    router.push({
      pathname: '/(dashboard)/wash/complete',
      params: { scheduleId: schedule.id }
    });
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading wash schedules..." />;
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

  const todaySchedules = schedules.filter(s => s.scheduled_date === todayStr);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Vehicle:</Text>
          <Text style={styles.vehicleText}>
            {vehicle.license_plate} • {vehicle.brand} {vehicle.model}
          </Text>
        </View>
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>Today:</Text>
          <Text style={styles.dateText}>
            {today.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      </View>

      {error && <ErrorMessage message={error} />}

      {todaySchedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyStateTitle}>No Wash Scheduled</Text>
          <Text style={styles.emptyStateDescription}>
            No vehicle wash scheduled for today
          </Text>
        </View>
      ) : (
        <FlatList
          data={todaySchedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WashScheduleCard 
              schedule={item}
              vehicle={vehicle}
              onComplete={handleCompleteWash}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    flex: 1,
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
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
    marginRight: layouts.spacing.xs,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
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
  },
});