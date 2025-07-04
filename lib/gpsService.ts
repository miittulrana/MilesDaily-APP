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
  private lastLocation: GPSLocation | null = null;
  private isMoving = false;
  private movementThreshold = 5; // meters
  private stationaryTimer: NodeJS.Timeout | null = null;
  private currentInterval = 3000; // Start with 3 seconds

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

      // Update driver GPS status FIRST
      await this.updateDriverStatus(true);

      // Check permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        console.log('Location permissions not granted');
        return false;
      }



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
      
      // Clear timers
      if (this.stationaryTimer) {
        clearTimeout(this.stationaryTimer);
        this.stationaryTimer = null;
      }
      
      // Reset state
      this.isTracking = false;
      this.isMoving = false;
      this.lastLocation = null;
      this.currentInterval = 3000;
      
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

      // Check if user is moving
      const currentlyMoving = this.isUserMoving(gpsLocation);
      
      // If movement state changed, update tracking interval
      if (currentlyMoving !== this.isMoving) {
        this.isMoving = currentlyMoving;
        await this.updateTrackingInterval();
      }

      // Add to queue for batch upload
      await this.queueLocation(gpsLocation);
      
      // Store current location for next comparison
      this.lastLocation = gpsLocation;
    } catch (error) {
      console.error('Error processing location update:', error);
    }
  }

  private isUserMoving(currentLocation: GPSLocation): boolean {
    if (!this.lastLocation) return false;
    
    // Calculate distance from last location
    const distance = this.calculateDistance(
      this.lastLocation.lat,
      this.lastLocation.lng,
      currentLocation.lat,
      currentLocation.lng
    );
    
    // Check if speed indicates movement
    const speedMoving = currentLocation.speed > 0.5; // 0.5 m/s = 1.8 km/h
    
    // Check if position changed significantly
    const positionMoving = distance > this.movementThreshold;
    
    return speedMoving || positionMoving;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private async updateTrackingInterval(): Promise<void> {
    if (!this.isTracking) return;

    try {
      const newInterval = this.isMoving ? 3000 : 10000; // 3s moving, 10s stationary
      
      if (newInterval !== this.currentInterval) {
        this.currentInterval = newInterval;
        console.log(`Updating GPS interval to ${newInterval}ms - ${this.isMoving ? 'MOVING' : 'STATIONARY'}`);
        
        // Stop current tracking
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        
        // Start with new interval
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: newInterval,
          distanceInterval: 0, // Track even if not moving
          deferredUpdatesInterval: newInterval,
          foregroundService: {
            notificationTitle: 'Fleet Service Active',
            notificationBody: `Route optimization ${this.isMoving ? 'tracking movement' : 'monitoring position'}`,
            notificationColor: '#ff6b00',
          },
          pausesLocationUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: false,
          mayShowUserSettingsDialog: true,
          killServiceOnDestroy: false,
        });
      }
    } catch (error) {
      console.error('Error updating tracking interval:', error);
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

    // Also update driver status to ensure they show as active
    await this.updateDriverStatus(true);
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
    
    if (this.stationaryTimer) {
      clearTimeout(this.stationaryTimer);
      this.stationaryTimer = null;
    }
  }

  // Get current tracking state for debugging
  getTrackingInfo(): {
    isTracking: boolean;
    isMoving: boolean;
    currentInterval: number;
    queueSize: number;
    lastLocation: GPSLocation | null;
  } {
    return {
      isTracking: this.isTracking,
      isMoving: this.isMoving,
      currentInterval: this.currentInterval,
      queueSize: this.uploadQueue.length,
      lastLocation: this.lastLocation,
    };
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