import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingIndicator from '../../components/LoadingIndicator';
import WashScheduleCard from '../../components/wash/WashScheduleCard';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { getDriverInfo, getAssignedVehicle } from '../../lib/auth';
import { getTodaysWashSchedule, WashSchedule } from '../../lib/washService';
import { DriverInfo, Vehicle } from '../../utils/types';

export default function WashScheduleScreen() {
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [schedules, setSchedules] = useState<WashSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDriverAndVehicle = async () => {
    try {
      const driverData = await getDriverInfo();
      setDriver(driverData);
      
      if (driverData?.id) {
        const vehicleData = await getAssignedVehicle(driverData.id);
        setVehicle(vehicleData);
        return { driver: driverData, vehicle: vehicleData };
      }
    } catch (error) {
      console.error('Error loading driver and vehicle:', error);
      setError('Failed to load driver information');
    }
    return { driver: null, vehicle: null };
  };

  const fetchSchedules = async (showLoading = true) => {
    if (!driver?.id) return;

    try {
      if (showLoading) setLoading(true);
      setError(null);

      console.log('Fetching wash schedules for driver:', driver.id);
      
      // Get today's wash schedules following webapp protocol
      const data = await getTodaysWashSchedule(driver.id);
      
      console.log('Fetched wash schedules:', data);
      setSchedules(data);
      
      if (data.length === 0) {
        console.log('No wash schedules found for today');
      }
    } catch (err) {
      console.error('Error loading wash schedules:', err);
      setError('Failed to load wash schedules');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedules(false);
    setRefreshing(false);
  };

  const handleCompleteWash = (schedule: WashSchedule) => {
    // TODO: Navigate to completion screen with camera
    Alert.alert(
      'Complete Wash',
      'Camera functionality will be implemented to take a photo and complete the wash.',
      [
        {
          text: 'OK',
          onPress: () => {
            // For demo purposes, you could call completeWashByDriver here
            console.log('Would complete wash for schedule:', schedule.id);
          }
        }
      ]
    );
  };

  const handleViewImage = (imageUrl: string, vehiclePlate: string) => {
    // TODO: Navigate to image viewer or show modal
    Alert.alert(
      'Wash Image',
      `View wash image for ${vehiclePlate}`,
      [
        {
          text: 'OK',
          onPress: () => {
            console.log('Would show image:', imageUrl);
          }
        }
      ]
    );
  };

  // Load driver and vehicle on mount
  useEffect(() => {
    const initializeData = async () => {
      await loadDriverAndVehicle();
    };
    initializeData();
  }, []);

  // Fetch schedules when driver is loaded
  useEffect(() => {
    if (driver?.id) {
      fetchSchedules();
    }
  }, [driver]);

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      if (driver?.id) {
        fetchSchedules();
      }
    }, [driver])
  );

  if (loading && schedules.length === 0) {
    return <LoadingIndicator fullScreen message="Loading wash schedules..." />;
  }

  if (!driver) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="person-outline" size={64} color={colors.gray300} />
        <Text style={styles.errorText}>Unable to load driver information</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="car-outline" size={64} color={colors.gray300} />
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
        <View style={styles.todayBadge}>
          <Text style={styles.todayText}>Today</Text>
        </View>
      </View>

      {error && <ErrorMessage message={error} />}

      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WashScheduleCard
            schedule={item}
            onComplete={handleCompleteWash}
            onViewImage={handleViewImage}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="water-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyStateTitle}>No Wash Schedule</Text>
            <Text style={styles.emptyStateDescription}>
              No vehicle wash scheduled for today.{'\n'}
              Pull down to refresh.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
    marginTop: layouts.spacing.md,
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
    flex: 1,
  },
  todayBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: layouts.borderRadius.full,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  listContent: {
    padding: layouts.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xxl * 2,
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
    lineHeight: 20,
  },
});