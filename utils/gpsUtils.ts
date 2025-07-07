import * as Location from 'expo-location';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export const calculateDistance = (
  point1: GPSCoordinates,
  point2: GPSCoordinates
): number => {
  const R = 6371;
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const formatSpeed = (speed: number): string => {
  if (speed < 1) return 'Stationary';
  return `${Math.round(speed * 3.6)} km/h`;
};

export const formatAccuracy = (accuracy: number): string => {
  if (accuracy < 5) return 'Excellent';
  if (accuracy < 20) return 'Good';
  if (accuracy < 50) return 'Fair';
  return 'Poor';
};

export const isValidCoordinate = (coordinate: GPSCoordinates): boolean => {
  return (
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
};

export const formatCoordinates = (coordinates: GPSCoordinates): string => {
  return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
};

export const getLocationAccuracy = (): Location.LocationAccuracy => {
  return Location.Accuracy.High;
};

export const getOptimalTimeInterval = (isBackground: boolean): number => {
  return isBackground ? 6000 : 5000;
};

export const shouldUpdateLocation = (
  lastLocation: GPSCoordinates,
  newLocation: GPSCoordinates,
  minimumDistance: number = 0
): boolean => {
  if (minimumDistance === 0) return true;
  
  const distance = calculateDistance(lastLocation, newLocation);
  return distance >= minimumDistance;
};

export const validateLocationPermissions = async (): Promise<{
  foreground: boolean;
  background: boolean;
}> => {
  const foregroundPermission = await Location.getForegroundPermissionsAsync();
  const backgroundPermission = await Location.getBackgroundPermissionsAsync();

  return {
    foreground: foregroundPermission.status === 'granted',
    background: backgroundPermission.status === 'granted',
  };
};

export const isLocationServicesEnabled = async (): Promise<boolean> => {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

export const createLocationUpdateOptions = (isBackground: boolean): Location.LocationOptions => {
  return {
    accuracy: getLocationAccuracy(),
    timeInterval: getOptimalTimeInterval(isBackground),
    distanceInterval: 0,
    mayShowUserSettingsDialog: false,
  };
};

export const createBackgroundTaskOptions = (): Location.LocationTaskOptions => {
  return {
    accuracy: Location.Accuracy.High,
    timeInterval: 6000,
    distanceInterval: 0,
    deferredUpdatesInterval: 6000,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'MXP Daily - GPS Route Optimization in progress',
      notificationBody: "Don't close the app",
      notificationColor: '#ff6b00',
      killServiceOnDestroy: false,
    },
  };
};