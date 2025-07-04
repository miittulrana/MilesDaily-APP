import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { TruckLogSession } from '../../utils/truckLogTypes';

interface SessionStatusProps {
  activeSession: TruckLogSession | null;
  onViewSession: () => void;
  onRefresh: () => void;
}

export default function SessionStatus({ activeSession, onViewSession, onRefresh }: SessionStatusProps) {
  const [currentDuration, setCurrentDuration] = useState<string>('');

  useEffect(() => {
    if (!activeSession) {
      setCurrentDuration('');
      return;
    }

    const updateDuration = () => {
      const startTime = new Date(activeSession.punch_in_at);
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setCurrentDuration(`${hours}h ${minutes}m`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <View style={styles.noSessionContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={32} color={colors.gray400} />
          </View>
          <View style={styles.noSessionContent}>
            <Text style={styles.noSessionTitle}>No Active Session</Text>
            <Text style={styles.noSessionDescription}>
              Start a new session to begin tracking your work hours
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const getVehicleDisplayName = () => {
    if (!activeSession.vehicle) return 'Unknown Vehicle';
    return `${activeSession.vehicle.license_plate} - ${activeSession.vehicle.brand} ${activeSession.vehicle.model}`;
  };

  const getStartTime = () => {
    return new Date(activeSession.punch_in_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onViewSession}
      activeOpacity={0.8}
    >
      <View style={styles.activeSessionContainer}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>ACTIVE SESSION</Text>
          </View>
          <TouchableOpacity 
            onPress={onRefresh}
            style={styles.refreshButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sessionInfo}>
          <View style={styles.vehicleSection}>
            <Ionicons name="car" size={20} color={colors.primary} />
            <Text style={styles.vehicleName} numberOfLines={1}>
              {getVehicleDisplayName()}
            </Text>
          </View>

          <View style={styles.timeSection}>
            <View style={styles.timeItem}>
              <Ionicons name="play-circle" size={16} color={colors.success} />
              <View style={styles.timeContent}>
                <Text style={styles.timeLabel}>Started</Text>
                <Text style={styles.timeValue}>{getStartTime()}</Text>
              </View>
            </View>

            <View style={styles.durationContainer}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={styles.durationText}>{currentDuration}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionHint}>
          <Text style={styles.hintText}>Tap to view session details</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: layouts.spacing.xl,
  },
  noSessionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layouts.spacing.md,
  },
  noSessionContent: {
    flex: 1,
  },
  noSessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  noSessionDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  activeSessionContainer: {
    backgroundColor: colors.success + '10',
    borderRadius: layouts.borderRadius.xl,
    padding: layouts.spacing.lg,
    borderWidth: 2,
    borderColor: colors.success + '30',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: layouts.spacing.xs,
  },
  sessionInfo: {
    gap: layouts.spacing.md,
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layouts.spacing.sm,
  },
  timeContent: {
    alignItems: 'flex-start',
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.full,
    gap: layouts.spacing.xs,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layouts.spacing.sm,
    paddingTop: layouts.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.success + '20',
    gap: layouts.spacing.xs,
  },
  hintText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});