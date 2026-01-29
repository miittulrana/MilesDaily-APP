export type DriverType = 'freight' | 'pd' | 'subcontractor';

export const PD_SUBCONTRACTOR_STATUSES = [
    10,
    16,
    17,
    22,
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

export const STATUS_NAMES: Record<number, string> = {
    10: 'DELIVERED',
    16: 'CORRECT CONTACT DETAILS REQUIRED',
    17: 'LEFT MESSAGE NOTE AT DOOR',
    22: 'ON HOLD FOR PICK UP BY CONSIGNEE',
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