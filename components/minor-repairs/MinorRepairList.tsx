import { StyleSheet, Text, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MinorRepairCard from './MinorRepairCard';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { MinorRepair } from '../../utils/minorRepairsTypes';

interface MinorRepairListProps {
  minorRepairs: MinorRepair[];
}

export default function MinorRepairList({ minorRepairs }: MinorRepairListProps) {
  const renderRepair = ({ item }: { item: MinorRepair }) => (
    <MinorRepairCard repair={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="construct-outline" size={80} color={colors.gray300} />
      </View>
      <Text style={styles.emptyStateTitle}>No Minor Repairs</Text>
      <Text style={styles.emptyStateDescription}>
        You haven't reported any minor repairs yet. Use the "Report Repair" button to document vehicle maintenance and repairs.
      </Text>
    </View>
  );

  const calculateTotalCost = () => {
    return minorRepairs.reduce((total, repair) => total + repair.cost_euros, 0);
  };

  if (minorRepairs.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Minor Repairs</Text>
        <View style={styles.statsContainer}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{minorRepairs.length}</Text>
          </View>
          <View style={styles.totalCostBadge}>
            <Text style={styles.totalCostText}>€{calculateTotalCost().toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={minorRepairs}
        renderItem={renderRepair}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
    paddingBottom: layouts.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  countBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: layouts.spacing.sm,
    paddingVertical: layouts.spacing.xs,
    borderRadius: layouts.borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  totalCostBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: layouts.spacing.sm,
    paddingVertical: layouts.spacing.xs,
    borderRadius: layouts.borderRadius.full,
    alignItems: 'center',
  },
  totalCostText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xxl * 2,
    paddingHorizontal: layouts.spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: layouts.borderRadius.xxl,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layouts.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});