import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { throttle } from 'lodash';
import supabase from '../utils/supabase';
import { Config } from '../constants/Config';
import Toast from 'react-native-toast-message';
import { useBattery } from './useBattery';

const LOCATION_TASK_NAME = Config.locationTaskName;

export function useLocation(userId: string | undefined) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { batteryLevel } = useBattery();
  const foregroundSubscription = useRef<Location.LocationSubscription | null>(null);

  const updateLocation = throttle(async (location: Location.LocationObject, battery: number) => {
    if (!userId) return;

    const { coords, timestamp } = location;
    const { latitude, longitude, speed } = coords;

    try {
      // Update live location
      await supabase
        .from('locations')
        .upsert({
          driver_id: userId,
          lat: latitude,
          lng: longitude,
          speed: speed || 0,
          battery: Math.round(battery * 100),
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
          battery: Math.round(battery * 100),
          timestamp: new Date(timestamp).toISOString()
        });

      Toast.show({
        type: 'success',
        position: 'bottom',
        text1: 'Location updated',
        visibilityTime: 1000,
        autoHide: true,
      });
    } catch (error) {
      console.error('Error updating location:', error);
      Toast.show({
        type: 'error',
        position: 'bottom',
        text1: 'Failed to update location',
        visibilityTime: 2000,
      });
    }
  }, 3000);

  const startLocationTracking = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      setErrorMsg('Permission to access location in background was denied');
      // Continue anyway with foreground only
    }

    // Define the background task
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
      if (error) {
        console.error(error);
        return;
      }
      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const location = locations[0];
        
        if (location) {
          // Get battery level for background updates
          const battery = await Battery.getBatteryLevelAsync();
          await updateLocation(location, battery);
        }
      }
    });

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: Config.locationUpdateInterval,
      distanceInterval: 0,
      foregroundService: {
        notificationTitle: "MilesXP Daily is tracking",
        notificationBody: "Location tracking is active",
        notificationColor: "#FF6B00",
      },
    });

    // Start foreground location updates
    foregroundSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: Config.locationUpdateInterval,
        distanceInterval: 0,
      },
      (location) => {
        setLocation(location);
        if (batteryLevel !== null && userId) {
          updateLocation(location, batteryLevel);
        }
      }
    );

    setIsTracking(true);
  };

  const stopLocationTracking = async () => {
    if (foregroundSubscription.current) {
      foregroundSubscription.current.remove();
    }

    const isTaskDefined = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTaskDefined) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      if (foregroundSubscription.current) {
        foregroundSubscription.current.remove();
      }
    };
  }, []);

  return {
    location,
    errorMsg,
    isTracking,
    startLocationTracking,
    stopLocationTracking
  };
}