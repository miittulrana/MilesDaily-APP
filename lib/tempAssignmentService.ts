import { supabase } from './supabase';
import { TempAssignment, ExtensionRequest } from '../utils/tempAssignmentTypes';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthToken(): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();
  return session?.session?.access_token || null;
}

export const getDriverTempAssignments = async (driverId: string): Promise<TempAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('temp_assignments')
      .select(`
        *,
        vehicle:vehicles(license_plate, brand, model, type),
        permanent_driver:drivers!temp_assignments_permanent_driver_id_fkey(first_name, last_name, email),
        temp_driver:drivers!temp_assignments_temp_driver_id_fkey(first_name, last_name, email, work_phone)
      `)
      .eq('temp_driver_id', driverId)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching temp assignments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDriverTempAssignments:', error);
    return [];
  }
};

export const completeTempAssignment = async (
  assignmentId: string,
  completionNotes?: string
): Promise<void> => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/drivers/temp-assignments/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assignment_id: assignmentId,
      completion_notes: completionNotes || null,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to complete assignment');
  }
};

export const requestExtension = async (request: ExtensionRequest): Promise<void> => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/drivers/temp-assignments/extend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assignment_id: request.assignment_id,
      new_end_datetime: request.new_end_datetime,
      reason: request.reason,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to request extension');
  }
};

export const subscribeTempAssignments = (
  driverId: string,
  callback: (assignments: TempAssignment[]) => void
) => {
  const fetchAndCallback = async () => {
    const assignments = await getDriverTempAssignments(driverId);
    callback(assignments);
  };

  const intervalId = setInterval(fetchAndCallback, 30000);

  fetchAndCallback();

  return {
    unsubscribe: () => {
      clearInterval(intervalId);
    }
  };
};