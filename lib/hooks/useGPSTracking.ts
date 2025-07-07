import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { gpsService } from '../gpsService';
import { getDriverInfo } from '../auth';

export interface GPSTrackingState {
  isTracking: boolean;
  hasPermissions: boolean;
  isLocationEnabled: boolean;
  loading: boolean;
  error: string | null;
}

export const useGPSTracking = () => {
  const [state, setState] = useState<GPSTrackingState>({
    isTracking: false,
    hasPermissions: false,
    isLocationEnabled: false,
    loading: true,
    error: null,
  });

  const updateState = (updates: Partial<GPSTrackingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const initializeGPS = async () => {
    try {
      updateState({ loading: true, error: null });

      const driver = await getDriverInfo();
      if (!driver) {
        updateState({ 
          loading: false, 
          error: 'Driver information not found' 
        });
        return;
      }

      const isLocationEnabled = await gpsService.isLocationServiceEnabled();
      if (!isLocationEnabled) {
        updateState({ 
          loading: false, 
          isLocationEnabled: false,
          error: 'Location services are disabled' 
        });
        return;
      }

      const hasPermissions = await gpsService.requestPermissions();
      if (!hasPermissions) {
        updateState({ 
          loading: false, 
          hasPermissions: false,
          error: 'Location permissions not granted' 
        });
        return;
      }

      const success = await gpsService.startTracking(driver.id);
      if (success) {
        updateState({
          isTracking: true,
          hasPermissions: true,
          isLocationEnabled: true,
          loading: false,
          error: null,
        });
      } else {
        updateState({
          loading: false,
          error: 'Failed to start GPS tracking',
        });
      }
    } catch (error) {
      console.error('Error initializing GPS:', error);
      updateState({
        loading: false,
        error: 'Failed to initialize GPS tracking',
      });
    }
  };

  const stopGPS = async () => {
    try {
      await gpsService.stopTracking();
      updateState({ isTracking: false });
    } catch (error) {
      console.error('Error stopping GPS:', error);
      updateState({ error: 'Failed to stop GPS tracking' });
    }
  };

  const resumeGPS = async () => {
    try {
      await gpsService.resumeTrackingIfNeeded();
      updateState({ isTracking: gpsService.isCurrentlyTracking() });
    } catch (error) {
      console.error('Error resuming GPS:', error);
    }
  };

  useEffect(() => {
    initializeGPS();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        resumeGPS();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    ...state,
    startGPS: initializeGPS,
    stopGPS,
    resumeGPS,
  };
};