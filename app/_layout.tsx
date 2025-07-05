import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import { backgroundLocationService } from '../lib/backgroundLocation';
import GPSPermissionHandler from '../components/gps/GPSPermissionHandler';
import * as Notifications from 'expo-notifications';

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
        // Initialize notifications first
        await notificationService.initializeNotifications();
        console.log('Notification service initialized in root layout');
        
        // Initialize background location service
        await backgroundLocationService.initialize();
        console.log('Background location service initialized');
        
        // Get auth session
        const { data, error } = await supabase.auth.getSession();
        const userSignedIn = !!data.session;
        setIsSignedIn(userSignedIn);
        
        // If user is signed in, set up GPS
        if (userSignedIn) {
          setGpsInitialized(true);
          // Auto-start GPS if user was previously signed in
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
        // Force start GPS after sign in
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
        
        // Check and restart GPS service if needed when app becomes active
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

  // Periodic check to ensure GPS service is running
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
    }, 30000); // Check every 30 seconds

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
        {/* GPS Permission Handler - Only active when user is signed in */}
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