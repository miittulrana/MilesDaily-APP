export interface OptimizedStopData {
    stop_number: number;
    miles_ref: string;
    hawb: string;
    consignee_company: string;
    consignee_name: string;
    consignee_address: string;
    cleaned_address: string;
    consignee_city: string;
    consignee_postcode: string;
    consignee_mobile: string;
    service_type: string;
    total_pieces: string;
    total_weight: string;
    lat: number;
    lng: number;
    geocode_confidence: string;
    eta: string;
    distance_from_prev_km: number;
    duration_from_prev_min: number;
    cluster_id?: number;
}

export interface FailedStopData {
    miles_ref: string;
    hawb: string;
    consignee_company: string;
    consignee_name: string;
    consignee_address: string;
    cleaned_address: string;
    consignee_city: string;
    consignee_postcode: string;
    consignee_mobile: string;
    lat: number;
    lng: number;
    geocode_confidence: string;
}

export interface RouteOptimizationData {
    id: string;
    runsheet_id: string;
    optimized_stops: OptimizedStopData[];
    failed_stops: FailedStopData[];
    total_distance_km: number;
    total_duration_minutes: number;
    cluster_count: number;
    departure_time: string;
    status: 'processing' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
}

export interface RunsheetBooking {
    miles_ref: string;
    hawb: string;
    customer_id?: number;
    consignee_company: string;
    consignee_name: string;
    consignee_address: string;
    consignee_city: string;
    consignee_postcode: string;
    consignee_mobile: string;
    service_type: string;
    driver_name: string;
    total_pieces: string;
    total_weight: string;
    status_name?: string;
    booking_id?: number;
    is_pickup?: boolean;
}

export interface Runsheet {
    id: string;
    staff_id: string;
    staff_name: string;
    date_from: string;
    date_to: string;
    csv_data: RunsheetBooking[];
    report_type: 'delivery' | 'processed' | 'end_of_day' | 'sub_contractor' | 'digital_delivery';
    report_subtype?: 'morning' | 'afternoon' | null;
    created_at: string;
    updated_at: string;
}

export interface AssignedRunsheet {
    id: string;
    runsheet_id: string;
    driver_id: string;
    assigned_at: string;
    assigned_by: string;
    status: 'pending' | 'viewed' | 'acknowledged';
    is_optimized: boolean;
    optimization_id?: string | null;
    created_at: string;
    updated_at: string;
    runsheet: Runsheet;
}

export interface BookingStatus {
    booking_id: number;
    status_id: number;
    status_name: string;
    staff_id: string;
    staff_name: string;
    delivered_date: string;
    delivered_time: string;
}

export interface BookingStatusMap {
    [booking_id: string]: BookingStatus;
}