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
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        showLocationServicesAlert();
        return;
      }

      const permissions = await backgroundLocationService.getLocationPermissionStatus();
      
      if (permissions.foreground === 'granted' && permissions.background === 'granted') {
        setHasCheckedPermissions(true);
        onPermissionsGranted?.();
        return;
      }

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
      const foregroundResult = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundResult.status !== 'granted') {
        showPermissionDeniedAlert('Location access is required for route optimization and delivery efficiency.');
        onPermissionsDenied?.();
        return;
      }

      const backgroundResult = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundResult.status !== 'granted') {
        showBackgroundLocationAlert();
        onPermissionsDenied?.();
        return;
      }

      const notificationResult = await Notifications.requestPermissionsAsync();
      
      if (notificationResult.status !== 'granted') {
        showNotificationPermissionAlert();
        onPermissionsDenied?.();
        return;
      }

      setHasCheckedPermissions(true);
      onPermissionsGranted?.();
      
    } catch (error) {
      console.error('Error requesting permissions:', error);
      onPermissionsDenied?.();
    }
  };

  const showLocationServicesAlert = () => {
    Alert.alert(
      'Location Services Required',
      'Please enable location services in your device settings for app optimization.',
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
      ? 'For optimal app performance, please select "Allow all the time" in the next screen.'
      : 'Background location access is needed for continuous app optimization.';
    
    Alert.alert(
      'Background Access Required',
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
      'Notifications are required for app optimization status updates.',
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

  return null;
}

export { GPSPermissionHandler };