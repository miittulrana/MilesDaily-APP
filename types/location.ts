import { LocationObject } from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: number;
}

export interface TrackingState {
  isTracking: boolean;
  currentLocation: LocationObject | null;
  lastUpdateTime: string | null;
  error: string | null;
}

export interface LocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  battery: number | null;
  timestamp: string;
}