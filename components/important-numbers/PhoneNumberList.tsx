import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PhoneNumberCard from './PhoneNumberCard';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { ImportantPhoneNumber } from '../../utils/importantNumbersTypes';

interface PhoneNumberListProps {
  phoneNumbers: ImportantPhoneNumber[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function PhoneNumberList({ phoneNumbers, loading = false, refreshing = false, onRefresh }: PhoneNumberListProps) {
  const renderPhoneNumber = ({ item }: { item: ImportantPhoneNumber }) => (
    <PhoneNumberCard phoneNumber={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="call-outline" size={80} color={colors.gray300} />
      </View>
      <Text style={styles.emptyStateTitle}>No Important Numbers</Text>
      <Text style={styles.emptyStateDescription}>
        Important contact numbers will appear here when they are added by the administrator.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Emergency & Important Contacts</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{phoneNumbers.length}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Tap any number to call directly
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading important numbers...</Text>
      </View>
    );
  }

  if (phoneNumbers.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        contentContainerStyle={styles.container}
      />
    );
  }

  return (
    <FlatList
      data={phoneNumbers}
      renderItem={renderPhoneNumber}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: layouts.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: layouts.spacing.sm,
    paddingVertical: layouts.spacing.xs,
    borderRadius: layouts.borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
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