import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import LoadingIndicator from '../../components/LoadingIndicator';
import ModuleCard from '../../components/ModuleCard';
import TempAssignmentBanner from '../../components/temp-assignments/TempAssignmentBanner';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { getAssignedVehicle, getDriverInfo } from '../../lib/auth';
import { useTempAssignments } from '../../lib/hooks/useTempAssignments';
import { DriverInfo } from '../../utils/types';

export default function DashboardScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    assignments,
    loading: assignmentsLoading,
    refetch: refetchAssignments,
    hasActiveAssignments,
  } = useTempAssignments(driver?.id);
  
  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const driverData = await getDriverInfo();
      setDriver(driverData);
      
      if (driverData?.id) {
        const vehicleData = await getAssignedVehicle(driverData.id);
        setVehicle(vehicleData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    await refetchAssignments();
    setRefreshing(false);
  };

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
    console.log('Navigating to module:', module);
    if (module === 'profile') {
      router.push('/(dashboard)/profile');
    } else if (module === 'documents') {
      router.push('/(dashboard)/documents');
    } else if (module === 'fuel') {
      router.push('/(dashboard)/fuel');
    } else if (module === 'truck-log') {
      router.push('/(dashboard)/truck-log');
    } else if (module === 'wash') {
      router.push('/(dashboard)/wash');
    } else if (module === 'accident') {
      console.log('Going to accident screen');
      router.push('/(dashboard)/accident');
    } else if (module === 'damage-log') {
      console.log('Going to damage log screen');
      router.push('/(dashboard)/damage-log');
    } else if (module === 'uniforms') {
      router.push('/(dashboard)/uniforms');
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading your dashboard..." />;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.headerRow}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.driverName}>{getDriverName()}</Text>
          {driver?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{getRoleLabel(driver.role)}</Text>
            </View>
          )}
        </View>

        {vehicle ? (
          <View style={styles.vehicleInfoCard}>
            <Text style={styles.vehicleNumber}>{vehicle.license_plate}</Text>
            <Text style={styles.fuelType}>{vehicle.fuel_type || 'N/A'}</Text>
          </View>
        ) : (
          <View style={styles.noVehicleCard}>
            <Text style={styles.noVehicleText}>No Vehicle</Text>
          </View>
        )}
      </View>

      {driver?.id && hasActiveAssignments && assignments.length > 0 && (
        <TempAssignmentBanner
          assignment={assignments[0]}
          onRefresh={refetchAssignments}
        />
      )}

      <View style={styles.modulesGrid}>
        <View style={styles.moduleRow}>
          <ModuleCard
            title="Documents"
            iconName="document-text-outline"
            onPress={() => navigateToModule('documents')}
          />
          <ModuleCard
            title="Fuel"
            iconName="water"
            onPress={() => navigateToModule('fuel')}
          />
        </View>
        
        <View style={styles.moduleRow}>
          <ModuleCard
            title="Truck Log"
            iconName="time-outline"
            onPress={() => navigateToModule('truck-log')}
          />
          <ModuleCard
            title="Wash"
            iconName="car-outline"
            onPress={() => navigateToModule('wash')}
          />
        </View>
        
        <View style={styles.moduleRow}>
          <ModuleCard
            title="Accident"
            iconName="warning-outline"
            onPress={() => navigateToModule('accident')}
          />
          <ModuleCard
            title="Damage Log"
            iconName="alert-circle-outline"
            onPress={() => navigateToModule('damage-log')}
          />
        </View>
        
        <View style={styles.moduleRow}>
          <ModuleCard
            title="Uniforms"
            iconName="shirt-outline"
            onPress={() => navigateToModule('uniforms')}
          />
          <View style={styles.moduleCardPlaceholder} />
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
    paddingBottom: layouts.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layouts.spacing.xl,
  },
  welcomeSection: {
    flex: 1,
    marginRight: layouts.spacing.md,
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
    marginBottom: layouts.spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: layouts.borderRadius.full,
  },
  roleBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleInfoCard: {
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
    alignItems: 'center',
    minWidth: 120,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
    textAlign: 'center',
  },
  fuelType: {
    fontSize: 14,
    color: colors.textLight,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  noVehicleCard: {
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    minWidth: 120,
  },
  noVehicleText: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
  },
  modulesGrid: {
    flex: 1,
    marginTop: layouts.spacing.lg,
  },
  moduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: layouts.spacing.xl,
    gap: layouts.spacing.lg,
  },
  moduleCardPlaceholder: {
    width: '48%',
  },
});