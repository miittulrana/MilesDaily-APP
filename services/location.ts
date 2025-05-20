import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { Config } from '../constants/Config';
import { LocationData } from '../types/location';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../utils/locationTask';
import { requestLocationPermissions } from './permissions';

interface StartTrackingResult {
  status: boolean;
  error?: string;
  subscription?: Location.LocationSubscription;
}

export const startLocationTracking = async (
  onLocationUpdate: (location: LocationData, batteryLevel: number) => void
): Promise<StartTrackingResult> => {
  try {
    const hasPermission = await requestLocationPermissions();
    
    if (!hasPermission) {
      return { 
        status: false, 
        error: 'Location permission denied' 
      };
    }
    
    await startBackgroundLocationUpdates();
    
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: Config.locationUpdateInterval,
        distanceInterval: 0,
      },
      async (location) => {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        
        const locationData: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed,
          timestamp: location.timestamp,
        };
        
        onLocationUpdate(locationData, batteryLevel);
      }
    );
    
    return { 
      status: true,
      subscription
    };
  } catch (error: any) {
    console.error('Error starting location tracking:', error);
    return { 
      status: false, 
      error: error.message || 'Failed to start location tracking' 
    };
  }
};

export const stopLocationTracking = async (subscription?: Location.LocationSubscription): Promise<boolean> => {
  try {
    if (subscription) {
      subscription.remove();
    }
    
    await stopBackgroundLocationUpdates();
    
    return true;
  } catch (error) {
    console.error('Error stopping location tracking:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<{ location: Location.LocationObject | null; error?: string }> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return { 
        location: null, 
        error: 'Location permission denied' 
      };
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    
    return { location };
  } catch (error: any) {
    console.error('Error getting current location:', error);
    return { 
      location: null, 
      error: error.message || 'Failed to get current location' 
    };
  }
};