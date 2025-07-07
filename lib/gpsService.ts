import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';
import { getDriverInfo } from './auth';
import { BACKGROUND_LOCATION_TASK } from './backgroundLocationTask';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: number;
}

class GPSService {
  private static instance: GPSService;
  private isTracking = false;
  private foregroundSubscription: Location.LocationSubscription | null = null;
  private currentDriverId: string | null = null;

  static getInstance(): GPSService {
    if (!GPSService.instance) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return backgroundStatus === 'granted';
    } catch (error) {
      console.error('Error requesting GPS permissions:', error);
      return false;
    }
  }

  async startTracking(driverId: string): Promise<boolean> {
    try {
      if (this.isTracking) {
        await this.stopTracking();
      }

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return false;
      }

      this.currentDriverId = driverId;
      this.isTracking = true;

      await this.updateDriverStatus(driverId, true);

      await this.startForegroundTracking();
      await this.startBackgroundTracking();

      return true;
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (!this.isTracking) return;

      this.isTracking = false;

      if (this.foregroundSubscription) {
        this.foregroundSubscription.remove();
        this.foregroundSubscription = null;
      }

      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);

      if (this.currentDriverId) {
        await this.updateDriverStatus(this.currentDriverId, false);
      }

      this.currentDriverId = null;
    } catch (error) {
      console.error('Error stopping GPS tracking:', error);
    }
  }

  private async startForegroundTracking(): Promise<void> {
    try {
      this.foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 0,
        },
        (location) => {
          this.sendLocationUpdate(location);
        }
      );
    } catch (error) {
      console.error('Error starting foreground tracking:', error);
    }
  }

  private async startBackgroundTracking(): Promise<void> {
    try {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 0,
        deferredUpdatesInterval: 5000,
        showsBackgroundLocationIndicator: false,
        foregroundService: {
          notificationTitle: 'MXP Daily - GPS Route Optimization in progress',
          notificationBody: "Don't close the app",
          notificationColor: '#ff6b00',
          killServiceOnDestroy: false,
        },
      });
    } catch (error) {
      console.error('Error starting background tracking:', error);
    }
  }

  private async sendLocationUpdate(location: Location.LocationObject): Promise<void> {
    try {
      if (!this.currentDriverId) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('https://fleet.milesxp.com/api/gps/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          speed: location.coords.speed || 0,
          heading: location.coords.heading || 0,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send location update:', response.status);
      }
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  }

  private async updateDriverStatus(driverId: string, isActive: boolean): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('https://fleet.milesxp.com/api/gps/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          is_active: isActive,
        }),
      });
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  }

  async isLocationServiceEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<GPSLocation | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getCurrentDriverId(): string | null {
    return this.currentDriverId;
  }

  async resumeTrackingIfNeeded(): Promise<void> {
    try {
      const driver = await getDriverInfo();
      if (!driver) return;

      const isRunning = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (!isRunning && !this.isTracking) {
        await this.startTracking(driver.id);
      }
    } catch (error) {
      console.error('Error resuming tracking:', error);
    }
  }
}

export const gpsService = GPSService.getInstance();