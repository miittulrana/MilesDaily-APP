export interface ImportantPhoneNumber {
  id: string;
  name: string;
  phone_number: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}