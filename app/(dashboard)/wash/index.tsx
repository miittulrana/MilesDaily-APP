// app/(dashboard)/wash/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import LoadingIndicator from '../../../components/LoadingIndicator';
import WashScheduleCard from '../../../components/wash/WashScheduleCard';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { WashSchedule } from '../../../lib/washService';

export default function WashScheduleScreen() {
  const [schedules, setSchedules] = useState<WashSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data ONCE on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const driver = await getDriverInfo();
        if (!driver?.id) {
          setLoading(false);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Simple Supabase query - NO auto-generation
        const { data, error } = await supabase
          .from('wash_schedules')
          .select(`
            *,
            vehicle:vehicles(
              id,
              license_plate,
              brand,
              model,
              type
            )
          `)
          .eq('scheduled_date', today)
          .eq('driver_id', driver.id);

        if (!error && data) {
          console.log('Found', data.length, 'schedules');
          setSchedules(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Empty array - runs ONCE only

  const handleCompleteWash = (schedule: WashSchedule) => {
    console.log('Complete wash:', schedule.id);
  };

  const handleViewImage = (imageUrl: string, vehiclePlate: string) => {
    console.log('View image:', imageUrl);
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Wash Schedule</Text>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="water-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>No wash schedule for today</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WashScheduleCard
              schedule={item}
              onComplete={handleCompleteWash}
              onViewImage={handleViewImage}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: layouts.spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  listContent: {
    padding: layouts.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: layouts.spacing.md,
  },
});