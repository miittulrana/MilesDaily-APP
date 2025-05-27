import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { LocationTaskManager } from '../lib/locationTaskManager';
import '../tasks/locationTask';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await LocationTaskManager.initializeLocationTracking();
        
        const { data, error } = await supabase.auth.getSession();
        setIsSignedIn(!!data.session);
        
        if (data.session) {
          const isTracking = await LocationTaskManager.getTrackingStatus();
          if (!isTracking) {
            setTimeout(async () => {
              await LocationTaskManager.startLocationTracking();
            }, 1000);
          }
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
      setIsSignedIn(!!session);
      
      if (event === 'SIGNED_IN' && session) {
        setTimeout(async () => {
          await LocationTaskManager.startLocationTracking();
        }, 2000);
      } else if (event === 'SIGNED_OUT') {
        await LocationTaskManager.stopLocationTracking();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Slot />
    </SafeAreaProvider>
  );
}