import { useEffect, useState, useCallback } from 'react';
import { TempAssignment } from '../../utils/tempAssignmentTypes';
import { getDriverTempAssignments, subscribeTempAssignments } from '../tempAssignmentService';

export const useTempAssignments = (driverId: string) => {
  const [assignments, setAssignments] = useState<TempAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!driverId) return;
    
    try {
      setError(null);
      const data = await getDriverTempAssignments(driverId);
      setAssignments(data);
    } catch (err) {
      setError('Failed to load temp assignments');
      console.error('Error fetching temp assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (!driverId) return;

    fetchAssignments();

    const subscription = subscribeTempAssignments(driverId, (newAssignments) => {
      setAssignments(newAssignments);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [driverId, fetchAssignments]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    refetch,
    hasActiveAssignments: assignments.length > 0,
  };
};