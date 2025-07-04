import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';

interface SessionTimerProps {
  punchInTime: string;
}

export default function SessionTimer({ punchInTime }: SessionTimerProps) {
  const [duration, setDuration] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMinutes: 0
  });

  useEffect(() => {
    const updateTimer = () => {
      const startTime = new Date(punchInTime);
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const totalMinutes = Math.floor(diffMs / (1000 * 60));

      setDuration({
        hours,
        minutes,
        seconds,
        totalMinutes
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [punchInTime]);

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const getTimerColor = () => {
    if (duration.totalMinutes < 60) return colors.success;
    if (duration.totalMinutes < 480) return colors.primary;
    if (duration.totalMinutes < 600) return colors.warning;
    return colors.error;
  };

  const getTimerMessage = () => {
    if (duration.totalMinutes < 60) return 'Just started';
    if (duration.totalMinutes < 240) return 'Going strong';
    if (duration.totalMinutes < 480) return 'Regular shift';
    if (duration.totalMinutes < 600) return 'Long shift';
    return 'Extended shift';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time" size={24} color={getTimerColor()} />
        <Text style={styles.title}>Session Duration</Text>
      </View>

      <View style={[
        styles.timerContainer,
        { borderColor: getTimerColor() + '30' }
      ]}>
        <View style={styles.timeDisplay}>
          <View style={styles.timeUnit}>
            <Text style={[styles.timeValue, { color: getTimerColor() }]}>
              {formatTime(duration.hours)}
            </Text>
            <Text style={styles.timeLabel}>HRS</Text>
          </View>
          
          <Text style={[styles.separator, { color: getTimerColor() }]}>:</Text>
          
          <View style={styles.timeUnit}>
            <Text style={[styles.timeValue, { color: getTimerColor() }]}>
              {formatTime(duration.minutes)}
            </Text>
            <Text style={styles.timeLabel}>MIN</Text>
          </View>
          
          <Text style={[styles.separator, { color: getTimerColor() }]}>:</Text>
          
          <View style={styles.timeUnit}>
            <Text style={[styles.timeValue, { color: getTimerColor() }]}>
              {formatTime(duration.seconds)}
            </Text>
            <Text style={styles.timeLabel}>SEC</Text>
          </View>
        </View>

        <View style={[
          styles.statusIndicator,
          { backgroundColor: getTimerColor() + '15' }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getTimerColor() }
          ]} />
          <Text style={[
            styles.statusMessage,
            { color: getTimerColor() }
          ]}>
            {getTimerMessage()}
          </Text>
        </View>
      </View>

      <View style={styles.additionalInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Total Minutes</Text>
          <Text style={styles.infoValue}>{duration.totalMinutes}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Started At</Text>
          <Text style={styles.infoValue}>
            {new Date(punchInTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.xl,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.lg,
    gap: layouts.spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  timerContainer: {
    borderWidth: 2,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textLight,
    letterSpacing: 1,
    marginTop: layouts.spacing.xs,
  },
  separator: {
    fontSize: 28,
    fontWeight: '700',
    marginHorizontal: layouts.spacing.sm,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.full,
    gap: layouts.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: layouts.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});