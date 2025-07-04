import { StyleSheet, Text, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DamageLogCard from './DamageLogCard';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DamageLog } from '../../utils/damageLogTypes';

interface DamageLogListProps {
  damageLogs: DamageLog[];
}

export default function DamageLogList({ damageLogs }: DamageLogListProps) {
  const renderDamageLog = ({ item }: { item: DamageLog }) => (
    <DamageLogCard damageLog={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="warning-outline" size={80} color={colors.gray300} />
      </View>
      <Text style={styles.emptyStateTitle}>No Damage Reports</Text>
      <Text style={styles.emptyStateDescription}>
        You haven't reported any vehicle damage yet. If you notice any damage to your assigned vehicle, use the "Report Damage" button to document it.
      </Text>
    </View>
  );

  if (damageLogs.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Damage Reports</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{damageLogs.length}</Text>
        </View>
      </View>

      <FlatList
        data={damageLogs}
        renderItem={renderDamageLog}
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
  countBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: layouts.spacing.sm,
    paddingVertical: layouts.spacing.xs,
    borderRadius: layouts.borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
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