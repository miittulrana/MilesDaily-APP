import * as TaskManager from 'expo-task-manager';
import { locationService } from './locationService';

export class LocationTaskManager {
  static async initializeLocationTracking(): Promise<void> {
    try {
      await locationService.initialize();
    } catch (error) {
      console.error('Failed to initialize location tracking:', error);
    }
  }

  static async startLocationTracking(): Promise<boolean> {
    try {
      return await locationService.startTracking();
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }

  static async stopLocationTracking(): Promise<boolean> {
    try {
      return await locationService.stopTracking();
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
      return false;
    }
  }

  static async getTrackingStatus(): Promise<boolean> {
    try {
      return await locationService.isTracking();
    } catch (error) {
      console.error('Failed to get tracking status:', error);
      return false;
    }
  }

  static async cleanupLocationTasks(): Promise<void> {
    try {
      const registeredTasks = TaskManager.getRegisteredTasksAsync();
      console.log('Registered tasks:', registeredTasks);
    } catch (error) {
      console.error('Failed to cleanup location tasks:', error);
    }
  }
}

export { locationService };