import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import LoadingIndicator from '../../components/LoadingIndicator';
import ModuleCard from '../../components/ModuleCard';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { getDriverInfo } from '../../lib/auth';
import { DriverInfo } from '../../utils/types';

export default function DashboardScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const driverData = await getDriverInfo();
        setDriver(driverData);
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

      <View style={styles.modulesSection}>
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