export type FuelRecord = {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  amount_euros: number;
  current_km: number;
  liters?: number;
  location?: string;
  notes?: string;
  created_by: string;
  is_manual_entry: boolean;
  created_at: string;
  updated_at?: string;
  
  vehicle?: {
    license_plate: string;
    brand: string;
    model?: string;
    type?: string;
  };
};

export type Vehicle = {
  id: string;
  license_plate: string;
  brand: string;
  model?: string;
  year?: number;
  type?: string;
  status: string;
  fuel_type: string;
  driver_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
};

export type FuelPrice = {
  id: string;
  fuel_type: string;
  price_per_liter: number;
  updated_at: string;
  updated_by?: string;
};

export type FuelFormData = {
  vehicle_id: string;
  amount_euros: number;
  current_km: number;
};

export type FuelStats = {
  total_spent_euros: number;
  total_liters: number;
  total_distance_km: number;
  record_count: number;
  avg_consumption_per_100km: number;
  last_km_reading: number;
};

export type DriverInfo = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'van-driver' | 'scooter-driver' | 'truck-driver';
  is_active: boolean;
  last_login?: string;
};