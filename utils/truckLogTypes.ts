export interface TruckLogAssignment {
  id: string;
  vehicle_id: string;
  driver_id: string;
  assigned_by: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
    type: string;
  };
}

export interface TruckLogSession {
  id: string;
  assignment_id: string;
  driver_id: string;
  vehicle_id: string;
  punch_in_at: string;
  punch_out_at: string | null;
  punch_in_location: LocationData | null;
  punch_out_location: LocationData | null;
  session_duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
    type: string;
  };
}

export interface AssignedVehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  type: string;
  is_available: boolean;
  current_session?: ActiveSession;
}

export interface ActiveSession {
  session_id: string;
  driver_id: string;
  driver_name: string;
  punch_in_at: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface PunchData {
  vehicle_id: string;
  action: 'punch_in' | 'punch_out';
  location?: LocationData;
}

export interface PunchResponse {
  success: boolean;
  action: 'punch_in' | 'punch_out';
  session: TruckLogSession;
  error?: string;
}

export interface SessionsResponse {
  sessions: TruckLogSession[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VehiclesResponse {
  vehicles: AssignedVehicle[];
}