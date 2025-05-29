import { useEffect, useState, useCallback } from 'react';
import { TempAssignment } from '../../utils/tempAssignmentTypes';
import { getDriverTempAssignments, subscribeTempAssignments } from '../tempAssignmentService';

export const useTempAssignments = (driverId?: string) => {
  const [assignments, setAssignments] = useState<TempAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!driverId) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await getDriverTempAssignments(driverId);
      setAssignments(data);
    } catch (err) {
      setError('Failed to load temp assignments');
      console.error('Error fetching temp assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (!driverId) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    fetchAssignments();

    const subscription = subscribeTempAssignments(driverId, (newAssignments) => {
      setAssignments(newAssignments);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [driverId, fetchAssignments]);

  const refetch = useCallback(() => {
    if (driverId) {
      setLoading(true);
      fetchAssignments();
    }
  }, [fetchAssignments, driverId]);

  return {
    assignments,
    loading,
    error,
    refetch,
    hasActiveAssignments: assignments.length > 0 && assignments.some(a => a.status === 'active'),
  };
};