import { GeofenceConfig, GeofenceLocation } from './types';
import { saveGeofence, loadGeofence } from './storage';
import { DEFAULT_CONFIG } from '../../constants/defaultConfig';

const API_BASE_URL = 'https://fleet-staging.milesxp.com/api/driver-config';

let cachedGeofence: GeofenceConfig | null = null;

export const fetchGeofenceConfig = async (): Promise<GeofenceConfig> => {
    try {
        const response = await fetch(`${API_BASE_URL}/geofence`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: GeofenceConfig = await response.json();
        await saveGeofence(data);
        cachedGeofence = data;
        return data;
    } catch (error) {
        console.error('Error fetching geofence config:', error);
        throw error;
    }
};

export const getGeofenceConfig = async (): Promise<GeofenceConfig> => {
    if (cachedGeofence) {
        return cachedGeofence;
    }
    const stored = await loadGeofence();
    if (stored) {
        cachedGeofence = stored;
        return stored;
    }
    return DEFAULT_CONFIG.geofence;
};

export const getGeofenceLocations = async (): Promise<GeofenceLocation[]> => {
    const config = await getGeofenceConfig();
    return config.locations;
};

export const getGeofenceForStatus = async (statusId: number): Promise<GeofenceLocation | null> => {
    const locations = await getGeofenceLocations();
    return locations.find((loc) => loc.applies_to_statuses.includes(statusId)) || null;
};

export const getWarehouseLocation = async (): Promise<GeofenceLocation | null> => {
    const locations = await getGeofenceLocations();
    return locations.find((loc) => loc.type === 'warehouse') || null;
};

export const getWarehouseCoordinates = async (): Promise<{
    latitude: number;
    longitude: number;
    radiusMeters: number;
    name: string;
} | null> => {
    const warehouse = await getWarehouseLocation();
    if (!warehouse) {
        return null;
    }
    return {
        latitude: warehouse.latitude,
        longitude: warehouse.longitude,
        radiusMeters: warehouse.radius_meters,
        name: warehouse.name,
    };
};

export const clearGeofenceCache = (): void => {
    cachedGeofence = null;
};