export interface StatusRule {
    status_id: number;
    name: string;
    call_required: boolean;
    photo_required: boolean;
    reason_required: boolean;
    two_step: boolean;
    customer_confirmation: boolean;
    max_photos: number;
    photo_description: string;
}

export interface StatusPermissions {
    permissions: Record<string, number[]>;
    warehouse_scan_statuses: number[];
    delivered_status_id: number;
    version: string;
    updated_at: string;
}

export interface GeofenceLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    type: 'warehouse' | 'depot' | 'hub';
    is_active: boolean;
    applies_to_statuses: number[];
}

export interface GeofenceConfig {
    locations: GeofenceLocation[];
    version: string;
    updated_at: string;
}

export interface ValidationRule {
    status_id: number;
    rule_type: 'requires_previous' | 'blocks_if_exists' | 'daily_limit' | 'sequence';
    condition_status_id?: number;
    max_count?: number;
    error_message: string;
    warning_message?: string;
    suggested_status_id?: number;
}

export interface StatusValidations {
    rules: ValidationRule[];
    left_message_statuses: number[];
    version: string;
    updated_at: string;
}

export interface StatusUIContent {
    status_id: number;
    instructions: string[];
    reason_placeholder: string;
    reason_examples: string[];
    icon_name: string;
    icon_color: string;
}

export interface GeneralLabels {
    call_confirmation_title: string;
    call_confirmation_message: string;
    call_confirmation_question: string;
    call_confirmation_yes: string;
    call_confirmation_no: string;
    photo_required_title: string;
    reason_mandatory_text: string;
    cod_reminder: string;
    monitoring_note: string;
}

export interface UIContentConfig {
    status_content: StatusUIContent[];
    labels: GeneralLabels;
    version: string;
    updated_at: string;
}

export interface ConfigVersion {
    global_version: string;
    versions: {
        status_rules: string;
        status_permissions: string;
        geofence: string;
        status_validations: string;
        ui_content: string;
    };
    last_updated: string;
    needs_update: boolean;
    client_version: string | null;
}

export interface RemoteConfigState {
    statusRules: Record<number, StatusRule>;
    statusPermissions: StatusPermissions;
    geofence: GeofenceConfig;
    validations: StatusValidations;
    uiContent: UIContentConfig;
    version: string;
    lastFetched: string | null;
    isLoaded: boolean;
}