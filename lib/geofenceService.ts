import * as Location from 'expo-location';
import { calculateDistance, GPSCoordinates } from '../utils/gpsUtils';
import { getWarehouseCoordinates, isWarehouseScanStatus, getGeofenceForStatus } from './remoteConfig';

export interface GeofenceCheckResult {
    allowed: boolean;
    distance?: number;
    error?: string;
}

export const requestLocationPermission = async (): Promise<boolean> => {
    console.log('[Geofence] ========== REQUEST LOCATION PERMISSION ==========');
    try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        console.log('[Geofence] Permission status:', foregroundStatus);
        return foregroundStatus === 'granted';
    } catch (error) {
        console.error('[Geofence] ERROR requesting location permission:', error);
        return false;
    }
};

export const getCurrentLocation = async (): Promise<GPSCoordinates | null> => {
    console.log('[Geofence] ========== GET CURRENT LOCATION ==========');
    try {
        const hasPermission = await requestLocationPermission();
        console.log('[Geofence] Has permission:', hasPermission);

        if (!hasPermission) {
            console.error('[Geofence] Location permission NOT granted');
            return null;
        }

        console.log('[Geofence] Getting current position with HIGH accuracy...');
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        console.log('[Geofence] Raw location result:', JSON.stringify(location, null, 2));

        const result = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
        };

        console.log('[Geofence] Parsed location:', result);
        return result;
    } catch (error) {
        console.error('[Geofence] ERROR getting current location:', error);
        return null;
    }
};

export const checkWarehouseLocation = async (statusId: number): Promise<GeofenceCheckResult> => {
    console.log('[Geofence] ==========================================');
    console.log('[Geofence] ========== CHECK WAREHOUSE LOCATION ==========');
    console.log('[Geofence] ==========================================');
    console.log('[Geofence] Input statusId:', statusId);
    console.log('[Geofence] Input statusId type:', typeof statusId);

    try {
        console.log('[Geofence] Step 1: Calling isWarehouseScanStatus...');
        const isWarehouse = await isWarehouseScanStatus(statusId);
        console.log('[Geofence] isWarehouseScanStatus result:', isWarehouse);
        console.log('[Geofence] isWarehouseScanStatus result type:', typeof isWarehouse);

        if (!isWarehouse) {
            console.log('[Geofence] NOT a warehouse status, returning allowed: true');
            return { allowed: true };
        }

        console.log('[Geofence] Step 2: IS a warehouse status, getting current location...');
        const currentLocation = await getCurrentLocation();
        console.log('[Geofence] currentLocation result:', currentLocation);

        if (!currentLocation) {
            console.log('[Geofence] currentLocation is NULL, returning error');
            return {
                allowed: false,
                error: 'Unable to get your current location. Please enable location services and try again.',
            };
        }

        console.log('[Geofence] Step 3: Getting warehouse coordinates from remote config...');
        const warehouseConfig = await getWarehouseCoordinates();
        console.log('[Geofence] warehouseConfig result:', warehouseConfig);
        console.log('[Geofence] warehouseConfig type:', typeof warehouseConfig);

        if (!warehouseConfig) {
            console.log('[Geofence] warehouseConfig is NULL, returning error');
            return {
                allowed: false,
                error: 'Warehouse location configuration not found. Please contact support.',
            };
        }

        console.log('[Geofence] Step 4: Calculating distance...');
        console.log('[Geofence] User location:', currentLocation.latitude, currentLocation.longitude);
        console.log('[Geofence] Warehouse location:', warehouseConfig.latitude, warehouseConfig.longitude);
        console.log('[Geofence] Warehouse radius (meters):', warehouseConfig.radiusMeters);

        const warehouseLocation: GPSCoordinates = {
            latitude: warehouseConfig.latitude,
            longitude: warehouseConfig.longitude,
        };

        const distanceKm = calculateDistance(currentLocation, warehouseLocation);
        const distanceMeters = distanceKm * 1000;

        console.log('[Geofence] Distance (km):', distanceKm);
        console.log('[Geofence] Distance (meters):', distanceMeters);

        const isWithinRadius = distanceMeters <= warehouseConfig.radiusMeters;
        console.log('[Geofence] Is within radius:', isWithinRadius);

        const result = {
            allowed: isWithinRadius,
            distance: Math.round(distanceMeters),
            error: isWithinRadius
                ? undefined
                : 'You are not in the warehouse at the moment, kindly scan in the warehouse, it will work',
        };

        console.log('[Geofence] FINAL RESULT:', result);
        console.log('[Geofence] ==========================================');

        return result;
    } catch (error) {
        console.error('[Geofence] EXCEPTION in checkWarehouseLocation:', error);
        console.error('[Geofence] Error message:', error instanceof Error ? error.message : 'Unknown');
        console.error('[Geofence] Error stack:', error instanceof Error ? error.stack : 'No stack');
        return {
            allowed: false,
            error: 'Unable to verify your location. Error: ' + (error instanceof Error ? error.message : 'Unknown'),
        };
    }
};

