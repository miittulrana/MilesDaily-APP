import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { UniformInventoryItem } from '../../utils/uniformTypes';

interface UniformCardProps {
  item: UniformInventoryItem;
  onPress: (item: UniformInventoryItem) => void;
  disabled?: boolean;
}

export default function UniformCard({ item, onPress, disabled = false }: UniformCardProps) {
  const getStockStatusColor = () => {
    if (!item.can_request) return colors.gray400;
    return colors.success;
  };

  const getStockStatusText = () => {
    if (!item.can_request && item.driver_pending_requests && item.driver_pending_requests > 0) {
      return 'Pending Request';
    }
    if (item.requires_return) {
      return 'Return Required';
    }
    return 'Available';
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        disabled && styles.containerDisabled
      ]} 
      onPress={() => onPress(item)}
      disabled={disabled || (!item.can_request && item.driver_pending_requests! > 0)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{item.uniform_type?.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStockStatusColor() + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStockStatusColor() }
          ]}>
            {getStockStatusText()}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{item.uniform_type?.description}</Text>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Size:</Text>
          <Text style={styles.detailValue}>{item.uniform_size?.name}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>You have:</Text>
          <Text style={styles.detailValue}>
            {item.driver_current_allocation}/{item.maximum_limit_per_driver}
          </Text>
        </View>

        {item.requires_return && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Must return first:</Text>
            <Text style={[styles.detailValue, { color: colors.warning }]}>
              {item.min_return_needed} items
            </Text>
          </View>
        )}
      </View>

      {item.driver_pending_requests && item.driver_pending_requests > 0 && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>
            {item.driver_pending_requests} pending
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  containerDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layouts.borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.md,
  },
  details: {
    gap: layouts.spacing.xs,
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
  pendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layouts.borderRadius.sm,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
  },
  returnSection: {
    backgroundColor: colors.warning + '10',
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    marginTop: layouts.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.xs,
  },
  returnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  returnControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  returnButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  returnQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  returnNote: {
    fontSize: 11,
    color: colors.text,
    fontStyle: 'italic',
  },
  errorNote: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '500',
    marginTop: layouts.spacing.xs,
  },
  actionButton: {
    backgroundColor: colors.primary + '20',
    borderRadius: layouts.borderRadius.md,
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    marginTop: layouts.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});