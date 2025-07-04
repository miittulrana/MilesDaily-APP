import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import LoadingIndicator from '../LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { LocationData } from '../../utils/truckLogTypes';

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  currentLocation?: LocationData | null;
  disabled?: boolean;
}

export default function LocationPicker({ onLocationSelect, currentLocation, disabled = false }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
      setHasPermission(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);

      let permissionGranted = hasPermission;
      if (!permissionGranted) {
        permissionGranted = await requestLocationPermission();
      }

      if (!permissionGranted) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to capture your punch location.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: Date.now(),
      };

      onLocationSelect(locationData);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getAccuracyText = (accuracy?: number) => {
    if (!accuracy) return '';
    if (accuracy < 10) return 'High accuracy';
    if (accuracy < 50) return 'Good accuracy';
    return 'Low accuracy';
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return colors.gray400;
    if (accuracy < 10) return colors.success;
    if (accuracy < 50) return colors.warning;
    return colors.error;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Location</Text>
        <TouchableOpacity
          style={[
            styles.captureButton,
            disabled && styles.captureButtonDisabled
          ]}
          onPress={getCurrentLocation}
          disabled={loading || disabled}
        >
          {loading ? (
            <LoadingIndicator size="small" color={colors.primary} message="" />
          ) : (
            <>
              <Ionicons 
                name="location" 
                size={16} 
                color={disabled ? colors.gray400 : colors.primary} 
              />
              <Text style={[
                styles.captureButtonText,
                disabled && styles.captureButtonTextDisabled
              ]}>
                Capture GPS
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {currentLocation ? (
        <View style={styles.locationDisplay}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={20} color={colors.success} />
            <Text style={styles.locationTitle}>Location Captured</Text>
          </View>

          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesText}>
              {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
            </Text>
            {currentLocation.accuracy && (
              <View style={[
                styles.accuracyBadge,
                { backgroundColor: getAccuracyColor(currentLocation.accuracy) + '20' }
              ]}>
                <Text style={[
                  styles.accuracyText,
                  { color: getAccuracyColor(currentLocation.accuracy) }
                ]}>
                  ±{Math.round(currentLocation.accuracy)}m
                </Text>
              </View>
            )}
          </View>

          {currentLocation.accuracy && (
            <Text style={[
              styles.accuracyLabel,
              { color: getAccuracyColor(currentLocation.accuracy) }
            ]}>
              {getAccuracyText(currentLocation.accuracy)}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.noLocationDisplay}>
          <Ionicons name="location-outline" size={24} color={colors.gray400} />
          <Text style={styles.noLocationText}>
            {hasPermission === false 
              ? 'Location permission required'
              : 'No location captured yet'
            }
          </Text>
        </View>
      )}

      <Text style={styles.hint}>
        Your location will be automatically captured when you punch in/out for accurate tracking.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: layouts.spacing.xs,
  },
  captureButtonDisabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray300,
  },
  captureButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  captureButtonTextDisabled: {
    color: colors.gray400,
  },
  locationDisplay: {
    backgroundColor: colors.success + '10',
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    marginBottom: layouts.spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
    gap: layouts.spacing.sm,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: layouts.spacing.xs,
  },
  coordinatesText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    fontFamily: 'monospace',
  },
  accuracyBadge: {
    paddingVertical: 2,
    paddingHorizontal: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.sm,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accuracyLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  noLocationDisplay: {
    alignItems: 'center',
    padding: layouts.spacing.lg,
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.md,
    gap: layouts.spacing.sm,
  },
  noLocationText: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});