import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { backgroundLocationService } from '../../lib/backgroundLocation';

interface GPSPermissionHandlerProps {
  onPermissionsGranted?: () => void;
  onPermissionsDenied?: () => void;
}

export default function GPSPermissionHandler({
  onPermissionsGranted,
  onPermissionsDenied,
}: GPSPermissionHandlerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);

  useEffect(() => {
    if (!hasCheckedPermissions) {
      checkAndRequestPermissions();
    }
  }, [hasCheckedPermissions]);

  const checkAndRequestPermissions = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      // Check if location services are enabled
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        showLocationServicesAlert();
        return;
      }

      // Check current permissions
      const permissions = await backgroundLocationService.getLocationPermissionStatus();
      
      if (permissions.foreground === 'granted' && permissions.background === 'granted') {
        // All permissions granted
        setHasCheckedPermissions(true);
        onPermissionsGranted?.();
        return;
      }

      // Request permissions step by step
      await requestPermissionsFlow();
      
    } catch (error) {
      console.error('Error checking permissions:', error);
      onPermissionsDenied?.();
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermissionsFlow = async () => {
    try {
      // Step 1: Request foreground location permission
      const foregroundResult = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundResult.status !== 'granted') {
        showPermissionDeniedAlert('Location access is required for route optimization and delivery efficiency.');
        onPermissionsDenied?.();
        return;
      }

      // Step 2: Request background location permission
      const backgroundResult = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundResult.status !== 'granted') {
        showBackgroundLocationAlert();
        onPermissionsDenied?.();
        return;
      }

      // Step 3: Request notification permissions (for foreground service)
      const notificationResult = await Notifications.requestPermissionsAsync();
      
      if (notificationResult.status !== 'granted') {
        showNotificationPermissionAlert();
        onPermissionsDenied?.();
        return;
      }

      // All permissions granted
      setHasCheckedPermissions(true);
      onPermissionsGranted?.();
      
    } catch (error) {
      console.error('Error requesting permissions:', error);
      onPermissionsDenied?.();
    }
  };

  const showLocationServicesAlert = () => {
    Alert.alert(
      'GPS Required',
      'Please enable GPS services in your device settings for route optimization.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => onPermissionsDenied?.() },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const showPermissionDeniedAlert = (message: string) => {
    Alert.alert(
      'Permission Required',
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => onPermissionsDenied?.() },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const showBackgroundLocationAlert = () => {
    const message = Platform.OS === 'android' 
      ? 'For optimal route planning, please select "Allow all the time" in the next screen.'
      : 'Background location access is needed for continuous route optimization.';
    
    Alert.alert(
      'Background GPS Access',
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => onPermissionsDenied?.() },
        { text: 'Continue', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const showNotificationPermissionAlert = () => {
    Alert.alert(
      'Notification Permission',
      'Notifications are required for fleet service coordination.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => onPermissionsDenied?.() },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const recheckPermissions = async () => {
    setHasCheckedPermissions(false);
    await checkAndRequestPermissions();
  };

  // This component doesn't render anything visible
  return null;
}

export { GPSPermissionHandler };