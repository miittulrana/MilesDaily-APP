export interface RepairType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MinorRepair {
  id: string;
  repair_type_id: string;
  vehicle_id: string;
  cost_euros: number;
  description: string | null;
  image_url: string | null;
  submitted_by_type: 'user' | 'driver';
  submitted_by_user_id: string | null;
  submitted_by_driver_id: string | null;
  created_at: string;
  updated_at: string;
  repair_type?: {
    id: string;
    name: string;
    description: string | null;
  };
  vehicle?: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
  };
  submitted_by_user?: {
    id: string;
    name: string | null;
    email: string;
  };
  submitted_by_driver?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface CreateMinorRepairData {
  repair_type_id: string;
  vehicle_id: string;
  cost_euros: number;
  description?: string;
  image_url?: string;
}