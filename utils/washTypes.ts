export interface WashSchedule {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  scheduled_date: string;
  status: 'pending' | 'completed';
  completed_at: string | null;
  completed_by_type: 'driver' | 'admin' | null;
  completed_by_user_id: string | null;
  image_url: string | null;
  admin_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
    type: string;
    driver?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
    } | null;
  };
  completed_by_user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface WashCompletionData {
  schedule_id: string;
  image: string;
  notes?: string;
}

export interface DriverWashSchedule {
  id: string;
  vehicle_id: string;
  scheduled_date: string;
  status: 'pending' | 'completed';
  completed_at: string | null;
  completed_by_type: 'driver' | 'admin' | null;
  image_url: string | null;
  admin_reason: string | null;
  notes: string | null;
  vehicle: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
    type: string;
  };
  was_completed_early?: boolean;
}

export interface WashNotification {
  id: string;
  title: string;
  body: string;
  data: {
    type: 'wash_reminder';
    schedule_id: string;
    vehicle_id: string;
    scheduled_date: string;
  };
}

export interface OfflineWashCompletion {
  id: string;
  schedule_id: string;
  image_uri: string;
  notes?: string;
  completed_at: string;
  synced: boolean;
}