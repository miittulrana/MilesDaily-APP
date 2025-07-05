import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { gpsService } from './gpsService';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

export class BackgroundLocationService {
  private static instance: BackgroundLocationService;
  private isServiceRunning = false;

  static getInstance(): BackgroundLocationService {
    if (!BackgroundLocationService.instance) {
      BackgroundLocationService.instance = new BackgroundLocationService();
    }
    return BackgroundLocationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize GPS service
      await gpsService.initialize();
      
      // Setup notification channel for foreground service
      await this.setupNotificationChannel();
      
      console.log('Background location service initialized');
    } catch (error) {
      console.error('Failed to initialize background location service:', error);
    }
  }

  private async setupNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('gps-service', {
        name: 'Fleet Management',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [],
        lightColor: '#ff6b00',
        sound: false,
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.SECRET,
        bypassDnd: false,
      });
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground location permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission not granted');
        return false;
      }

      // Request background location permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission not granted');
        return false;
      }

      // Request notification permissions (for foreground service)
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync({
        android: {
          allowAlert: true,
          allowBadge: false,
          allowSound: false,
          allowAnnouncements: false,
        },
      });
      if (notificationStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async startService(): Promise<boolean> {
    if (this.isServiceRunning) return true;

    try {
      // Check if task is already defined
      if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
        this.defineLocationTask();
      }

      // Start GPS tracking
      const started = await gpsService.startTracking();
      if (started) {
        this.isServiceRunning = true;
        console.log('Background location service started');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to start background location service:', error);
      return false;
    }
  }

  async stopService(): Promise<void> {
    if (!this.isServiceRunning) return;

    try {
      await gpsService.stopTracking();
      this.isServiceRunning = false;
      console.log('Background location service stopped');
    } catch (error) {
      console.error('Failed to stop background location service:', error);
    }
  }

  private defineLocationTask(): void {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
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
  }

  async checkServiceStatus(): Promise<boolean> {
    try {
      const isLocationTaskRunning = await TaskManager.isTaskRunning(BACKGROUND_LOCATION_TASK);
      const gpsStatus = gpsService.getTrackingStatus();
      
      this.isServiceRunning = isLocationTaskRunning && gpsStatus;
      return this.isServiceRunning;
    } catch (error) {
      console.error('Error checking service status:', error);
      return false;
    }
  }

  getServiceStatus(): boolean {
    return this.isServiceRunning;
  }

  async getLocationPermissionStatus(): Promise<{
    foreground: Location.PermissionStatus;
    background: Location.PermissionStatus;
  }> {
    try {
      const foregroundPermission = await Location.getForegroundPermissionsAsync();
      const backgroundPermission = await Location.getBackgroundPermissionsAsync();

      return {
        foreground: foregroundPermission.status,
        background: backgroundPermission.status,
      };
    } catch (error) {
      console.error('Error getting permission status:', error);
      return {
        foreground: Location.PermissionStatus.UNDETERMINED,
        background: Location.PermissionStatus.UNDETERMINED,
      };
    }
  }

  async isLocationEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
        timeout: 15000,
      });
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async restartService(): Promise<boolean> {
    try {
      await this.stopService();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return await this.startService();
    } catch (error) {
      console.error('Error restarting service:', error);
      return false;
    }
  }

  async forceRestartService(): Promise<boolean> {
    try {
      console.log('Force restarting GPS service');
      this.isServiceRunning = false;
      
      // Stop all location updates
      try {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      } catch (e) {
        console.log('Location updates already stopped');
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Start fresh
      return await this.startService();
    } catch (error) {
      console.error('Error force restarting service:', error);
      return false;
    }
  }

  getQueueInfo(): { size: number; isProcessing: boolean } {
    return {
      size: gpsService.getQueueSize(),
      isProcessing: this.isServiceRunning,
    };
  }

  async clearLocationQueue(): Promise<void> {
    await gpsService.clearQueue();
  }
}

// Export singleton instance
export const backgroundLocationService = BackgroundLocationService.getInstance();