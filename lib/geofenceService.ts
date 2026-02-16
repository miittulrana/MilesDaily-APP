import * as Location from 'expo-location';
import { calculateDistance, GPSCoordinates } from '../utils/gpsUtils';
import { getWarehouseCoordinates, isWarehouseScanStatus, getGeofenceForStatus } from './remoteConfig';

export interface GeofenceCheckResult {
    allowed: boolean;
    distance?: number;
    error?: string;
}

export const requestLocationPermission = async (): Promise<boolean> => {
    try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        return foregroundStatus === 'granted';
    } catch (error) {
        console.error('Error requesting location permission:', error);
        return false;
    }
};

export const getCurrentLocation = async (): Promise<GPSCoordinates | null> => {
    try {
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
            console.error('Location permission not granted');
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
};

export const checkWarehouseLocation = async (statusId: number): Promise<GeofenceCheckResult> => {
    const isWarehouse = await isWarehouseScanStatus(statusId);
    if (!isWarehouse) {
        return { allowed: true };
    }

    const currentLocation = await getCurrentLocation();

    if (!currentLocation) {
        return {
            allowed: false,
            error:
                'Unable to get your current location. Please enable location services and try again.',
        };
    }

    const warehouseConfig = await getWarehouseCoordinates();

    if (!warehouseConfig) {
        return {
            allowed: false,
            error: 'Warehouse location configuration not found. Please contact support.',
        };
    }

    const warehouseLocation: GPSCoordinates = {
        latitude: warehouseConfig.latitude,
        longitude: warehouseConfig.longitude,
    };

    const distanceKm = calculateDistance(currentLocation, warehouseLocation);
    const distanceMeters = distanceKm * 1000;

    const isWithinRadius = distanceMeters <= warehouseConfig.radiusMeters;

    return {
        allowed: isWithinRadius,
        distance: Math.round(distanceMeters),
        error: isWithinRadius
            ? undefined
            : 'You are not in the warehouse at the moment, kindly scan in the warehouse, it will work',
    };
};

export const checkGeofenceForStatus = async (statusId: number): Promise<GeofenceCheckResult> => {
    const geofence = await getGeofenceForStatus(statusId);

    if (!geofence) {
        return { allowed: true };
    }

    const currentLocation = await getCurrentLocation();

    if (!currentLocation) {
        return {
            allowed: false,
            error:
                'Unable to get your current location. Please enable location services and try again.',
        };
    }

    const targetLocation: GPSCoordinates = {
        latitude: geofence.latitude,
        longitude: geofence.longitude,
    };

    const distanceKm = calculateDistance(currentLocation, targetLocation);
    const distanceMeters = distanceKm * 1000;

    const isWithinRadius = distanceMeters <= geofence.radius_meters;

    return {
        allowed: isWithinRadius,
        distance: Math.round(distanceMeters),
        error: isWithinRadius
            ? undefined
            : `You are not within the required area (${geofence.name}). Please move closer and try again.`,
    };
};

export const getDistanceToWarehouse = async (): Promise<number | null> => {
    const currentLocation = await getCurrentLocation();

    if (!currentLocation) {
        return null;
    }

    const warehouseConfig = await getWarehouseCoordinates();

    if (!warehouseConfig) {
        return null;
    }

    const warehouseLocation: GPSCoordinates = {
        latitude: warehouseConfig.latitude,
        longitude: warehouseConfig.longitude,
    };

    const distanceKm = calculateDistance(currentLocation, warehouseLocation);
    return Math.round(distanceKm * 1000);
};

export const getDistanceToGeofence = async (statusId: number): Promise<number | null> => {
    const geofence = await getGeofenceForStatus(statusId);

    if (!geofence) {
        return null;
    }

    const currentLocation = await getCurrentLocation();

    if (!currentLocation) {
        return null;
    }

    const targetLocation: GPSCoordinates = {
        latitude: geofence.latitude,
        longitude: geofence.longitude,
    };

    const distanceKm = calculateDistance(currentLocation, targetLocation);
    return Math.round(distanceKm * 1000);
};