import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import { Config } from '../constants/Config';
import supabase from './supabase';

// Register background task for location updates
TaskManager.defineTask(Config.locationTaskName, async ({ data, error }) => {
  if (error) {
    console.error('Error in background location task:', error);
    return;
  }
  
  if (!data) {
    console.log('No data received in background location task');
    return;
  }
  
  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[0];
  
  if (!location) {
    console.log('No location data in background update');
    return;
  }
  
  try {
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No active session found for background task');
      return;
    }
    
    const userId = session.user.id;
    
    // Get battery level
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryPercentage = Math.round(batteryLevel * 100);
    
    const { latitude, longitude, speed } = location.coords;
    const timestamp = new Date(location.timestamp).toISOString();
    
    // Update live location
    await supabase
      .from('locations')
      .upsert({
        driver_id: userId,
        lat: latitude,
        lng: longitude,
        speed: speed || 0,
        battery: batteryPercentage,
        updated_at: new Date().toISOString()
      });
    
    // Insert into location history
    await supabase
      .from('location_logs')
      .insert({
        driver_id: userId,
        lat: latitude,
        lng: longitude,
        speed: speed || 0,
        battery: batteryPercentage,
        timestamp
      });
    
    console.log('Background location update successful');
  } catch (err) {
    console.error('Error processing background location:', err);
  }
});

export const startBackgroundLocationUpdates = async () => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Background location permission not granted');
    return false;
  }
  
  // Check if the task is already running
  const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(Config.locationTaskName)
    .catch(() => false);
  
  if (!isTaskRunning) {
    await Location.startLocationUpdatesAsync(Config.locationTaskName, {
      accuracy: Location.Accuracy.High,
      timeInterval: Config.locationUpdateInterval,
      distanceInterval: 0,
      foregroundService: {
        notificationTitle: "MilesXP Daily is tracking",
        notificationBody: "Location tracking is active",
        notificationColor: "#FF6B00",
      },
      // Android-specific
      pausesUpdatesAutomatically: false,
    });
    console.log('Background location task started');
  } else {
    console.log('Background location task was already running');
  }
  
  return true;
};

export const stopBackgroundLocationUpdates = async () => {
  const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(Config.locationTaskName)
    .catch(() => false);
  
  if (isTaskRunning) {
    await Location.stopLocationUpdatesAsync(Config.locationTaskName);
    console.log('Background location task stopped');
  }
};