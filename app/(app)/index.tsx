import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors } from '../../constants/colors';
import { layouts } from '../../constants/layouts';
import { getAssignedVehicle, getDriverInfo } from '../../lib/auth';
import { useFuelStats } from '../../modules/fuel/fuelHooks';
import { DriverInfo } from '../../modules/fuel/fuelTypes';
import { formatConsumption, formatCurrency, formatDistance } from '../../utils/numberUtils';

export default function DashboardScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { stats, loading: statsLoading } = useFuelStats(driver?.id || '');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const driverData = await getDriverInfo();
        setDriver(driverData);
        
        if (driverData?.id) {
          const vehicleData = await getAssignedVehicle(driverData.id);
          setVehicle(vehicleData);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const getDriverName = () => {
    if (!driver) return '';
    return driver.first_name && driver.last_name 
      ? `${driver.first_name} ${driver.last_name}`
      : driver.first_name || driver.email;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'van-driver': return 'Van Driver';
      case 'scooter-driver': return 'Scooter Driver';
      case 'truck-driver': return 'Truck Driver';
      default: return 'Driver';
    }
  };

  const navigateToFuel = () => {
    router.push('/fuel');
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading your dashboard..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.driverName}>{getDriverName()}</Text>
        {driver?.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{getRoleLabel(driver.role)}</Text>
          </View>
        )}
      </View>

      {vehicle ? (
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleCardHeader}>
            <Text style={styles.vehicleCardTitle}>Assigned Vehicle</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleLicensePlate}>{vehicle.license_plate}</Text>
            <Text style={styles.vehicleModel}>{vehicle.brand} {vehicle.model}</Text>
            <Text style={styles.vehicleDetail}>Type: {vehicle.type || 'N/A'}</Text>
            <Text style={styles.vehicleDetail}>Fuel: {vehicle.fuel_type || 'N/A'}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noVehicleCard}>
          <Ionicons name="car-outline" size={32} color={colors.gray400} />
          <Text style={styles.noVehicleText}>No vehicle assigned</Text>
        </View>
      )}

      <View style={styles.modulesSection}>
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity style={styles.moduleCard} onPress={navigateToFuel}>
            <View style={styles.moduleIconContainer}>
              <Ionicons name="water" size={24} color={colors.primary} />
            </View>
            <Text style={styles.moduleTitle}>Fuel</Text>
            <Text style={styles.moduleDescription}>Record and track fuel expenses</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!statsLoading && stats && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Fuel Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(stats.total_spent_euros)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDistance(stats.total_distance_km)}</Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatConsumption(stats.avg_consumption_per_100km)}</Text>
              <Text style={styles.statLabel}>Avg. Consumption</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.record_count}</Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  header: {
    marginBottom: layouts.spacing.xl,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textLight,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: layouts.borderRadius.full,
    marginTop: layouts.spacing.sm,
  },
  roleBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleCardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingBottom: layouts.spacing.sm,
    marginBottom: layouts.spacing.md,
  },
  vehicleCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  vehicleInfo: {
    gap: layouts.spacing.sm,
  },
  vehicleLicensePlate: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  vehicleDetail: {
    fontSize: 14,
    color: colors.textLight,
  },
  noVehicleCard: {
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    height: 150,
  },
  noVehicleText: {
    fontSize: 16,
    color: colors.gray500,
    marginTop: layouts.spacing.md,
  },
  modulesSection: {
    marginBottom: layouts.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layouts.spacing.md,
  },
  moduleCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  moduleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layouts.spacing.md,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: layouts.spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layouts.spacing.md,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    width: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
});