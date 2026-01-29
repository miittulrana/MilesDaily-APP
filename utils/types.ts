export type DriverRole = 'van-driver' | 'scooter-driver' | 'truck-driver';

export type DriverType = 'freight' | 'pd' | 'subcontractor';

export interface DriverInfo {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: DriverRole;
  driver_types?: DriverType[];
  is_active?: boolean;
  bizhandle_staff_id?: number | null;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  fuel_type?: string;
  make?: string;
  model?: string;
}

export interface FuelRecord {
  id: string;
  driver_id: string;
  vehicle_id: string;
  liters: number;
  cost: number;
  odometer?: number;
  fuel_type: string;
  station_name?: string;
  receipt_url?: string;
  created_at: string;
}

export interface Document {
  id: string;
  driver_id: string;
  document_type: string;
  expiry_date?: string;
  file_url?: string;
  status: 'valid' | 'expiring' | 'expired';
}

export interface TruckLogSession {
  id: string;
  driver_id: string;
  vehicle_id: string;
  start_time: string;
  end_time?: string;
  start_odometer?: number;
  end_odometer?: number;
  status: 'active' | 'completed';
}

export interface WashSchedule {
  id: string;
  vehicle_id: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'pending' | 'completed' | 'overdue';
}

export interface MinorRepair {
  id: string;
  driver_id: string;
  vehicle_id: string;
  description: string;
  status: 'reported' | 'in_progress' | 'completed';
  created_at: string;
}

export interface AccidentReport {
  id: string;
  driver_id: string;
  vehicle_id: string;
  accident_date: string;
  description: string;
  photos?: string[];
  status: 'draft' | 'submitted' | 'under_review' | 'resolved';
}

export interface DamageLog {
  id: string;
  driver_id: string;
  vehicle_id: string;
  damage_type: string;
  description: string;
  photos?: string[];
  created_at: string;
}

export interface Breakdown {
  id: string;
  driver_id: string;
  vehicle_id: string;
  location?: string;
  description: string;
  status: 'reported' | 'assistance_dispatched' | 'resolved';
  created_at: string;
}

export interface UniformRequest {
  id: string;
  driver_id: string;
  item_type: string;
  size: string;
  quantity: number;
  status: 'pending' | 'approved' | 'delivered';
  created_at: string;
}

export interface Runsheet {
  id: string;
  driver_id: string;
  date: string;
  stops: RunsheetStop[];
  status: 'active' | 'completed';
}

export interface RunsheetStop {
  id: string;
  address: string;
  customer_name?: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
}

export interface ImportantNumber {
  id: string;
  name: string;
  phone: string;
  category?: string;
}