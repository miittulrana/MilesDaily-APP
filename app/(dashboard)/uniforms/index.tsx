import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../../components/ErrorMessage';
import LoadingIndicator from '../../../components/LoadingIndicator';
import UniformCard from '../../../components/uniforms/UniformCard';
import RequestForm from '../../../components/uniforms/RequestForm';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { useUniformInventory, useUniformRequests } from '../../../lib/hooks/useUniforms';
import { UniformInventoryItem, CreateRequestData } from '../../../utils/uniformTypes';

export default function UniformsScreen() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UniformInventoryItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { 
    inventory, 
    loading: inventoryLoading, 
    error: inventoryError, 
    refetch: refetchInventory 
  } = useUniformInventory(undefined, categoryFilter === 'all' ? undefined : categoryFilter);

  const { createRequest } = useUniformRequests();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchInventory();
    setRefreshing(false);
  }, [refetchInventory]);

  const handleItemPress = (item: UniformInventoryItem) => {
    if (item.can_request) {
      setSelectedItem(item);
      setShowRequestForm(true);
    }
  };

  const handleSubmitRequest = async (requestData: CreateRequestData) => {
    await createRequest(requestData);
    await refetchInventory();
  };

  const filteredInventory = inventory.filter(item => {
    if (categoryFilter === 'all') return true;
    return item.uniform_type?.category === categoryFilter;
  });

  const availableItems = filteredInventory.filter(item => item.can_request);
  const unavailableItems = filteredInventory.filter(item => !item.can_request);

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'clothing', label: 'Clothing' },
    { key: 'accessories', label: 'Accessories' }
  ];

  if (inventoryLoading) {
    return <LoadingIndicator fullScreen message="Loading uniforms..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request Uniforms</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/(dashboard)/uniforms/preferences')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/(dashboard)/uniforms/allocations')}
          >
            <Ionicons name="shirt-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {inventoryError && <ErrorMessage message={inventoryError} />}

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.filterButton,
                categoryFilter === category.key && styles.filterButtonActive
              ]}
              onPress={() => setCategoryFilter(category.key)}
            >
              <Text style={[
                styles.filterButtonText,
                categoryFilter === category.key && styles.filterButtonTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={[...availableItems, ...unavailableItems]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UniformCard 
            item={item} 
            onPress={handleItemPress}
            disabled={!item.can_request}
          />
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="shirt-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyStateTitle}>No Uniforms Available</Text>
            <Text style={styles.emptyStateDescription}>
              No uniform items are currently available for request
            </Text>
          </View>
        }
      />

      <RequestForm
        visible={showRequestForm}
        item={selectedItem}
        onClose={() => {
          setShowRequestForm(false);
          setSelectedItem(null);
        }}
        onSubmit={handleSubmitRequest}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: layouts.spacing.sm,
  },
  headerButton: {
    padding: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.gray100,
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