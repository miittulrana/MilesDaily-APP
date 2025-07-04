import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../../../components/LoadingIndicator';
import SessionTimer from '../../../components/truck-log/SessionTimer';
import PunchButton from '../../../components/truck-log/PunchButton';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getActiveSession, punchInOut, getCurrentLocation } from '../../../lib/truckLogService';
import { TruckLogSession } from '../../../utils/truckLogTypes';
import { formatDateTime, formatTime } from '../../../utils/dateUtils';

export default function ActiveSessionScreen() {
  const router = useRouter();
  const [session, setSession] = useState<TruckLogSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveSession();
    
    const interval = setInterval(() => {
      loadActiveSession();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadActiveSession = async () => {
    try {
      setError(null);
      const activeSession = await getActiveSession();
      
      if (!activeSession) {
        Alert.alert(
          'No Active Session',
          'You don\'t have any active session. Please start a new session.',
          [
            {
              text: 'Start Session',
              onPress: () => router.replace('/(dashboard)/truck-log/vehicle-selection')
            },
            {
              text: 'Go Back',
              onPress: () => router.replace('/(dashboard)/truck-log')
            }
          ]
        );
        return;
      }
      
      setSession(activeSession);
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
      console.error('Error loading active session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!session) return;

    Alert.alert(
      'Confirm Punch Out',
      `Are you sure you want to end your session with ${session.vehicle?.license_plate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Punch Out', onPress: confirmPunchOut }
      ]
    );
  };

  const confirmPunchOut = async () => {
    if (!session) return;

    try {
      setPunching(true);
      
      const location = await getCurrentLocation();
      
      const result = await punchInOut({
        vehicle_id: session.vehicle_id,
        action: 'punch_out',
        location: location || undefined,
      });

      if (result.success) {
        const duration = result.session.session_duration_minutes;
        const hours = Math.floor((duration || 0) / 60);
        const minutes = (duration || 0) % 60;
        
        Alert.alert(
          'Punch Out Successful',
          `Session completed!\nDuration: ${hours}h ${minutes}m`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(dashboard)/truck-log');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to punch out');
      }
    } catch (err: any) {
      console.error('Error punching out:', err);
      Alert.alert('Error', err.message || 'Failed to punch out');
    } finally {
      setPunching(false);
    }
  };

  const getVehicleDisplayName = () => {
    if (!session?.vehicle) return 'Unknown Vehicle';
    return `${session.vehicle.brand} ${session.vehicle.model} (${session.vehicle.license_plate})`;
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading session..." />;
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>No Active Session</Text>
          <Text style={styles.errorDescription}>
            You don't have any active session running.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(dashboard)/truck-log')}
          >
            <Text style={styles.primaryButtonText}>Go to Truck Log</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.statusIndicator}>
            <View style={styles.activeDot} />
            <Text style={styles.statusText}>ACTIVE SESSION</Text>
          </View>
          <Text style={styles.vehicleName}>{getVehicleDisplayName()}</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.timerSection}>
          <SessionTimer punchInTime={session.punch_in_at} />
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="car-outline" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>
                  {session.vehicle?.license_plate} - {session.vehicle?.type}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Started At</Text>
                <Text style={styles.detailValue}>
                  {formatDateTime(session.punch_in_at)}
                </Text>
              </View>
            </View>

            {session.punch_in_location && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Start Location</Text>
                  <Text style={styles.detailValue}>
                    {session.punch_in_location.latitude.toFixed(6)}, {session.punch_in_location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <PunchButton
            onPress={handlePunchOut}
            loading={punching}
            type="punch_out"
          />
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(dashboard)/truck-log/history')}
            disabled={punching}
          >
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>View History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: layouts.spacing.xl,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.full,
    marginBottom: layouts.spacing.md,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: layouts.spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    letterSpacing: 0.5,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginLeft: layouts.spacing.sm,
    flex: 1,
  },
  timerSection: {
    marginBottom: layouts.spacing.xl,
  },
  detailsSection: {
    marginBottom: layouts.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.md,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
  },
  detailContent: {
    marginLeft: layouts.spacing.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  actionsSection: {
    gap: layouts.spacing.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    gap: layouts.spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layouts.spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: layouts.spacing.lg,
    marginBottom: layouts.spacing.sm,
  },
  errorDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: layouts.spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.xl,
    borderRadius: layouts.borderRadius.lg,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});