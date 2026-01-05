import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, AppState, AppStateStatus, Alert, View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import { initOfflineQueue } from '../lib/offlineQueue';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        const networkState = await NetInfo.fetch();
        console.log('Network state:', networkState);
        setIsConnected(networkState.isConnected ?? false);
        
        if (!networkState.isConnected) {
          setInitError('No internet connection');
          setIsLoading(false);
          return;
        }

        try {
          await initOfflineQueue();
          console.log('Offline queue initialized');
        } catch (queueError) {
          console.warn('Offline queue initialization failed:', queueError);
        }

        try {
          await notificationService.initializeNotifications();
          console.log('Notification service initialized');
        } catch (notifError) {
          console.warn('Notification initialization failed:', notifError);
        }
        
        console.log('Checking auth session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          setInitError(`Authentication error: ${error.message}`);
          setIsSignedIn(false);
        } else {
          const userSignedIn = !!data.session;
          console.log('User signed in:', userSignedIn);
          setIsSignedIn(userSignedIn);
        }
        
      } catch (err) {
        console.error('App initialization error:', err);
        setInitError(`Initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
        setInitialCheckDone(true);
      }
    };

    initializeApp();

    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      console.log('Network state changed:', state);
      setIsConnected(state.isConnected ?? false);
      
      if (!state.isConnected) {
        setInitError('No internet connection');
      } else if (initError === 'No internet connection') {
        setInitError(null);
        if (!initialCheckDone) {
          initializeApp();
        }
      }
    });

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
      unsubscribeNetInfo();
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
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (initError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            Connection Error
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>
            {initError}
          </Text>
          {!isConnected && (
            <Text style={{ textAlign: 'center', fontSize: 14, color: '#666' }}>
              Please check your internet connection and try again.
            </Text>
          )}
        </View>
      </SafeAreaProvider>
    );
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