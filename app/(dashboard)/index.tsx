import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import LoadingIndicator from '../../components/LoadingIndicator';
import ModuleCard from '../../components/ModuleCard';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { getAssignedVehicle, getDriverInfo } from '../../lib/auth';
import { DriverInfo } from '../../utils/types';

export default function DashboardScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
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

  const navigateToModule = (module: string) => {
    if (module === 'profile') {
      router.push('/(dashboard)/profile');
    } else if (module === 'fuel') {
      router.push('/(dashboard)/fuel');
    }
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
          <Text style={styles.noVehicleText}>No vehicle assigned</Text>
        </View>
      )}

      <View style={styles.modulesSection}>
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.modulesGrid}>
          <ModuleCard
            title="Fuel"
            description="Record and track fuel expenses"
            iconName="water"
            onPress={() => navigateToModule('fuel')}
          />
          <ModuleCard
            title="Profile"
            description="View and manage your profile"
            iconName="person"
            onPress={() => navigateToModule('profile')}
          />
        </View>
      </View>
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
});