import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../../../components/LoadingIndicator';
import MinorRepairList from '../../../components/minor-repairs/MinorRepairList';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { fetchDriverMinorRepairs } from '../../../lib/minorRepairsService';
import { MinorRepair } from '../../../utils/minorRepairsTypes';

export default function MinorRepairsScreen() {
  const router = useRouter();
  const [minorRepairs, setMinorRepairs] = useState<MinorRepair[]>([]);
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
      const repairs = await fetchDriverMinorRepairs(driverInfo.id);
      setMinorRepairs(repairs);
    } catch (err) {
      console.error('Error loading minor repairs:', err);
      setError('Failed to load minor repairs');
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

  const handleAddRepair = () => {
    router.push('/(dashboard)/minor-repairs/add');
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading minor repairs..." />;
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
          <Text style={styles.title}>Minor Repairs</Text>
          <Text style={styles.subtitle}>
            Report minor vehicle repairs and track maintenance costs
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddRepair}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonContent}>
            <View style={styles.addButtonIcon}>
              <Ionicons name="construct" size={24} color={colors.background} />
            </View>
            <View style={styles.addButtonText}>
              <Text style={styles.addButtonTitle}>Report Repair</Text>
              <Text style={styles.addButtonSubtitle}>
                Add details about a minor vehicle repair
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

        <MinorRepairList minorRepairs={minorRepairs} />
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
    backgroundColor: colors.warning,
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