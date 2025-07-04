export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  altitude_meters?: number;
  speed_kmh?: number;
  heading_degrees?: number;
  recorded_at: string;
  location_source: string;
}

export interface TrackingStatus {
  isTracking: boolean;
  lastUpdate?: string;
  error?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}