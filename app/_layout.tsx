import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await notificationService.initializeNotifications();
        console.log('Notification service initialized in root layout');
        
        const { data, error } = await supabase.auth.getSession();
        setIsSignedIn(!!data.session);
      } catch (err) {
        console.error('Error initializing app:', err);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsSignedIn(!!session);
      
      if (event === 'SIGNED_OUT') {
        await notificationService.stopAllWashReminders();
        console.log('Stopped all wash reminders on sign out');
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
  }, [isSignedIn, router]);

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

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App backgrounded - wash reminders continue');
      } else if (nextAppState === 'active') {
        console.log('App foregrounded');
      }
    };

    console.log('App state change handler set up');

    return () => {
      console.log('App state change handler cleaned up');
    };
  }, []);

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
        <Slot />
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}