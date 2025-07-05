import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
}

export interface GPSSettings {
  updateInterval: number;
  accuracy: Location.Accuracy;
  distanceFilter: number;
  enableHighAccuracy: boolean;
}

export const DEFAULT_GPS_SETTINGS: GPSSettings = {
  updateInterval: 3000, // 3 seconds
  accuracy: Location.Accuracy.High,
  distanceFilter: 0, // Track even if not moving
  enableHighAccuracy: true,
};

export const GPS_ACCURACY_LEVELS = {
  LOW: Location.Accuracy.Low,
  BALANCED: Location.Accuracy.Balanced,
  HIGH: Location.Accuracy.High,
  HIGHEST: Location.Accuracy.Highest,
  BEST_FOR_NAVIGATION: Location.Accuracy.BestForNavigation,
};

/**
 * Calculate distance between two GPS coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}

/**
 * Calculate bearing between two GPS coordinates in degrees
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const bearing = Math.atan2(y, x);
  return ((bearing * 180) / Math.PI + 360) % 360;
}

/**
 * Convert speed from m/s to km/h
 */
export function convertSpeedToKmh(speedMs: number): number {
  return speedMs * 3.6;
}

/**
 * Convert speed from km/h to m/s
 */
export function convertSpeedToMs(speedKmh: number): number {
  return speedKmh / 3.6;
}

/**
 * Check if GPS coordinates are valid
 */
export function isValidGPSCoordinates(lat: number, lon: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    !isNaN(lat) &&
    !isNaN(lon)
  );
}

/**
 * Get optimal GPS settings based on device and platform
 */
export function getOptimalGPSSettings(
  powerSaveMode: boolean = false
): GPSSettings {
  const settings: GPSSettings = { ...DEFAULT_GPS_SETTINGS };

  if (powerSaveMode) {
    settings.updateInterval = 5000; // 5 seconds
    settings.accuracy = Location.Accuracy.Balanced;
    settings.distanceFilter = 10; // 10 meters
  }

  // Platform-specific optimizations
  if (Platform.OS === 'android') {
    // Android-specific optimizations
    settings.enableHighAccuracy = true;
  } else if (Platform.OS === 'ios') {
    // iOS-specific optimizations
    settings.accuracy = Location.Accuracy.BestForNavigation;
  }

  return settings;
}

/**
 * Format GPS coordinates for display
 */
export function formatGPSCoordinates(
  lat: number,
  lon: number,
  precision: number = 6
): string {
  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
}

/**
 * Check if location has sufficient accuracy
 */
export function hasGoodAccuracy(
  accuracy: number | null | undefined,
  threshold: number = 50
): boolean {
  if (accuracy === null || accuracy === undefined) {
    return false;
  }
  return accuracy <= threshold;
}

/**
 * Calculate estimated time of arrival based on distance and speed
 */
export function calculateETA(
  distanceMeters: number,
  speedKmh: number
): number {
  if (speedKmh <= 0) return 0;
  
  const distanceKm = distanceMeters / 1000;
  const timeHours = distanceKm / speedKmh;
  return timeHours * 60; // Return in minutes
}

/**
 * Smooth GPS coordinates to reduce jitter
 */
export class GPSSmoothing {
  private history: GPSCoordinates[] = [];
  private maxHistorySize = 5;

  addCoordinate(coordinate: GPSCoordinates): GPSCoordinates {
    this.history.push(coordinate);
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return this.getSmoothedCoordinate();
  }

  private getSmoothedCoordinate(): GPSCoordinates {
    if (this.history.length === 0) {
      throw new Error('No GPS coordinates to smooth');
    }

    if (this.history.length === 1) {
      return this.history[0];
    }

    // Weight recent coordinates more heavily
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLon = 0;
    let weightedAccuracy = 0;
    let weightedSpeed = 0;
    let weightedHeading = 0;

    for (let i = 0; i < this.history.length; i++) {
      const weight = i + 1; // More recent coordinates get higher weight
      const coord = this.history[i];
      
      totalWeight += weight;
      weightedLat += coord.latitude * weight;
      weightedLon += coord.longitude * weight;
      weightedAccuracy += (coord.accuracy || 0) * weight;
      weightedSpeed += (coord.speed || 0) * weight;
      weightedHeading += (coord.heading || 0) * weight;
    }

    return {
      latitude: weightedLat / totalWeight,
      longitude: weightedLon / totalWeight,
      accuracy: weightedAccuracy / totalWeight,
      speed: weightedSpeed / totalWeight,
      heading: weightedHeading / totalWeight,
    };
  }

  reset(): void {
    this.history = [];
  }
}

/**
 * GPS location validator
 */
export function validateGPSLocation(location: Location.LocationObject): boolean {
  const { latitude, longitude, accuracy } = location.coords;
  
  // Check if coordinates are valid
  if (!isValidGPSCoordinates(latitude, longitude)) {
    return false;
  }

  // Check if accuracy is reasonable (less than 100 meters)
  if (accuracy && accuracy > 100) {
    return false;
  }

  return true;
}

/**
 * Create GPS location object from Expo location
 */
export function createGPSLocation(location: Location.LocationObject): GPSCoordinates {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy || undefined,
    speed: location.coords.speed || undefined,
    heading: location.coords.heading || undefined,
    altitude: location.coords.altitude || undefined,
  };
}

/**
 * Get device GPS capabilities
 */
export async function getGPSCapabilities(): Promise<{
  hasLocationServices: boolean;
  hasGPS: boolean;
  hasNetworkLocation: boolean;
  hasPassiveLocation: boolean;
}> {
  try {
    const hasLocationServices = await Location.hasServicesEnabledAsync();
    
    // For mobile devices, assume GPS is available
    const hasGPS = Platform.OS === 'android' || Platform.OS === 'ios';
    
    return {
      hasLocationServices,
      hasGPS,
      hasNetworkLocation: hasLocationServices,
      hasPassiveLocation: hasLocationServices,
    };
  } catch (error) {
    console.error('Error checking GPS capabilities:', error);
    return {
      hasLocationServices: false,
      hasGPS: false,
      hasNetworkLocation: false,
      hasPassiveLocation: false,
    };
  }
}