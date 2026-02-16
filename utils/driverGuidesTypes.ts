export interface DriverGuide {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}