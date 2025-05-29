export type TempAssignmentStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface TempAssignment {
  id: string;
  vehicle_id: string;
  permanent_driver_id: string;
  temp_driver_id: string;
  assigned_by: string;
  assignment_reason: string;
  start_datetime: string;
  end_datetime: string;
  original_end_datetime: string;
  status: TempAssignmentStatus;
  completion_type?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  completion_source?: string | null;
  completion_notes?: string | null;
  extension_count: number;
  last_extended_at?: string | null;
  last_extended_by?: string | null;
  contact_phone?: string | null;
  special_instructions?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  vehicle?: {
    license_plate: string;
    brand: string;
    model: string;
    type: string;
  };
  permanent_driver?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  temp_driver?: {
    first_name: string;
    last_name: string;
    email: string;
    work_phone?: string;
  };
}

export interface ExtensionRequest {
  assignment_id: string;
  new_end_datetime: string;
  reason: string;
  extended_by_driver: boolean;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}