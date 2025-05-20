// Supabase database types

export interface Driver {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  driver_id: string;
  lat: number;
  lng: number;
  speed: number | null;
  battery: number | null;
  updated_at: string;
}

export interface LocationLog {
  id: string;
  driver_id: string;
  lat: number;
  lng: number;
  speed: number | null;
  battery: number | null;
  timestamp: string;
}

export interface Database {
  public: {
    Tables: {
      drivers: {
        Row: Driver;
        Insert: Omit<Driver, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Driver, 'id'>>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, 'updated_at'>;
        Update: Partial<Location>;
      };
      location_logs: {
        Row: LocationLog;
        Insert: Omit<LocationLog, 'id'>;
        Update: never; // We don't update logs
      };
    };
  };
}