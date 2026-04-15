import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, AppState, AppStateStatus, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Updates from 'expo-updates';
import { supabase, initSupabaseKeepAlive } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import { initOfflineQueue } from '../lib/offlineQueue';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode; onReset: () => void }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaProvider>
          <View style={errorStyles.container}>
            <View style={errorStyles.content}>
              <Text style={errorStyles.icon}>⚠️</Text>
              <Text style={errorStyles.title}>Something went wrong</Text>
              <Text style={errorStyles.message}>
                Kindly close the app completely and open again, then rescan your booking.
              </Text>
              <Text style={errorStyles.hint}>
                If this keeps happening, check your internet connection.
              </Text>
              <TouchableOpacity
                style={errorStyles.button}
                onPress={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onReset();
                }}
              >
                <Text style={errorStyles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaProvider>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#ff6b00',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Update Screen Component
function UpdateScreen({ progress, status }: { progress: number; status: string }) {
  return (
    <SafeAreaProvider>
      <View style={updateStyles.container}>
        <View style={updateStyles.content}>
          <View style={updateStyles.iconContainer}>
            <Text style={updateStyles.icon}>🚀</Text>
          </View>
          <Text style={updateStyles.title}>Updating App</Text>
          <Text style={updateStyles.subtitle}>{status}</Text>

          <View style={updateStyles.progressContainer}>
            <View style={updateStyles.progressBar}>
              <View style={[updateStyles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={updateStyles.progressText}>{Math.round(progress)}%</Text>
          </View>

          <Text style={updateStyles.hint}>Please wait, this will only take a moment...</Text>

          <ActivityIndicator size="large" color="#ff6b00" style={updateStyles.spinner} />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const updateStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b00',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});

function RootLayoutContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Update states
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('Checking for updates...');

  const router = useRouter();
  const segments = useSegments();

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    // Skip update check in development (Expo Go)
    if (__DEV__) {
      console.log('Skipping update check in development mode');
      return false;
    }

    try {
      console.log('Checking for updates...');
      setUpdateStatus('Checking for updates...');

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        console.log('Update available, downloading...');
        setIsUpdating(true);
        setUpdateStatus('Downloading update...');
        setUpdateProgress(10);

        // Download the update
        const fetchResult = await Updates.fetchUpdateAsync();

        if (fetchResult.isNew) {
          setUpdateProgress(90);
          setUpdateStatus('Installing update...');

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 500));

          setUpdateProgress(100);
          setUpdateStatus('Restarting app...');

          // Small delay before reload
          await new Promise(resolve => setTimeout(resolve, 300));

          // Reload the app with the new update
          await Updates.reloadAsync();
        }

        return true;
      } else {
        console.log('App is up to date');
        return false;
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      // Don't block app if update check fails
      setIsUpdating(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const cleanupKeepAlive = initSupabaseKeepAlive();

    const initializeApp = async () => {
      try {
        console.log('Initializing app...');

        // Check for updates first (before anything else)
        const hasUpdate = await checkForUpdates();
        if (hasUpdate) {
          // If update is being applied, don't continue initialization
          // The app will reload with new version
          return;
        }

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
        initializeApp();
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
      cleanupKeepAlive();
    };
  }, [router, checkForUpdates]);

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
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('App state changed from', appState, 'to', nextAppState);

      // Check for updates when app comes to foreground
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground, checking for updates...');
        await checkForUpdates();
      }

      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [appState, checkForUpdates]);

  // Show update screen if updating
  if (isUpdating) {
    return <UpdateScreen progress={updateProgress} status={updateStatus} />;
  }

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

export default function RootLayout() {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <ErrorBoundary key={resetKey} onReset={handleReset}>
      <RootLayoutContent />
    </ErrorBoundary>
  );
}