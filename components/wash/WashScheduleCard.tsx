import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { WashSchedule } from '../../utils/types';

type WashScheduleCardProps = {
  schedule: WashSchedule;
  vehicle: any;
  onComplete: (schedule: WashSchedule) => void;
};

export default function WashScheduleCard({ schedule, vehicle, onComplete }: WashScheduleCardProps) {
  const isCompleted = schedule.status === 'completed';
  const scheduledDate = new Date(schedule.scheduled_date);
  const completedDate = schedule.completed_at ? new Date(schedule.completed_at) : null;
  const isEarlyCompletion = completedDate && completedDate < scheduledDate;

  const getStatusColor = () => {
    if (isCompleted) {
      return isEarlyCompletion ? colors.warning : colors.success;
    }
    return colors.gray400;
  };

  const getStatusText = () => {
    if (isCompleted) {
      if (isEarlyCompletion) {
        return `Completed Early (${completedDate?.toLocaleDateString()})`;
      }
      return 'Completed';
    }
    return 'Pending';
  };

  const getCompletionDetails = () => {
    if (!isCompleted || !schedule.completed_at) return null;

    const completedBy = schedule.completed_by_type === 'driver' ? 'You' : 'Admin';
    const completedTime = new Date(schedule.completed_at).toLocaleString();

    return (
      <View style={styles.completionDetails}>
        <Text style={styles.completionText}>
          Completed by: {completedBy}
        </Text>
        <Text style={styles.completionTime}>
          {completedTime}
        </Text>
        {schedule.admin_reason && (
          <Text style={styles.adminReason}>
            Reason: {schedule.admin_reason}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
          <Text style={styles.vehicleDetails}>
            {vehicle.brand} {vehicle.model}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.scheduleInfo}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
          <Text style={styles.dateText}>
            {scheduledDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
      </View>

      {getCompletionDetails()}

      {schedule.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{schedule.notes}</Text>
        </View>
      )}

      {!isCompleted && (
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={() => onComplete(schedule)}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.background} />
          <Text style={styles.completeButtonText}>Mark as Complete</Text>
        </TouchableOpacity>
      )}

      {isCompleted && schedule.image_url && (
        <View style={styles.imageIndicator}>
          <Ionicons name="camera-outline" size={16} color={colors.success} />
          <Text style={styles.imageIndicatorText}>Photo attached</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginVertical: layouts.spacing.sm,
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
    alignItems: 'flex-start',
    marginBottom: layouts.spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: layouts.spacing.xs,
  },
  vehicleDetails: {
    fontSize: 14,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: layouts.spacing.sm,
    paddingVertical: 4,
    borderRadius: layouts.borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  scheduleInfo: {
    marginBottom: layouts.spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.xs,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  completionDetails: {
    backgroundColor: colors.success + '10',
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.sm,
    marginBottom: layouts.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  completionText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  completionTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  adminReason: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  notesContainer: {
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.sm,
    marginBottom: layouts.spacing.md,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
  },
  completeButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: layouts.borderRadius.md,
    gap: layouts.spacing.xs,
  },
  completeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  imageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layouts.spacing.xs,
    paddingVertical: layouts.spacing.xs,
  },
  imageIndicatorText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
});