import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../../../components/LoadingIndicator';
import DamageLogList from '../../../components/damage-log/DamageLogList';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { fetchDriverDamageLogs } from '../../../lib/damageLogService';
import { DamageLog } from '../../../utils/damageLogTypes';

export default function DamageLogScreen() {
  const router = useRouter();
  const [damageLogs, setDamageLogs] = useState<DamageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const driverInfo = await getDriverInfo();
      if (!driverInfo?.id) {
        setError('Driver information not found');
        return;
      }

      setDriverId(driverInfo.id);
      const logs = await fetchDriverDamageLogs(driverInfo.id);
      setDamageLogs(logs);
    } catch (err) {
      console.error('Error loading damage logs:', err);
      setError('Failed to load damage logs');
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
    setRefreshing(false);
  };

  const handleAddDamageLog = () => {
    router.push('/(dashboard)/damage-log/add');
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading damage logs..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        <View style={styles.header}>
          <Text style={styles.title}>Damage Log</Text>
          <Text style={styles.subtitle}>
            Report vehicle damage and view your damage history
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddDamageLog}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonContent}>
            <View style={styles.addButtonIcon}>
              <Ionicons name="camera" size={24} color={colors.background} />
            </View>
            <View style={styles.addButtonText}>
              <Text style={styles.addButtonTitle}>Report Damage</Text>
              <Text style={styles.addButtonSubtitle}>
                Take a photo and report vehicle damage
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.background} />
          </View>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <DamageLogList damageLogs={damageLogs} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  header: {
    marginBottom: layouts.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: colors.error,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: layouts.borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layouts.spacing.md,
  },
  addButtonText: {
    flex: 1,
  },
  addButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
    marginBottom: layouts.spacing.xs,
  },
  addButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
});