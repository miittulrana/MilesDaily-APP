import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import { backgroundLocationService } from '../lib/backgroundLocation';
import GPSPermissionHandler from '../components/gps/GPSPermissionHandler';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [gpsInitialized, setGpsInitialized] = useState(false);
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
      console.log('GPS permissions granted - starting persistent background service');
      const started = await backgroundLocationService.startService();
      if (started) {
        console.log('Persistent background GPS tracking started - will continue even when app is closed');
      } else {
        console.log('Failed to start persistent background GPS tracking');
      }
    } catch (error) {
      console.error('Error starting persistent GPS service:', error);
    }
  };

  const handleGPSPermissionsDenied = () => {
    console.log('GPS permissions denied - tracking disabled');
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App backgrounded - GPS tracking continues');
      } else if (nextAppState === 'active') {
        console.log('App foregrounded - checking GPS service status');
        if (isSignedIn && gpsInitialized) {
          backgroundLocationService.checkServiceStatus();
        }
      }
    };

    console.log('App state change handler set up');

    return () => {
      console.log('App state change handler cleaned up');
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