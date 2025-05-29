import { supabase } from './supabase';
import { TempAssignment, ExtensionRequest } from '../utils/tempAssignmentTypes';

export const getDriverTempAssignments = async (driverId: string): Promise<TempAssignment[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication session');
    }

    const response = await fetch('https://fleet.milesxp.com/api/drivers/temp-assignments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch temp assignments');
    }

    const data = await response.json();
    return data.assignments || [];
  } catch (error) {
    console.error('Error fetching temp assignments:', error);
    throw error;
  }
};

export const requestExtension = async (extensionData: ExtensionRequest): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication session');
    }

    const response = await fetch('https://fleet.milesxp.com/api/drivers/temp-assignments/extend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(extensionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to extend assignment');
    }

    return true;
  } catch (error) {
    console.error('Error extending assignment:', error);
    throw error;
  }
};

export const completeTempAssignment = async (assignmentId: string, notes?: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication session');
    }

    const response = await fetch('https://fleet.milesxp.com/api/drivers/temp-assignments/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        assignment_id: assignmentId,
        completion_notes: notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to complete assignment');
    }

    return true;
  } catch (error) {
    console.error('Error completing assignment:', error);
    throw error;
  }
};

export const subscribeTempAssignments = (
  driverId: string,
  callback: (assignments: TempAssignment[]) => void
) => {
  const subscription = supabase
    .channel('temp_assignments_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'temp_assignments',
        filter: `temp_driver_id=eq.${driverId}`,
      },
      async () => {
        try {
          const assignments = await getDriverTempAssignments(driverId);
          callback(assignments);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    )
    .subscribe();

  return subscription;
};