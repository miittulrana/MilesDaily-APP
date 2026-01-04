export interface Booking {
  booking_id: number;
  miles_ref: string;
  hawb: string;
  status: BookingStatus;
  shipper_address: BookingAddress;
  consignee_address: BookingAddress;
  customer: Customer;
}

export interface BookingStatus {
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
}

export interface ScannedBooking {
  booking_id: number;
  miles_ref: string;
  hawb: string;
  scanned_at: string;
}