import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';
const GPS_QUEUE_KEY = 'gps_location_queue';
const GPS_SETTINGS_KEY = 'gps_settings';

export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface QueuedLocation extends GPSLocation {
  id: string;
  retryCount: number;
}

class GPSService {
  private isInitialized = false;
  private isTracking = false;
  private uploadQueue: QueuedLocation[] = [];
  private uploadTimer: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private uploadInterval = 1000; // 1 second batch upload

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load queued locations from storage
      await this.loadQueueFromStorage();
      
      // Start upload processor
      this.startUploadProcessor();
      
      this.isInitialized = true;
      console.log('GPS Service initialized');
    } catch (error) {
      console.error('Failed to initialize GPS service:', error);
    }
  }

  async startTracking(): Promise<boolean> {
    if (this.isTracking) return true;

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, cannot start tracking');
        return false;
      }

      // Check permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        console.log('Location permissions not granted');
        return false;
      }

      // Start background location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000, // 3 seconds
        distanceInterval: 0, // Track even if not moving
        deferredUpdatesInterval: 3000,
        foregroundService: {
          notificationTitle: 'Fleet Service Active',
          notificationBody: 'Route optimization running',
          notificationColor: '#ff6b00',
        },
        pausesLocationUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: false,
      });

      // Update driver GPS status
      await this.updateDriverStatus(true);

      this.isTracking = true;
      console.log('GPS tracking started');
      return true;
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking) return;

    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      await this.updateDriverStatus(false);
      
      this.isTracking = false;
      console.log('GPS tracking stopped');
    } catch (error) {
      console.error('Failed to stop GPS tracking:', error);
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async processLocationUpdate(location: Location.LocationObject): Promise<void> {
    try {
      const gpsLocation: GPSLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        timestamp: new Date().toISOString(),
      };

      // Add to queue for batch upload
      await this.queueLocation(gpsLocation);
    } catch (error) {
      console.error('Error processing location update:', error);
    }
  }

  private async queueLocation(location: GPSLocation): Promise<void> {
    const queuedLocation: QueuedLocation = {
      ...location,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
    };

    this.uploadQueue.push(queuedLocation);
    await this.saveQueueToStorage();
  }

  private async loadQueueFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(GPS_QUEUE_KEY);
      if (stored) {
        this.uploadQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading queue from storage:', error);
    }
  }

  private async saveQueueToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(GPS_QUEUE_KEY, JSON.stringify(this.uploadQueue));
    } catch (error) {
      console.error('Error saving queue to storage:', error);
    }
  }

  private startUploadProcessor(): void {
    if (this.uploadTimer) return;

    this.uploadTimer = setInterval(async () => {
      if (this.uploadQueue.length === 0) return;

      const batch = this.uploadQueue.splice(0, 10); // Process 10 locations at a time
      
      for (const location of batch) {
        try {
          await this.uploadLocation(location);
        } catch (error) {
          console.error('Failed to upload location:', error);
          
          // Retry logic
          if (location.retryCount < this.maxRetries) {
            location.retryCount++;
            this.uploadQueue.push(location);
          }
        }
      }

      await this.saveQueueToStorage();
    }, this.uploadInterval);
  }

  private async uploadLocation(location: QueuedLocation): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://fleet.milesxp.com'}/api/gps/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async updateDriverStatus(isActive: boolean): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://fleet.milesxp.com'}/api/gps/status`, {
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

  getTrackingStatus(): boolean {
    return this.isTracking;
  }

  getQueueSize(): number {
    return this.uploadQueue.length;
  }

  async clearQueue(): Promise<void> {
    this.uploadQueue = [];
    await AsyncStorage.removeItem(GPS_QUEUE_KEY);
  }

  destroy(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
    }
  }
}

// Background task definition
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    // Process each location update
    for (const location of locations) {
      gpsService.processLocationUpdate(location);
    }
  }
});

// Singleton instance
export const gpsService = new GPSService();