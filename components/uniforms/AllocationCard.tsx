import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DriverUniformAllocation } from '../../utils/uniformTypes';
import { formatDateTime } from '../../utils/dateUtils';

interface AllocationCardProps {
  allocation: DriverUniformAllocation;
  onReturn?: (allocation: DriverUniformAllocation) => void;
}

export default function AllocationCard({ allocation, onReturn }: AllocationCardProps) {
  const getProgressPercentage = () => {
    if (!allocation.max_limit) return 0;
    return (allocation.quantity_allocated / allocation.max_limit) * 100;
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return colors.error;
    if (percentage >= 80) return colors.warning;
    return colors.success;
  };

  const canReturn = allocation.quantity_allocated > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{allocation.uniform_type?.name}</Text>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>
            {allocation.quantity_allocated}/{allocation.max_limit || 1}
          </Text>
        </View>
      </View>

      <Text style={styles.size}>Size: {allocation.uniform_size?.name}</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${Math.min(getProgressPercentage(), 100)}%`,
                backgroundColor: getProgressColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgressPercentage())}% of limit
        </Text>
      </View>

      <View style={styles.details}>
        {allocation.allocated_at && (
          <Text style={styles.detailText}>
            Allocated: {formatDateTime(allocation.allocated_at)}
          </Text>
        )}
        
        {allocation.can_request_more && (
          <Text style={[styles.detailText, { color: colors.success }]}>
            Can request more
          </Text>
        )}
        
        {!allocation.can_request_more && allocation.quantity_allocated >= (allocation.max_limit || 1) && (
          <Text style={[styles.detailText, { color: colors.warning }]}>
            At maximum limit
          </Text>
        )}
      </View>

      {canReturn && onReturn && (
        <TouchableOpacity 
          style={styles.returnButton}
          onPress={() => onReturn(allocation)}
        >
          <Text style={styles.returnButtonText}>Request Return</Text>
        </TouchableOpacity>
      )}
    </View>
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
  quantityBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: layouts.borderRadius.full,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  size: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.md,
  },
  progressContainer: {
    marginBottom: layouts.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: layouts.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  details: {
    gap: layouts.spacing.xs,
    marginBottom: layouts.spacing.md,
  },
  detailText: {
    fontSize: 12,
    color: colors.textLight,
  },
  returnButton: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: layouts.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  returnButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.warning,
  },
});