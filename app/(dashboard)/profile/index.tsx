import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import LoadingIndicator from '../../../components/LoadingIndicator';
import ProfileInfo from '../../../components/profile/ProfileInfo';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { DriverInfo } from '../../../utils/types';

export default function ProfileScreen() {
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const driverData = await getDriverInfo();
        setDriver(driverData);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading profile..." />;
  }

  if (!driver) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Unable to load profile information</Text>
      </View>
    );
  }

  const getDriverName = () => {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {driver.first_name?.[0] || driver.email?.[0] || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{getDriverName()}</Text>
        <Text style={styles.email}>{driver.email}</Text>
        {driver.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{getRoleLabel(driver.role)}</Text>
          </View>
        )}
      </View>

      <ProfileInfo driver={driver} />
    </ScrollView>
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
  },
  content: {
    padding: layouts.spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: layouts.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.background,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  email: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: layouts.spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: layouts.borderRadius.full,
  },
  roleBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
});