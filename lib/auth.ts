import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../constants/Config';
import { supabase } from './supabase';
import { gpsService } from './gpsService';

export type AuthError = {
  message: string;
  deviceError?: boolean;
  requiresDeviceCode?: boolean;
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (data?.user) {
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (driverError) {
        await supabase.auth.signOut();
        return { error: { message: 'Driver account not found' } };
      }

      if (!driverData.is_active) {
        await supabase.auth.signOut();
        return { error: { message: 'Your account is inactive. Please contact administrator.' } };
      }

      await AsyncStorage.setItem(
        config.storage.userInfoKey,
        JSON.stringify(driverData)
      );

      await supabase
        .from('drivers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      await gpsService.startTracking(driverData.id);

      return { session: data.session, user: data.user, driverInfo: driverData };
    }

    return { error: { message: 'Unknown error occurred' } };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: { message: 'An unexpected error occurred' } };
  }
};

export const signOut = async () => {
  await gpsService.stopTracking();
  await supabase.auth.signOut();
  await AsyncStorage.removeItem(config.storage.userInfoKey);
};

export const getDriverInfo = async () => {
  try {
    const storedInfo = await AsyncStorage.getItem(config.storage.userInfoKey);
    
    if (storedInfo) {
      return JSON.parse(storedInfo);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error || !data) {
      return null;
    }
    
    await AsyncStorage.setItem(
      config.storage.userInfoKey,
      JSON.stringify(data)
    );
    
    return data;
  } catch (error) {
    console.error('Get driver info error:', error);
    return null;
  }
};

export const getAssignedVehicle = async (driverId: string) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'assigned')
      .single();
      
    if (error) {
      console.error('Get assigned vehicle error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Get assigned vehicle error:', error);
    return null;
  }
};

export const getAssignedVehicleWithTemp = async (driverId: string) => {
  try {
    const { data: tempAssignment, error: tempError } = await supabase
      .from('temp_assignments')
      .select(`
        vehicle_id,
        vehicle:vehicles(*)
      `)
      .eq('temp_driver_id', driverId)
      .eq('status', 'active')
      .gte('end_datetime', new Date().toISOString())
      .single();

    if (!tempError && tempAssignment?.vehicle) {
      return tempAssignment.vehicle;
    }

    const permanentVehicle = await getAssignedVehicle(driverId);
    return permanentVehicle;
  } catch (error) {
    console.error('Get assigned vehicle with temp error:', error);
    const permanentVehicle = await getAssignedVehicle(driverId);
    return permanentVehicle;
  }
};