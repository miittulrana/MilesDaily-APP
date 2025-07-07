import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../constants/Config';
import { supabase } from './supabase';
import { backgroundLocationService } from './backgroundLocation';
import * as Device from 'expo-device';

export type AuthError = {
  message: string;
};

const getDeviceId = async (): Promise<string | null> => {
  try {
    const androidId = Device.osInternalBuildId;
    return androidId || null;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};

const validateDevice = async (driverId: string): Promise<{ isValid: boolean; message: string }> => {
  try {
    const deviceId = await getDeviceId();
    
    if (!deviceId) {
      return { isValid: false, message: 'Unable to get device ID' };
    }
    
    const response = await fetch(config.api.deviceValidationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driver_id: driverId,
        device_id: deviceId
      }),
    });
    
    if (!response.ok) {
      return { isValid: false, message: 'Device validation failed' };
    }
    
    const result = await response.json();
    return { 
      isValid: result.is_valid, 
      message: result.message || (result.is_valid ? 'Device authorized' : "Kindly login on Company's Device only")
    };
  } catch (error) {
    console.error('Device validation error:', error);
    return { isValid: false, message: "Kindly login on Company's Device only" };
  }
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

      const deviceValidation = await validateDevice(driverData.id);
      
      if (!deviceValidation.isValid) {
        await supabase.auth.signOut();
        return { 
          error: { message: deviceValidation.message },
          deviceError: true
        };
      }

      await AsyncStorage.setItem(
        config.storage.userInfoKey,
        JSON.stringify(driverData)
      );

      await supabase
        .from('drivers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      try {
        console.log('Starting GPS tracking after login');
        const gpsStarted = await backgroundLocationService.startService();
        if (gpsStarted) {
          console.log('GPS tracking started successfully after login');
        } else {
          console.log('GPS tracking failed to start after login');
        }
      } catch (gpsError) {
        console.error('Error starting GPS tracking after login:', gpsError);
      }

      return { session: data.session, user: data.user, driverInfo: driverData };
    }

    return { error: { message: 'Unknown error occurred' } };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: { message: 'An unexpected error occurred' } };
  }
};

export const signOut = async () => {
  try {
    console.log('Stopping GPS tracking before logout');
    await backgroundLocationService.stopService();
    console.log('GPS tracking stopped before logout');
  } catch (gpsError) {
    console.error('Error stopping GPS tracking before logout:', gpsError);
  }

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
      console.log('Found active temp assignment vehicle:', tempAssignment.vehicle);
      return tempAssignment.vehicle;
    }

    const permanentVehicle = await getAssignedVehicle(driverId);
    console.log('Using permanent assigned vehicle:', permanentVehicle);
    return permanentVehicle;
  } catch (error) {
    console.error('Get assigned vehicle with temp error:', error);
    const permanentVehicle = await getAssignedVehicle(driverId);
    return permanentVehicle;
  }
};

export const getGPSTrackingStatus = async () => {
  try {
    const isRunning = await backgroundLocationService.checkServiceStatus();
    return isRunning;
  } catch (error) {
    console.error('Error checking GPS tracking status:', error);
    return false;
  }
};

export const startGPSTracking = async () => {
  try {
    const started = await backgroundLocationService.startService();
    return started;
  } catch (error) {
    console.error('Error starting GPS tracking:', error);
    return false;
  }
};

export const stopGPSTracking = async () => {
  try {
    await backgroundLocationService.stopService();
    return true;
  } catch (error) {
    console.error('Error stopping GPS tracking:', error);
    return false;
  }
};

export const restartGPSTracking = async () => {
  try {
    const restarted = await backgroundLocationService.restartService();
    return restarted;
  } catch (error) {
    console.error('Error restarting GPS tracking:', error);
    return false;
  }
};