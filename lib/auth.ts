import { supabase } from './supabase';
import { DriverInfo } from '../utils/types';

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error: { message: 'An unexpected error occurred' } };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: { message: 'An unexpected error occurred' } };
  }
};

export const getDriverInfo = async (): Promise<DriverInfo | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('id, email, first_name, last_name, role, driver_types, is_active, bizhandle_staff_id')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching driver info:', error);
      return null;
    }

    return driver as DriverInfo;
  } catch (error) {
    console.error('Get driver info error:', error);
    return null;
  }
};

export const getAssignedVehicle = async (driverId: string) => {
  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .select('vehicle_id')
      .eq('driver_id', driverId)
      .eq('is_active', true)
      .single();

    if (assignmentError || !assignment) {
      return null;
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', assignment.vehicle_id)
      .single();

    if (vehicleError) {
      console.error('Error fetching vehicle:', vehicleError);
      return null;
    }

    return vehicle;
  } catch (error) {
    console.error('Get assigned vehicle error:', error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
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
    const { data, error } = await supabase.auth.refreshSession();
    return { data, error };
  } catch (error) {
    console.error('Refresh session error:', error);
    return { data: null, error: { message: 'Failed to refresh session' } };
  }
};