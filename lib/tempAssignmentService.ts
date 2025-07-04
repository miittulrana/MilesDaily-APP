import { supabase } from './supabase';
import { TempAssignment } from '../utils/tempAssignmentTypes';

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