export const checkGeofenceForStatus = async (statusId: number): Promise<GeofenceCheckResult> => {
    console.log('[Geofence] ========== CHECK GEOFENCE FOR STATUS ==========');
    console.log('[Geofence] statusId:', statusId);

    const geofence = await getGeofenceForStatus(statusId);
    console.log('[Geofence] geofence config:', geofence);

    if (!geofence) {
        console.log('[Geofence] No geofence for this status, returning allowed: true');
        return { allowed: true };
    }

    const currentLocation = await getCurrentLocation();
    console.log('[Geofence] currentLocation:', currentLocation);

    if (!currentLocation) {
        return {
            allowed: false,
            error: 'Unable to get your current location. Please enable location services and try again.',
        };
    }

    const targetLocation: GPSCoordinates = {
        latitude: geofence.latitude,
        longitude: geofence.longitude,
    };

    const distanceKm = calculateDistance(currentLocation, targetLocation);
    const distanceMeters = distanceKm * 1000;

    console.log('[Geofence] Distance to geofence (meters):', distanceMeters);
    console.log('[Geofence] Required radius (meters):', geofence.radius_meters);

    const isWithinRadius = distanceMeters <= geofence.radius_meters;
    console.log('[Geofence] Is within radius:', isWithinRadius);

    return {
        allowed: isWithinRadius,
        distance: Math.round(distanceMeters),
        error: isWithinRadius
            ? undefined
            : `You are not within the required area (${geofence.name}). Please move closer and try again.`,
    };
};

export const getDistanceToWarehouse = async (): Promise<number | null> => {
    console.log('[Geofence] ========== GET DISTANCE TO WAREHOUSE ==========');

    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
        console.log('[Geofence] No current location');
        return null;
    }

    const warehouseConfig = await getWarehouseCoordinates();
    if (!warehouseConfig) {
        console.log('[Geofence] No warehouse config');
        return null;
    }

    const warehouseLocation: GPSCoordinates = {
        latitude: warehouseConfig.latitude,
        longitude: warehouseConfig.longitude,
    };

    const distanceKm = calculateDistance(currentLocation, warehouseLocation);
    const distanceMeters = Math.round(distanceKm * 1000);

    console.log('[Geofence] Distance to warehouse (meters):', distanceMeters);
    return distanceMeters;
};

export const getDistanceToGeofence = async (statusId: number): Promise<number | null> => {
    console.log('[Geofence] ========== GET DISTANCE TO GEOFENCE ==========');

    const geofence = await getGeofenceForStatus(statusId);
    if (!geofence) {
        console.log('[Geofence] No geofence for status:', statusId);
        return null;
    }

    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
        console.log('[Geofence] No current location');
        return null;
    }

    const targetLocation: GPSCoordinates = {
        latitude: geofence.latitude,
        longitude: geofence.longitude,
    };

    const distanceKm = calculateDistance(currentLocation, targetLocation);
    const distanceMeters = Math.round(distanceKm * 1000);

    console.log('[Geofence] Distance to geofence (meters):', distanceMeters);
    return distanceMeters;
};