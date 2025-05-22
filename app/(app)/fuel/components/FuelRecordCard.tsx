import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../../constants/colors';
import { FuelRecord } from '../../fuel/types';
import { formatDateTime } from '../../../../utils/dateUtils';
import { formatCurrency, formatDistance } from '../../../../utils/numberUtils';

type FuelRecordCardProps = {
  record: FuelRecord;
  onPress?: (record: FuelRecord) => void;
};

export default function FuelRecordCard({ record, onPress }: FuelRecordCardProps) {
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
    >
      <View style={styles.header}>
        <Text style={styles.amount}>{formatCurrency(record.amount_euros)}</Text>
        <Text style={styles.date}>{formatDateTime(record.created_at)}</Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Vehicle:</Text>
          <Text style={styles.value}>
            {record.vehicle?.license_plate} {record.vehicle?.brand} {record.vehicle?.model}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Odometer:</Text>
          <Text style={styles.value}>{formatDistance(record.current_km)}</Text>
        </View>
        
        {record.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notes}>{record.notes}</Text>
          </View>
        )}
      </View>
      
      {record.is_manual_entry && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Manual Entry</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  date: {
    fontSize: 14,
    color: colors.gray500,
  },
  details: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
    width: 80,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
  },
});