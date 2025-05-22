import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import LoadingIndicator from '../../../../components/LoadingIndicator';
import { colors } from '../../../../constants/colors';
import { layouts } from '../../../../constants/layouts';
import { getDriverInfo } from '../../../../lib/auth';
import { useFuelStats } from '../../fuel/hooks';
import { DriverInfo } from '../../fuel/types';
import { formatConsumption, formatCurrency, formatDistance, formatVolume } from '../../../../utils/numberUtils';

export default function FuelStatsScreen() {
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadDriver = async () => {
      try {
        setLoading(true);
        const driverData = await getDriverInfo();
        setDriver(driverData);
      } catch (error) {
        console.error('Error loading driver info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, []);

  const { stats, loading: statsLoading } = useFuelStats(driver?.id || '');

  if (loading || statsLoading) {
    return <LoadingIndicator fullScreen message="Loading statistics..." />;
  }

  if (!driver) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Unable to load driver information</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No statistics available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fuel Consumption Statistics</Text>
      
      <View style={styles.statsSection}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(stats.total_spent_euros)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDistance(stats.total_distance_km)}</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatVolume(stats.total_liters)}</Text>
            <Text style={styles.statLabel}>Total Fuel</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.record_count}</Text>
            <Text style={styles.statLabel}>Records Count</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.consumptionCard}>
        <Text style={styles.consumptionTitle}>Average Consumption</Text>
        <Text style={styles.consumptionValue}>
          {formatConsumption(stats.avg_consumption_per_100km)}
        </Text>
        <Text style={styles.consumptionDescription}>
          This is your average fuel consumption per 100 kilometers based on all recorded fuel entries.
        </Text>
      </View>
      
      <View style={styles.lastReadingCard}>
        <Text style={styles.lastReadingLabel}>Last Odometer Reading</Text>
        <Text style={styles.lastReadingValue}>{formatDistance(stats.last_km_reading)}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.lg,
  },
  statsSection: {
    marginBottom: layouts.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: layouts.spacing.md,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  consumptionCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  consumptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  consumptionValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: layouts.spacing.md,
  },
  consumptionDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  lastReadingCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  lastReadingLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  lastReadingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
});