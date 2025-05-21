import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Alert, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useBattery } from '../../hooks/useBattery';
import { createDriverIfNotExists, getDriver } from '../../services/database';
import { startBackgroundLocationUpdates } from '../../utils/locationTask';
import { requestLocationPermissions } from '../../services/permissions';
import Header from '../../components/common/Header';
import StatusIndicator from '../../components/tracking/StatusIndicator';
import TrackingInfo from '../../components/tracking/TrackingInfo';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Colors } from '../../constants/Colors';
import Toast from 'react-native-toast-message';

function Card({ children, style }: { children: React.ReactNode, style?: any }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

export default function TrackingScreen() {
  const { user, signOut } = useAuth();
  const { batteryLevel } = useBattery();
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    location,
    errorMsg,
    isTracking,
    startLocationTracking,
    stopLocationTracking
  } = useLocation((user as any)?.id);

  useEffect(() => {
    async function initializeTracking() {
      try {
        setLoading(true);
        
        if (!user) {
          setError('User is not authenticated. Please log in again.');
          setLoading(false);
          return;
        }
        
        console.log('Initializing tracking for user:', (user as any).id);
        
        try {
          await createDriverIfNotExists(user as any);
          console.log('Driver created or verified');
        } catch (driverError: any) {
          console.error('Error creating driver:', driverError);
          // Continue anyway - we'll handle display if driver info is missing
        }
        
        try {
          const driverData = await getDriver((user as any).id);
          console.log('Driver data loaded:', driverData);
          setDriverInfo(driverData);
        } catch (driverDataError: any) {
          console.error('Error loading driver data:', driverDataError);
          // Continue anyway with default driver info
          setDriverInfo({
            id: (user as any).id,
            name: 'Driver',
            email: (user as any).email || 'Unknown'
          });
        }
        
        const hasPermission = await requestLocationPermissions();
        
        if (hasPermission) {
          await startLocationTracking();
          
          try {
            await startBackgroundLocationUpdates();
            console.log('Background location updates started');
            
            Toast.show({
              type: 'success',
              text1: 'Tracking active',
              text2: 'Your location is being tracked',
              position: 'bottom',
            });
          } catch (bgError: any) {
            console.error('Error starting background updates:', bgError);
            // Continue anyway - foreground tracking still works
          }
        } else {
          setError('Location permission denied. Tracking disabled.');
        }
      } catch (err: any) {
        console.error('Error initializing tracking:', err);
        setError(err.message || 'Failed to initialize tracking');
      } finally {
        setLoading(false);
      }
    }
    
    initializeTracking();
    
    return () => {
      stopLocationTracking();
    };
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout? This will stop tracking your location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await stopLocationTracking();
            await signOut();
          },
        },
      ]
    );
  };

  const formatLastUpdate = () => {
    if (!location) return '';
    
    const date = new Date(location.timestamp);
    return date.toLocaleTimeString();
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Starting tracking..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Location Tracking"
        showLogoutButton
        onLogoutPress={handleLogout}
      />
      
      <ScrollView style={styles.content}>
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => {
              setError(null);
              startLocationTracking();
            }}
          />
        )}
        
        {errorMsg && <ErrorMessage message={errorMsg} />}
        
        <StatusIndicator
          isTracking={isTracking}
          lastUpdate={formatLastUpdate()}
          batteryLevel={batteryLevel !== null ? batteryLevel : undefined}
        />
        
        <TrackingInfo
          location={location?.coords}
          batteryLevel={batteryLevel !== null ? batteryLevel : undefined}
          driverName={driverInfo?.name}
        />
        
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Tracking Status</Text>
          <Text style={styles.infoText}>
            Your location is being tracked automatically every 3 seconds.
          </Text>
          <Text style={styles.infoText}>
            Tracking will continue in the background even if you close the app.
          </Text>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Settings"
            onPress={() => router.push('/(auth)/settings')}
            variant="outline"
          />
        </View>
      </ScrollView>
      
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCard: {
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  buttonContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
});