import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/Colors';
import { FuelRecord } from '../../utils/types';
import { formatDateTime } from '../../utils/dateUtils';
import { formatCurrency, formatDistance } from '../../utils/numberUtils';
import { layouts } from '../../constants/layouts';

type FuelRecordCardProps = {
  record: FuelRecord;
  onPress?: (record: FuelRecord) => void;
  showManualTag?: boolean;
};

export default function FuelRecordCard({ record, onPress, showManualTag = false }: FuelRecordCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(record);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.amount}>{formatCurrency(record.amount_euros)}</Text>
        <Text style={styles.date}>{formatDateTime(record.created_at)}</Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Current Km</Text>
          <Text style={styles.value}>{formatDistance(record.current_km)}</Text>
        </View>
        
        {record.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notes}>{record.notes}</Text>
          </View>
        )}
      </View>
      
      {showManualTag && record.is_manual_entry && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Admin</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
    paddingBottom: layouts.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  date: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  details: {
    gap: layouts.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textLight,
  },
  value: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: layouts.spacing.sm,
    paddingTop: layouts.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  notes: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: layouts.borderRadius.lg,
    borderBottomLeftRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
  },
});