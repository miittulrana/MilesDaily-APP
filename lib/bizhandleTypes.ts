export interface Booking {
  booking_id: number;
  miles_ref: string;
  hawb: string;
  status: BookingStatus;
  shipper_address: BookingAddress;
  consignee_address: BookingAddress;
  customer: Customer;
  special_instruction?: string;
}

export interface BookingStatus {
  status_id: number;
  name: string;
  delivered_date_time?: string;
}

export interface BookingAddress {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface Customer {
  name?: string;
  email?: string;
}

export interface Status {
  status_id: number;
  name: string;
  parent: boolean;
  need_reason: boolean;
  need_customer_confirmation: boolean;
  childs: Status[];
}

export interface ClientInfo {
  client_name: string;
  id_card: string;
  signature: string;
}

export interface UpdateBookingParams {
  booking_id: number;
  status_id: number;
  delivered_date: string;
  delivered_time: string;
  client_name?: string;
  id_card?: string;
  signature?: string;
  reason?: string;
}

export interface ScannedBooking {
  booking_id: number;
  miles_ref: string;
  hawb: string;
  scanned_at: string;
}

export interface StatusRequirements {
  callRequired: boolean;
  photoRequired: boolean;
  reasonRequired: boolean;
  twoStep: boolean;
  customerConfirmation: boolean;
}

export interface StatusValidation {
  allowed: boolean;
  error?: string;
  warning?: string;
  suggestedStatusId?: number;
}

export interface CODInfo {
  hasCOD: boolean;
  amount: number | null;
  currency: string;
  rawText: string | null;
}

export interface StatusNote {
  id?: string;
  booking_id: number;
  miles_ref: string;
  status_id: number;
  reason: string;
  pieces_missing?: number;
  captured_by: string;
  created_at?: string;
}

export interface CODRecord {
  id?: string;
  booking_id: number;
  miles_ref: string;
  expected_amount?: number;
  collected_amount: number;
  currency: string;
  payment_type: 'cash' | 'online';
  photo_url?: string;
  captured_by: string;
  collected_at?: string;
  created_at?: string;
}