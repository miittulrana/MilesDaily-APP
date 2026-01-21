export interface OptimizedRoute {
  optimizedBookings: any[];
  totalDistance: number;
  totalDuration: number;
  waypoints: RouteWaypoint[];
}

export interface RouteWaypoint {
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  bookingIndex: number;
}

export interface GeocodedAddress {
  address: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  success: boolean;
}

export interface RouteOptimizationRequest {
  origin: {
    lat: number;
    lng: number;
  };
  destinations: Array<{
    address: string;
    bookingIndex: number;
  }>;
}

export interface RouteOptimizationResponse {
  success: boolean;
  optimizedOrder: number[];
  error?: string;
}