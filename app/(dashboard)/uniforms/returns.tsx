import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../../components/ErrorMessage';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { useUniformReturns } from '../../../lib/hooks/useUniforms';
import { UniformReturnRequest } from '../../../utils/uniformTypes';
import { formatDateTime } from '../../../utils/dateUtils';

export default function ReturnsScreen() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { 
    returns, 
    loading, 
    error, 
    refetch 
  } = useUniformReturns();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredReturns = returns.filter(returnRequest => {
    if (statusFilter === 'all') return true;
    return returnRequest.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'approved': return colors.info;
      case 'completed': return colors.success;
      default: return colors.gray400;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'approved': return 'checkmark-circle-outline';
      case 'completed': return 'checkmark-done-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderReturnCard = ({ item }: { item: UniformReturnRequest }) => (
    <View style={styles.returnCard}>
      <View style={styles.returnHeader}>
        <Text style={styles.returnTitle}>{item.uniform_type?.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) + '20' }
        ]}>
          <Ionicons 
            name={getStatusIcon(item.status) as any} 
            size={14} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.returnSize}>Size: {item.uniform_size?.name}</Text>

      <View style={styles.returnDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity to return:</Text>
          <Text style={styles.detailValue}>{item.quantity_to_return}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requested:</Text>
          <Text style={styles.detailValue}>{formatDateTime(item.created_at!)}</Text>
        </View>

        {item.processed_at && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Processed:</Text>
            <Text style={styles.detailValue}>{formatDateTime(item.processed_at)}</Text>
          </View>
        )}
      </View>

      {item.reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      )}

      {item.status === 'approved' && (
        <View style={styles.instructionContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.instructionText}>
            Please bring the uniforms to the office for physical return
          </Text>
        </View>
      )}
    </View>
  );

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'completed', label: 'Completed' }
  ];

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading returns..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Return Requests</Text>
      </View>

      {error && <ErrorMessage message={error} />}

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === item.key && styles.filterButtonActive
              ]}
              onPress={() => setStatusFilter(item.key)}
            >
              <Text style={[
                styles.filterButtonText,
                statusFilter === item.key && styles.filterButtonTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        />
      </View>

      <FlatList
        data={filteredReturns}
        keyExtractor={(item) => item.id}
        renderItem={renderReturnCard}
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="return-up-back-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyStateTitle}>No Return Requests</Text>
            <Text style={styles.emptyStateDescription}>
              {statusFilter === 'all' 
                ? 'You haven\'t made any return requests yet'
                : `No ${statusFilter} return requests found`
              }
            </Text>
          </View>
        }
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
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  filterContainer: {
    paddingVertical: layouts.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  filterContent: {
    paddingHorizontal: layouts.spacing.lg,
    gap: layouts.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  filterButtonTextActive: {
    color: colors.background,
  },
  listContent: {
    padding: layouts.spacing.lg,
  },
  returnCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
  },
  returnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layouts.borderRadius.sm,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  returnSize: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.md,
  },
  returnDetails: {
    gap: layouts.spacing.xs,
    marginBottom: layouts.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  reasonContainer: {
    marginBottom: layouts.spacing.sm,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  reasonText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '10',
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.sm,
    gap: layouts.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xxxl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.lg,
    marginBottom: layouts.spacing.sm,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: layouts.spacing.lg,
  },
});