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
      {/* Welcome & Vehicle Section */}
      <View style={styles.topSection}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.driverName}>{getDriverName()}</Text>
          {driver?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{getRoleLabel(driver.role)}</Text>
            </View>
          )}
        </View>

        {vehicle && (
          <View style={styles.vehicleSection}>
            <Text style={styles.vehicleSectionTitle}>Assigned Vehicle</Text>
            <Text style={styles.vehicleLicensePlate}>{vehicle.license_plate}</Text>
            <Text style={styles.vehicleModel}>{vehicle.brand} {vehicle.model}</Text>
          </View>
        )}
      </View>

      {/* Fuel Module */}
      <View style={styles.moduleContainer}>
        <ModuleCard
          title="Fuel"
          description="Record and track fuel expenses"
          iconName="water"
          onPress={() => navigateToModule('fuel')}
        />
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
    paddingBottom: layouts.spacing.xl,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layouts.spacing.xl,
    paddingHorizontal: layouts.spacing.sm,
  },
  welcomeSection: {
    flex: 1,
    paddingRight: layouts.spacing.md,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: layouts.borderRadius.full,
  },
  roleBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleSection: {
    alignItems: 'flex-end',
    paddingLeft: layouts.spacing.md,
  },
  vehicleSectionTitle: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
    marginBottom: layouts.spacing.xs,
  },
  vehicleLicensePlate: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  vehicleModel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  moduleContainer: {
    alignItems: 'center',
  },
});