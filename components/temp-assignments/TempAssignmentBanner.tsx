import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ExtensionModal from './ExtensionModal';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { TempAssignment, TimeRemaining } from '../../utils/tempAssignmentTypes';
import { calculateTimeRemaining } from '../../utils/dateUtils';
import { completeTempAssignment } from '../../lib/tempAssignmentService';

interface TempAssignmentBannerProps {
  assignment: TempAssignment;
  onRefresh: () => void;
}

export default function TempAssignmentBanner({ assignment, onRefresh }: TempAssignmentBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateTimeRemaining(assignment.end_datetime);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [assignment.end_datetime]);

  const handleComplete = () => {
    Alert.alert(
      'Complete Assignment',
      'Are you sure you want to complete this temporary assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setCompleting(true);
              await completeTempAssignment(assignment.id);
              Alert.alert('Success', 'Assignment completed successfully!');
              onRefresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to complete assignment. Please try again.');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (time: TimeRemaining) => {
    return `${String(time.days).padStart(2, '0')}D ${String(time.hours).padStart(2, '0')}H ${String(time.minutes).padStart(2, '0')}M`;
  };

  if (!timeRemaining) return null;

  return (
    <>
      <View style={styles.container}>
        <LinearGradient
          colors={timeRemaining.isExpired ? [colors.error, '#dc2626'] : [colors.primary, colors.primaryDark]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.topRow}>
            <View style={styles.leftSection}>
              <View style={styles.headerInline}>
                <Ionicons name="time-outline" size={16} color={colors.background} />
                <Text style={styles.title}>Temp Assignment</Text>
                <Text style={styles.subtitle}>
                  {timeRemaining.isExpired ? 'EXPIRED' : 'ACTIVE'}
                </Text>
              </View>
              <Text style={styles.vehiclePlate}>
                {assignment.vehicle?.license_plate}
              </Text>
              <Text style={styles.vehicleDetails}>
                {assignment.vehicle?.brand} {assignment.vehicle?.model}
              </Text>
            </View>

            <View style={styles.timerSection}>
              <Text style={styles.timer}>
                {timeRemaining.isExpired ? '00D 00H 00M' : formatTime(timeRemaining)}
              </Text>
              <Text style={styles.timerLabel}>
                {timeRemaining.isExpired ? 'Expired' : 'Remaining'}
              </Text>
            </View>
          </View>

          <View style={styles.reasonContainer}>
            <Text style={styles.reasonText} numberOfLines={1}>
              {assignment.assignment_reason}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowExtensionModal(true)}
            >
              <Ionicons name="time" size={14} color={colors.background} />
              <Text style={styles.actionButtonText}>Extend</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleComplete}
              disabled={completing}
            >
              <Ionicons name="checkmark-circle" size={14} color={colors.background} />
              <Text style={styles.actionButtonText}>
                {completing ? 'Completing...' : 'Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ExtensionModal
        visible={showExtensionModal}
        assignment={assignment}
        onClose={() => setShowExtensionModal(false)}
        onSuccess={onRefresh}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: layouts.spacing.lg,
    marginBottom: layouts.spacing.md,
    borderRadius: layouts.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  gradient: {
    padding: layouts.spacing.md,
  },
  topRow: {
    marginBottom: layouts.spacing.sm,
  },
  leftSection: {
    flex: 1,
  },
  headerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleInfo: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
    marginLeft: 4,
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 9,
    color: colors.background,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.background,
    marginBottom: 2,
  },
  vehicleDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timerSection: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  timer: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.background,
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  reasonContainer: {
    marginBottom: layouts.spacing.sm,
    paddingHorizontal: 2,
  },
  reasonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: layouts.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    borderRadius: layouts.borderRadius.sm,
    gap: 4,
  },
  completeButton: {
    backgroundColor: 'rgb(10, 109, 40)',
  },
  actionButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
});