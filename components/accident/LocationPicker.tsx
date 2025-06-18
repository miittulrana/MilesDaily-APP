import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import FormInput from '../FormInput';
import LoadingIndicator from '../LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';

interface LocationPickerProps {
  address: string;
  onAddressChange: (address: string) => void;
  onLocationChange: (latitude: number, longitude: number) => void;
}

export default function LocationPicker({
  address,
  onAddressChange,
  onLocationChange
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentCoordinates, setCurrentCoordinates] = useState<{lat: number; lng: number} | null>(null);

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
          'Please enable location access to automatically detect the accident location.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const { latitude, longitude } = location.coords;
      setCurrentCoordinates({ lat: latitude, lng: longitude });
      onLocationChange(latitude, longitude);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const formattedAddress = [
          place.streetNumber,
          place.street,
          place.city,
          place.region,
          place.country
        ].filter(Boolean).join(', ');
        
        onAddressChange(formattedAddress);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get current location. Please enter the address manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Accident Location</Text>
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <LoadingIndicator size="small" color={colors.primary} message="" />
          ) : (
            <>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={styles.gpsButtonText}>Use GPS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FormInput
        label=""
        placeholder="Enter accident location address"
        value={address}
        onChangeText={onAddressChange}
        multiline
        numberOfLines={3}
        containerStyle={styles.addressInput}
      />

      {currentCoordinates && (
        <View style={styles.coordinatesDisplay}>
          <View style={styles.coordinatesHeader}>
            <Ionicons name="navigate-circle-outline" size={16} color={colors.success} />
            <Text style={styles.coordinatesTitle}>GPS Coordinates</Text>
          </View>
          <Text style={styles.coordinatesText}>
            Lat: {currentCoordinates.lat.toFixed(6)}, Lng: {currentCoordinates.lng.toFixed(6)}
          </Text>
        </View>
      )}

      <Text style={styles.hint}>
        Provide the exact location where the accident occurred. Use GPS for precise location coordinates.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: layouts.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: layouts.spacing.md,
    paddingVertical: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  gpsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: layouts.spacing.xs,
  },
  addressInput: {
    marginBottom: layouts.spacing.sm,
  },
  coordinatesDisplay: {
    backgroundColor: colors.success + '10',
    borderWidth: 1,
    borderColor: colors.success + '30',
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    marginBottom: layouts.spacing.sm,
  },
  coordinatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.xs,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginLeft: layouts.spacing.xs,
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.success,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});