export interface DamageLog {
  id: string;
  driver_id: string;
  vehicle_id: string;
  image_url: string | null;
  remarks: string;
  is_viewed: boolean;
  viewed_by: string | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    license_plate: string;
    brand: string;
    model: string;
    type: string;
  };
}

export interface CreateDamageLogData {
  driver_id: string;
  vehicle_id: string;
  image_uri: string;
  remarks: string;
}