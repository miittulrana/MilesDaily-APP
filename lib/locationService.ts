import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LOCATION_TASK_NAME } from '../tasks/locationTask';
import { LocationPermissionStatus, TrackingStatus } from '../utils/locationTypes';

class LocationService {
  private isInitialized = false;
  private trackingStatus: TrackingStatus = { isTracking: false };

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      const permissions = await this.requestPermissions();
      if (!permissions.granted) {
        console.error('Location permissions not granted');
        return false;
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize location service:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return {
          granted: false,
          canAskAgain: foregroundStatus !== 'denied',
          status: foregroundStatus
        };
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return {
        granted: backgroundStatus === 'granted',
        canAskAgain: backgroundStatus !== 'denied',
        status: backgroundStatus
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error'
      };
    }
  }

  async startTracking(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      if (this.trackingStatus.isTracking) {
        return true;
      }

      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        console.error('Location task not defined');
        return false;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 6000,
        distanceInterval: 0,
        foregroundService: {
          notificationTitle: 'MilesXP Daily',
          notificationBody: 'Tracking location for work purposes',
          notificationColor: '#ff6b00',
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: false,
      });

      this.trackingStatus = {
        isTracking: true,
        lastUpdate: new Date().toISOString()
      };

      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      this.trackingStatus = {
        isTracking: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return false;
    }
  }

  async stopTracking(): Promise<boolean> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      this.trackingStatus = { isTracking: false };
      return true;
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
      return false;
    }
  }

  async isTracking(): Promise<boolean> {
    try {
      return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      return false;
    }
  }

  getTrackingStatus(): TrackingStatus {
    return this.trackingStatus;
  }

  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }
}

export const locationService = new LocationService();