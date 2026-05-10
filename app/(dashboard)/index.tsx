import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import LoadingIndicator from '../../components/LoadingIndicator';
import ModuleCard from '../../components/ModuleCard';
import TempAssignmentBanner from '../../components/temp-assignments/TempAssignmentBanner';
import InvoiceScanBanner from '../../components/InvoiceScanBanner';
import InvoiceScanCamera from '../../components/InvoiceScanCamera';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { getAssignedVehicle, getDriverInfo } from '../../lib/auth';
import { useTempAssignments } from '../../lib/hooks/useTempAssignments';
import { getAllowedModulesForDriver, shouldShowVehicleSection } from '../../lib/remoteConfig/moduleAccess';
import { InvoiceScanRequest } from '../../lib/invoiceScanService';
import { DriverInfo } from '../../utils/types';

const ALL_MODULE_DEFINITIONS = [
  { key: 'bookings', title: 'Bookings', iconName: 'cube-outline' },
  { key: 'pickups', title: 'Pickups', iconName: 'arrow-up-circle-outline' },
  { key: 'runsheets', title: 'Run-Sheets', iconName: 'list-outline' },
  { key: 'documents', title: 'Documents', iconName: 'document-text-outline' },
  { key: 'fuel', title: 'Fuel', iconName: 'water' },
  { key: 'truck-log', title: 'Truck Log', iconName: 'time-outline' },
  { key: 'wash', title: 'Wash', iconName: 'car-outline' },
  { key: 'minor-repairs', title: 'Minor Repairs', iconName: 'construct-outline' },
  { key: 'accident', title: 'Accident', iconName: 'warning-outline' },
  { key: 'damage-log', title: 'Damage Log', iconName: 'alert-circle-outline' },
  { key: 'breakdown', title: 'Breakdown', iconName: 'construct-outline' },
  { key: 'uniforms', title: 'Uniforms', iconName: 'shirt-outline' },
  { key: 'important-numbers', title: 'Important Numbers', iconName: 'call-outline' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[]>(['__ALL__']);
  const [showVehicle, setShowVehicle] = useState(true);

  // Invoice scan state
  const [scanCameraVisible, setScanCameraVisible] = useState(false);
  const [activeInvoiceRequest, setActiveInvoiceRequest] = useState<InvoiceScanRequest | null>(null);

  const {
    assignments,
    loading: assignmentsLoading,
    refetch: refetchAssignments,
    hasActiveAssignments,
  } = useTempAssignments(driver?.id);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // TEMP: force clear stale module access cache
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem('module_access_config');
      await AsyncStorage.removeItem('remote_config_module_access');
      await AsyncStorage.removeItem('driver_config_module_access');
      const allKeys = await AsyncStorage.getAllKeys();
      const configKeys = allKeys.filter(k => k.includes('module') || k.includes('config') || k.includes('remote'));
      console.log('=== CLEARING CONFIG KEYS ===', configKeys);
      if (configKeys.length > 0) await AsyncStorage.multiRemove(configKeys);

      const driverData = await getDriverInfo(); setDriver(driverData);

      const driverTypes = driverData?.driver_types || [];
      const [modules, vehicleVisible] = await Promise.all([
        getAllowedModulesForDriver(driverTypes),
        shouldShowVehicleSection(driverTypes),
      ]);
      console.log('=== MODULE ACCESS DEBUG ===');
      console.log('Driver types:', driverTypes);
      console.log('Allowed modules:', modules);
      console.log('=== END MODULE DEBUG ===');
      setAllowedModules(modules); setShowVehicle(vehicleVisible);

      if (driverData?.id && vehicleVisible) {
        const vehicleData = await getAssignedVehicle(driverData.id);
        setVehicle(vehicleData);
      } else {
        setVehicle(null);
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
    } else if (module === 'minor-repairs') {
      console.log('Going to minor repairs screen');
      router.push('/(dashboard)/minor-repairs');
    } else if (module === 'accident') {
      console.log('Going to accident screen');
      router.push('/(dashboard)/accident');
    } else if (module === 'damage-log') {
      console.log('Going to damage log screen');
      router.push('/(dashboard)/damage-log');
    } else if (module === 'breakdown') {
      console.log('Going to breakdown screen');
      router.push('/(dashboard)/breakdown');
    } else if (module === 'uniforms') {
      router.push('/(dashboard)/uniforms');
    } else if (module === 'runsheets') {
      router.push('/(dashboard)/runsheets');
    } else if (module === 'important-numbers') {
      router.push('/(dashboard)/important-numbers');
    } else if (module === 'bookings') {
      router.push('/(dashboard)/bookings');
    } else if (module === 'pickups') {
      router.push('/(dashboard)/pickups');
    }
  };

  const isAllAccess = allowedModules.includes('__ALL__');
  const visibleModules = ALL_MODULE_DEFINITIONS.filter(
    (m) => isAllAccess || allowedModules.includes(m.key)
  );

  const moduleRows: (typeof ALL_MODULE_DEFINITIONS)[] = [];
  for (let i = 0; i < visibleModules.length; i += 2) {
    moduleRows.push(visibleModules.slice(i, i + 2));
  }

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

        {showVehicle && (
          vehicle ? (
            <View style={styles.vehicleInfoCard}>
              <Text style={styles.vehicleNumber}>{vehicle.license_plate}</Text>
              <Text style={styles.fuelType}>{vehicle.fuel_type || 'N/A'}</Text>
            </View>
          ) : (
            <View style={styles.noVehicleCard}>
              <Text style={styles.noVehicleText}>No Vehicle</Text>
            </View>
          )
        )}
      </View>

      {driver?.id && hasActiveAssignments && assignments.length > 0 && (
        <TempAssignmentBanner
          assignment={assignments[0]}
          onRefresh={refetchAssignments}
        />
      )}

      {driver?.bizhandle_staff_id && (
        <InvoiceScanBanner
          bizhandleStaffId={driver.bizhandle_staff_id}
          onAccept={(req) => {
            setActiveInvoiceRequest(req);
            setScanCameraVisible(true);
          }}
        />
      )}

      <InvoiceScanCamera
        visible={scanCameraVisible}
        request={activeInvoiceRequest}
        onComplete={() => {
          setScanCameraVisible(false);
          setActiveInvoiceRequest(null);
        }}
        onCancel={() => {
          setScanCameraVisible(false);
          setActiveInvoiceRequest(null);
        }}
      />

      <View style={styles.modulesGrid}>
        {moduleRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.moduleRow}>
            {row.map((mod) => (
              <ModuleCard
                key={mod.key}
                title={mod.title}
                iconName={mod.iconName}
                onPress={() => navigateToModule(mod.key)}
              />
            ))}
            {row.length === 1 && <View style={styles.moduleCardPlaceholder} />}
          </View>
        ))}
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