export interface BreakdownReport {
  id: string;
  driver_id: string;
  vehicle_id: string;
  location_address: string;
  location_latitude?: number;
  location_longitude?: number;
  notes?: string;
  status: 'pending' | 'assistance_called' | 'resolved' | 'cancelled';
  phone_number_called?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  vehicle?: {
    license_plate: string;
    brand: string;
    model: string;
    type: string;
  };
  photos?: BreakdownPhoto[];
}

export interface BreakdownPhoto {
  id: string;
  breakdown_report_id: string;
  photo_url: string;
  photo_name?: string;
  photo_order: number;
  uploaded_by: string;
  uploaded_at?: string;
}

export interface CreateBreakdownData {
  driver_id: string;
  vehicle_id: string;
  location_address: string;
  location_latitude?: number;
  location_longitude?: number;
  notes?: string;
  image_uri?: string;
}

export interface AssistanceNumber {
  id: string;
  phone_number: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}