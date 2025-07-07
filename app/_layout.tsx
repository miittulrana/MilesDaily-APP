import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MXP Daily',
          body: 'App optimization in progress',
          data: { type: 'optimization_active' },
        },
        trigger: null,
      });
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }
    
    for (const location of locations) {
      try {
        const { gpsService } = await import('../lib/gpsService');
        await gpsService.processLocationUpdate(location);
      } catch (err) {
        console.error('Error processing location:', err);
      }
    }
  }
});

import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import { backgroundLocationService } from '../lib/backgroundLocation';
import GPSPermissionHandler from '../components/gps/GPSPermissionHandler';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [gpsInitialized, setGpsInitialized] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await notificationService.initializeNotifications();
        console.log('Notification service initialized in root layout');
        
        await backgroundLocationService.initialize();
        console.log('Background location service initialized');
        
        const { data, error } = await supabase.auth.getSession();
        const userSignedIn = !!data.session;
        setIsSignedIn(userSignedIn);
        
        if (userSignedIn) {
          setGpsInitialized(true);
          setTimeout(async () => {
            try {
              const started = await backgroundLocationService.startService();
              if (started) {
                console.log('Auto-started GPS service after app initialization');
              }
            } catch (error) {
              console.error('Failed to auto-start GPS service:', error);
            }
          }, 2000);
        }
      } catch (err) {
        console.error('Error initializing app:', err);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const userSignedIn = !!session;
      setIsSignedIn(userSignedIn);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in - initializing GPS tracking');
        setGpsInitialized(true);
        setTimeout(async () => {
          try {
            const started = await backgroundLocationService.forceRestartService();
            if (started) {
              console.log('GPS service started after sign in');
            }
          } catch (error) {
            console.error('Failed to start GPS after sign in:', error);
          }
        }, 1000);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out - stopping GPS tracking');
        await backgroundLocationService.stopService();
        await notificationService.stopAllWashReminders();
        setGpsInitialized(false);
      }
    });

    const responseSubscription = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        
        const data = response.notification.request.content.data;
        
        if (data?.type === 'wash_reminder' && data?.action === 'complete_wash') {
          if (isSignedIn) {
            console.log('Navigating to wash screen from notification');
            router.push('/(dashboard)/wash');
          }
        }
      }
    );

    const receivedSubscription = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received while app open:', notification);
        
        const data = notification.request.content.data;
        
        if (data?.type === 'wash_reminder') {
          console.log('Wash reminder received:', data);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDashboardGroup = segments[0] === '(dashboard)';
    
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(dashboard)');
    }
  }, [isSignedIn, isLoading, segments, router]);

  const handleGPSPermissionsGranted = async () => {
    try {
      console.log('GPS permissions granted - starting background service');
      const started = await backgroundLocationService.startService();
      if (started) {
        console.log('Background GPS tracking started successfully');
      } else {
        console.log('Failed to start background GPS tracking');
      }
    } catch (error) {
      console.error('Error starting GPS service:', error);
    }
  };

  const handleGPSPermissionsDenied = () => {
    console.log('GPS permissions denied - tracking disabled');
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed from', appState, 'to', nextAppState);
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground');
        
        if (isSignedIn && gpsInitialized) {
          setTimeout(async () => {
            try {
              const isRunning = await backgroundLocationService.checkServiceStatus();
              if (!isRunning) {
                console.log('GPS service not running, attempting to restart');
                const restarted = await backgroundLocationService.forceRestartService();
                if (restarted) {
                  console.log('GPS service restarted successfully');
                } else {
                  console.log('Failed to restart GPS service');
                }
              } else {
                console.log('GPS service is running normally');
              }
            } catch (error) {
              console.error('Error checking/restarting GPS service:', error);
            }
          }, 3000);
        }
      } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App went to background - GPS tracking continues');
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [appState, isSignedIn, gpsInitialized]);

  useEffect(() => {
    if (!isSignedIn || !gpsInitialized) return;

    const checkInterval = setInterval(async () => {
      try {
        const isRunning = await backgroundLocationService.checkServiceStatus();
        if (!isRunning) {
          console.log('GPS service stopped unexpectedly, restarting...');
          const restarted = await backgroundLocationService.forceRestartService();
          if (restarted) {
            console.log('GPS service restarted successfully');
          } else {
            console.log('Failed to restart GPS service');
          }
        }
      } catch (error) {
        console.error('Error during periodic GPS check:', error);
      }
    }, 30000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [isSignedIn, gpsInitialized]);

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {isSignedIn && gpsInitialized && (
          <GPSPermissionHandler
            onPermissionsGranted={handleGPSPermissionsGranted}
            onPermissionsDenied={handleGPSPermissionsDenied}
          />
        )}
        
        <Slot />
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}