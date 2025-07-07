import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { gpsService } from './gpsService';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

export class BackgroundLocationService {
  private static instance: BackgroundLocationService;
  private isServiceRunning = false;
  private restartTimer: NodeJS.Timeout | null = null;

  static getInstance(): BackgroundLocationService {
    if (!BackgroundLocationService.instance) {
      BackgroundLocationService.instance = new BackgroundLocationService();
    }
    return BackgroundLocationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await gpsService.initialize();
      
      await this.setupNotificationChannel();
      
      this.startServiceMonitor();
      
      console.log('Background location service initialized');
    } catch (error) {
      console.error('Failed to initialize background location service:', error);
    }
  }

  private async setupNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('gps-service', {
        name: 'MXP Daily Optimization',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [],
        lightColor: '#ff6b00',
        sound: false,
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    }
  }

  private startServiceMonitor(): void {
    if (this.restartTimer) return;
    
    this.restartTimer = setInterval(async () => {
      try {
        const isRunning = await this.checkServiceStatus();
        if (!isRunning && this.isServiceRunning) {
          console.log('GPS service stopped unexpectedly, restarting...');
          await this.forceRestartService();
        }
      } catch (error) {
        console.error('Error in service monitor:', error);
      }
    }, 10000);
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission not granted');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission not granted');
        return false;
      }

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
      const started = await gpsService.startTracking();
      if (started) {
        this.isServiceRunning = true;
        console.log('Background location service started');
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'MXP Daily',
            body: 'App optimization started',
            data: { type: 'optimization_started' },
          },
          trigger: null,
        });
        
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
      
      if (this.restartTimer) {
        clearInterval(this.restartTimer);
        this.restartTimer = null;
      }
      
      console.log('Background location service stopped');
    } catch (error) {
      console.error('Failed to stop background location service:', error);
    }
  }

  async checkServiceStatus(): Promise<boolean> {
    try {
      const isLocationTaskRunning = await TaskManager.isTaskRunning(BACKGROUND_LOCATION_TASK);
      const gpsStatus = gpsService.getTrackingStatus();
      
      const actualStatus = isLocationTaskRunning && gpsStatus;
      
      if (this.isServiceRunning && !actualStatus) {
        console.log('Service status mismatch detected');
      }
      
      return actualStatus;
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
      await new Promise(resolve => setTimeout(resolve, 3000));
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
      
      try {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      } catch (e) {
        console.log('Location updates already stopped');
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const restarted = await this.startService();
      
      if (restarted) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'MXP Daily',
            body: 'App optimization restarted',
            data: { type: 'optimization_restarted' },
          },
          trigger: null,
        });
      }
      
      return restarted;
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

export const backgroundLocationService = BackgroundLocationService.getInstance();