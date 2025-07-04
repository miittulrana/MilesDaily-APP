import { useCallback, useEffect, useState } from 'react';
import { DriverWashSchedule } from '../../utils/washTypes';
import { getDriverWashSchedules, getTodaysWashSchedules } from '../washService';
import { cacheWashSchedules, getCachedWashSchedules } from '../../utils/offlineStorage';

export const useWashSchedules = (date?: string) => {
  const [schedules, setSchedules] = useState<DriverWashSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async (targetDate?: string) => {
    try {
      setLoading(true);
      setError(null);

      const dateToFetch = targetDate || new Date().toISOString().split('T')[0];
      
      const cachedData = await getCachedWashSchedules(dateToFetch);
      if (cachedData.length > 0) {
        setSchedules(cachedData);
        setLoading(false);
      }

      const freshData = targetDate ? 
        await getDriverWashSchedules(targetDate) : 
        await getTodaysWashSchedules();
      
      setSchedules(freshData);
      await cacheWashSchedules(freshData, dateToFetch);
    } catch (err) {
      console.error('Error fetching wash schedules:', err);
      setError('Failed to load wash schedules');
      
      const cachedData = await getCachedWashSchedules(
        targetDate || new Date().toISOString().split('T')[0]
      );
      if (cachedData.length > 0) {
        setSchedules(cachedData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules(date);
  }, [fetchSchedules, date]);

  const refetch = useCallback(() => {
    fetchSchedules(date);
  }, [fetchSchedules, date]);

  const updateScheduleStatus = useCallback((scheduleId: string, status: 'completed') => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { 
              ...schedule, 
              status, 
              completed_at: new Date().toISOString(),
              completed_by_type: 'driver' as const
            }
          : schedule
      )
    );
  }, []);

  return {
    schedules,
    loading,
    error,
    refetch,
    updateScheduleStatus,
  };
};

export const useTodaysWashSchedules = () => {
  return useWashSchedules();
};