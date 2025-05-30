import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import ErrorMessage from '../../../components/ErrorMessage';
import LoadingIndicator from '../../../components/LoadingIndicator';
import AllocationCard from '../../../components/uniforms/AllocationCard';
import ReturnForm from '../../../components/uniforms/ReturnForm';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { useDriverAllocations, useUniformReturns } from '../../../lib/hooks/useUniforms';
import { DriverUniformAllocation, CreateReturnData } from '../../../utils/uniformTypes';
import { Alert } from 'react-native';

export default function AllocationsScreen() {
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<DriverUniformAllocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { 
    allocations, 
    loading: allocationsLoading, 
    error: allocationsError, 
    refetch: refetchAllocations 
  } = useDriverAllocations();

  const { createReturn } = useUniformReturns();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchAllocations();
    setRefreshing(false);
  }, [refetchAllocations]);

  const handleReturnRequest = (allocation: DriverUniformAllocation) => {
    setSelectedAllocation(allocation);
    setShowReturnForm(true);
  };

  const handleSubmitReturn = async (returnData: CreateReturnData) => {
    try {
      await createReturn(returnData);
      Alert.alert('Success', 'Return request submitted successfully');
      await refetchAllocations();
    } catch (error) {
      throw error;
    }
  };

  const totalAllocations = allocations.reduce((sum, allocation) => sum + allocation.quantity_allocated, 0);
  const uniqueTypes = new Set(allocations.map(a => a.uniform_type?.name)).size;

  const groupedAllocations = allocations.reduce((acc, allocation) => {
    const category = allocation.uniform_type?.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(allocation);
    return acc;
  }, {} as Record<string, DriverUniformAllocation[]>);

  if (allocationsLoading) {
    return <LoadingIndicator fullScreen message="Loading allocations..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Uniforms</Text>
      </View>

      {allocationsError && <ErrorMessage message={allocationsError} />}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalAllocations}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{uniqueTypes}</Text>
          <Text style={styles.statLabel}>Uniform Types</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Object.keys(groupedAllocations).length}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </View>

      {allocations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyStateTitle}>No Uniforms Allocated</Text>
          <Text style={styles.emptyStateDescription}>
            You don&apos;t have any uniforms allocated to you yet. Submit requests to get uniforms.
          </Text>
        </View>
      ) : (
        <FlatList
          data={Object.entries(groupedAllocations)}
          keyExtractor={([category]) => category}
          renderItem={({ item: [category, categoryAllocations] }) => (
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              {categoryAllocations.map(allocation => (
                <AllocationCard
                  key={allocation.id}
                  allocation={allocation}
                  onReturn={handleReturnRequest}
                />
              ))}
            </View>
          )}
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
        />
      )}

      <ReturnForm
        visible={showReturnForm}
        allocation={selectedAllocation}
        onClose={() => {
          setShowReturnForm(false);
          setSelectedAllocation(null);
        }}
        onSubmit={handleSubmitReturn}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: layouts.spacing.lg,
    paddingVertical: layouts.spacing.lg,
    gap: layouts.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  listContent: {
    padding: layouts.spacing.lg,
  },
  categorySection: {
    marginBottom: layouts.spacing.xl,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layouts.spacing.lg,
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
  },
});