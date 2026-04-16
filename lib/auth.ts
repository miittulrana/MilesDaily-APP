import { supabase, supabaseQuery, getAuthUser, withRetry } from './supabase';
import { DriverInfo } from '../utils/types';

export const signIn = async (email: string, password: string) => {
  try {
    const result = await withRetry(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    });

    return result;
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { data: null, error: { message: error?.message || 'An unexpected error occurred' } };
  }
};

export const signOut = async () => {
  try {
    await withRetry(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    });
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error: { message: error?.message || 'An unexpected error occurred' } };
  }
};

export const getDriverInfo = async (): Promise<DriverInfo | null> => {
  try {
    const user = await getAuthUser();

    if (!user) {
      return null;
    }

    const { data: driver, error } = await supabaseQuery<DriverInfo>(async (client) => {
      return await client
        .from('drivers')
        .select('id, email, first_name, last_name, role, driver_types, is_active, bizhandle_staff_id')
        .eq('id', user.id)
        .maybeSingle();
    });

    if (error) {
      console.error('Error fetching driver info:', error);
      return null;
    }

    return driver;
  } catch (error) {
    console.error('Get driver info error:', error);
    return null;
  }
};

export const getAssignedVehicle = async (driverId: string) => {
  try {
    // First: Check vehicle_assignments table for active assignment
    const { data: assignment, error: assignmentError } = await supabaseQuery<{ vehicle_id: string }>(
      async (client) => {
        return await client
          .from('vehicle_assignments')
          .select('vehicle_id')
          .eq('driver_id', driverId)
          .is('unassigned_at', null)
          .order('assigned_at', { ascending: false })
          .limit(1)
          .maybeSingle();
      }
    );

    if (!assignmentError && assignment) {
      const { data: vehicle, error: vehicleError } = await supabaseQuery<any>(
        async (client) => {
          return await client
            .from('vehicles')
            .select('*')
            .eq('id', assignment.vehicle_id)
            .maybeSingle();
        }
      );

      if (!vehicleError && vehicle) {
        return vehicle;
      }
    }

    // Fallback: Check vehicles table directly (legacy assignment method)
    const { data: vehicle, error: vehicleError } = await supabaseQuery<any>(
      async (client) => {
        return await client
          .from('vehicles')
          .select('*')
          .eq('driver_id', driverId)
          .eq('status', 'assigned')
          .maybeSingle();
      }
    );

    if (!vehicleError && vehicle) {
      return vehicle;
    }

    return null;
  } catch (error) {
    console.error('Get assigned vehicle error:', error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    return await getAuthUser();
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Check authentication error:', error);
    return false;
  }
};

export const refreshSession = async () => {
  try {
    const result = await withRetry(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return { data, error: null };
    });
    return result;
  } catch (error: any) {
    console.error('Refresh session error:', error);
    return { data: null, error: { message: error?.message || 'Failed to refresh session' } };
  }
};