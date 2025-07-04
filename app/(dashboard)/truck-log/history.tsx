import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverSessions } from '../../../lib/truckLogService';
import { TruckLogSession } from '../../../utils/truckLogTypes';
import { formatDateTime, formatDate } from '../../../utils/dateUtils';

export default function SessionHistoryScreen() {
  const [sessions, setSessions] = useState<TruckLogSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSessions(true);
  }, []);

  const loadSessions = async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
        setSessions([]);
      }
      setError(null);
      
      const offset = refresh ? 0 : sessions.length;
      const data = await getDriverSessions({
        limit: 20,
        offset,
      });
      
      if (refresh) {
        setSessions(data);
      } else {
        setSessions(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 20);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions(true);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    await loadSessions(false);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'In Progress';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getSessionStatus = (session: TruckLogSession) => {
    return session.is_active ? 'Active' : 'Completed';
  };

  const getStatusColor = (session: TruckLogSession) => {
    return session.is_active ? colors.success : colors.gray500;
  };

  const renderSessionItem = ({ item }: { item: TruckLogSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehiclePlate}>
            {item.vehicle?.license_plate || 'Unknown Vehicle'}
          </Text>
          <Text style={styles.vehicleDetails}>
            {item.vehicle?.brand} {item.vehicle?.model} - {item.vehicle?.type}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item) + '20' }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item) }
          ]} />
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item) }
          ]}>
            {getSessionStatus(item)}
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Ionicons name="play-circle-outline" size={16} color={colors.success} />
            <View style={styles.timeContent}>
              <Text style={styles.timeLabel}>Started</Text>
              <Text style={styles.timeValue}>
                {formatDateTime(item.punch_in_at)}
              </Text>
            </View>
          </View>

          {item.punch_out_at && (
            <View style={styles.timeItem}>
              <Ionicons name="stop-circle-outline" size={16} color={colors.error} />
              <View style={styles.timeContent}>
                <Text style={styles.timeLabel}>Ended</Text>
                <Text style={styles.timeValue}>
                  {formatDateTime(item.punch_out_at)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.durationContainer}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.durationText}>
            Duration: {formatDuration(item.session_duration_minutes)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <LoadingIndicator size="small" color={colors.primary} message="" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyTitle}>No Session History</Text>
      <Text style={styles.emptyDescription}>
        Your session history will appear here once you start using the truck log.
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading session history..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session History</Text>
        <Text style={styles.description}>
          View your previous truck log sessions
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadSessions(true)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: layouts.spacing.lg,
    paddingBottom: layouts.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    margin: layouts.spacing.lg,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginLeft: layouts.spacing.sm,
    flex: 1,
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingVertical: layouts.spacing.xs,
    paddingHorizontal: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.sm,
  },
  retryText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    padding: layouts.spacing.lg,
    paddingTop: 0,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layouts.spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  vehicleDetails: {
    fontSize: 14,
    color: colors.textLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xs,
    paddingHorizontal: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.full,
    gap: layouts.spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionDetails: {
    gap: layouts.spacing.md,
  },
  timeRow: {
    gap: layouts.spacing.md,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  timeContent: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    gap: layouts.spacing.sm,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  loadingFooter: {
    padding: layouts.spacing.lg,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: layouts.spacing.xl,
    marginTop: layouts.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.lg,
    marginBottom: layouts.spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});