import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await notificationService.initializeNotifications();
        console.log('Notification service initialized in root layout');
        
        const { data, error } = await supabase.auth.getSession();
        const userSignedIn = !!data.session;
        setIsSignedIn(userSignedIn);
        
      } catch (err) {
        console.error('Error initializing app:', err);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      const userSignedIn = !!session;
      setIsSignedIn(userSignedIn);
      setInitialCheckDone(true);
      
      if (event === 'SIGNED_OUT' && !userSignedIn) {
        console.log('User signed out - redirecting to login');
        try {
          await notificationService.stopAllWashReminders();
        } catch (error) {
          console.error('Error stopping notifications:', error);
        }
        router.replace('/(auth)/login');
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
    if (isLoading || !initialCheckDone) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    console.log('Route check - isSignedIn:', isSignedIn, 'inAuthGroup:', inAuthGroup, 'segments:', segments);
    
    if (!isSignedIn && !inAuthGroup) {
      console.log('Not signed in and not in auth group - redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isSignedIn, isLoading, initialCheckDone, segments]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed from', appState, 'to', nextAppState);
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [appState]);

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