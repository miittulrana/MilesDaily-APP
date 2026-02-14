export type DriverType = 'freight' | 'pd' | 'subcontractor';

export const PD_SUBCONTRACTOR_STATUSES = [
    10,
    16,
    17,
    22,
    23,
    28,
    31,
    34,
    37,
    38,
    47,
    52,
    59,
    63,
    64
];

export const FREIGHT_STATUSES = [
    10,
    16,
    17,
    22,
    23,
    28,
    30,
    31,
    34,
    37,
    38,
    47,
    52,
    59,
    63,
    64
];

export const WAREHOUSE_SCAN_STATUS_ID = 37;

export const WAREHOUSE_LOCATION = {
    name: 'Miles Express Warehouse',
    latitude: 35.8751997,
    longitude: 14.4945183,
    radiusMeters: 500
};

export const DELIVERED_STATUS_ID = 10;
export const LEFT_MESSAGE_NOTE_1_STATUS_ID = 17;
export const LEFT_MESSAGE_NOTE_2_STATUS_ID = 52;
export const COD_CASH_COLLECTED_STATUS_ID = 47;
export const WRONG_CASE_PACKAGING_STATUS_ID = 59;
export const CORRECT_CONTACT_DETAILS_STATUS_ID = 16;
export const RESCHEDULED_DELIVERY_STATUS_ID = 31;
export const ON_HOLD_FOR_PICKUP_STATUS_ID = 22;
export const PARTIAL_DELIVERY_STATUS_ID = 23;
export const SHIPMENT_REFUSED_STATUS_ID = 38;
export const PICKED_UP_STATUS_ID = 28;

export const CALL_REQUIRED_STATUSES = [
    LEFT_MESSAGE_NOTE_1_STATUS_ID,
    LEFT_MESSAGE_NOTE_2_STATUS_ID,
    ON_HOLD_FOR_PICKUP_STATUS_ID,
];

export const PHOTO_REQUIRED_STATUSES = [
    LEFT_MESSAGE_NOTE_1_STATUS_ID,
    LEFT_MESSAGE_NOTE_2_STATUS_ID,
    WRONG_CASE_PACKAGING_STATUS_ID,
    CORRECT_CONTACT_DETAILS_STATUS_ID,
];

export const REASON_REQUIRED_STATUSES = [
    RESCHEDULED_DELIVERY_STATUS_ID,
    PARTIAL_DELIVERY_STATUS_ID,
    SHIPMENT_REFUSED_STATUS_ID,
];

export const TWO_STEP_STATUSES = [
    COD_CASH_COLLECTED_STATUS_ID,
];

export const CUSTOMER_CONFIRMATION_STATUSES = [
    DELIVERED_STATUS_ID,
    PICKED_UP_STATUS_ID,
];

export const getStatusesForDriverTypes = (driverTypes: DriverType[]): number[] => {
    if (!driverTypes || driverTypes.length === 0) {
        return [];
    }

    const allowedStatuses = new Set<number>();

    for (const type of driverTypes) {
        if (type === 'freight') {
            FREIGHT_STATUSES.forEach(id => allowedStatuses.add(id));
        } else if (type === 'pd' || type === 'subcontractor') {
            PD_SUBCONTRACTOR_STATUSES.forEach(id => allowedStatuses.add(id));
        }
    }

    return Array.from(allowedStatuses).sort((a, b) => a - b);
};

export const isStatusAllowedForDriver = (statusId: number, driverTypes: DriverType[]): boolean => {
    const allowedStatuses = getStatusesForDriverTypes(driverTypes);
    return allowedStatuses.includes(statusId);
};

export const isWarehouseScanStatus = (statusId: number): boolean => {
    return statusId === WAREHOUSE_SCAN_STATUS_ID;
};

export const isCallRequired = (statusId: number): boolean => {
    return CALL_REQUIRED_STATUSES.includes(statusId);
};

export const isPhotoRequired = (statusId: number): boolean => {
    return PHOTO_REQUIRED_STATUSES.includes(statusId);
};

export const isReasonRequired = (statusId: number): boolean => {
    return REASON_REQUIRED_STATUSES.includes(statusId);
};

export const isTwoStepStatus = (statusId: number): boolean => {
    return TWO_STEP_STATUSES.includes(statusId);
};

export const isCustomerConfirmationRequired = (statusId: number): boolean => {
    return CUSTOMER_CONFIRMATION_STATUSES.includes(statusId);
};

export const getStatusRequirements = (statusId: number): {
    callRequired: boolean;
    photoRequired: boolean;
    reasonRequired: boolean;
    twoStep: boolean;
    customerConfirmation: boolean;
} => {
    return {
        callRequired: isCallRequired(statusId),
        photoRequired: isPhotoRequired(statusId),
        reasonRequired: isReasonRequired(statusId),
        twoStep: isTwoStepStatus(statusId),
        customerConfirmation: isCustomerConfirmationRequired(statusId),
    };
};

export const STATUS_NAMES: Record<number, string> = {
    10: 'DELIVERED',
    16: 'CORRECT CONTACT DETAILS REQUIRED',
    17: 'LEFT MESSAGE NOTE AT DOOR',
    22: 'ON HOLD FOR PICK UP BY CONSIGNEE',
    23: 'PARTIAL DELIVERY',
    28: 'PICKED UP',
    30: 'RECEIVED AT OPERATIONS FACILITY',
    31: 'RESCHEDULED FOR DELIVERY',
    34: 'SHIPMENT BEING RETURNED',
    37: 'WAREHOUSE SCAN',
    38: 'SHIPMENT REFUSED',
    47: 'COD/CASH COLLECTED',
    52: 'LEFT MESSAGE NOTE AT DOOR 2ND ATTEMPT',
    59: 'WRONG CASES / PACKAGING',
    63: 'CONSIGNEE MOVED',
    64: 'BUSINESS CLOSED'
};