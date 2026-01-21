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
}

export interface Runsheet {
    id: string;
    staff_id: string;
    staff_name: string;
    date_from: string;
    date_to: string;
    csv_data: RunsheetBooking[];
    report_type: 'delivery' | 'processed' | 'end_of_day' | 'sub_contractor';
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
    created_at: string;
    updated_at: string;
    runsheet: Runsheet;
}