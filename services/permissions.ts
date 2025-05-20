import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Config } from '../constants/Config';
import { Alert, Platform } from 'react-native';

export async function requestLocationPermissions() {
  let foregroundPermission = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundPermission.status !== 'granted') {
    Alert.alert(
      'Permission required',
      'Location permission is required for tracking. Please enable it in settings.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  // Request background permissions
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundPermission.status !== 'granted') {
      Alert.alert(
        'Background Permission',
        'Background location permission not granted. Tracking will only work when the app is open.',
        [{ text: 'OK' }]
      );
    }
  }
  
  return true;
}

export async function registerBackgroundTask(taskCallback: TaskManager.TaskManagerTaskCallback) {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(Config.locationTaskName);
  
  if (!isRegistered) {
    TaskManager.defineTask(Config.locationTaskName, taskCallback);
  }
  
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(Config.locationTaskName)
    .catch(() => false);
  
  if (!hasStarted) {
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
  }
  
  return true;
}

export async function stopBackgroundTask() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(Config.locationTaskName)
    .catch(() => false);
  
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(Config.locationTaskName);
  }
}