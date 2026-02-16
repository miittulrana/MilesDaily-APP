import {
    getStatusesForDriverTypes as getRemoteStatusesForDriverTypes,
    isStatusAllowedForDriver as isRemoteStatusAllowed,
    isWarehouseScanStatus as isRemoteWarehouseScanStatus,
    getDeliveredStatusId as getRemoteDeliveredStatusId,
    getStatusPermissions,
    getStatusRequirements as getRemoteStatusRequirements,
} from './remoteConfig';

export type DriverType = 'freight' | 'pd' | 'subcontractor';

export const WAREHOUSE_LOCATION = {
    name: 'Miles Express Warehouse',
    latitude: 35.8751997,
    longitude: 14.4945183,
    radiusMeters: 500,
};

export let DELIVERED_STATUS_ID = 10;

export const initializeStatusPermissions = async (): Promise<void> => {
    const deliveredId = await getRemoteDeliveredStatusId();
    DELIVERED_STATUS_ID = deliveredId;
};

export const getStatusesForDriverTypes = async (driverTypes: DriverType[]): Promise<number[]> => {
    return getRemoteStatusesForDriverTypes(driverTypes);
};

export const isStatusAllowedForDriver = async (
    statusId: number,
    driverTypes: DriverType[]
): Promise<boolean> => {
    return isRemoteStatusAllowed(statusId, driverTypes);
};

export const isWarehouseScanStatus = async (statusId: number): Promise<boolean> => {
    return isRemoteWarehouseScanStatus(statusId);
};

export const isCallRequired = async (statusId: number): Promise<boolean> => {
    const requirements = await getRemoteStatusRequirements(statusId);
    return requirements.callRequired;
};

export const isPhotoRequired = async (statusId: number): Promise<boolean> => {
    const requirements = await getRemoteStatusRequirements(statusId);
    return requirements.photoRequired;
};

export const isReasonRequired = async (statusId: number): Promise<boolean> => {
    const requirements = await getRemoteStatusRequirements(statusId);
    return requirements.reasonRequired;
};

export const isTwoStepStatus = async (statusId: number): Promise<boolean> => {
    const requirements = await getRemoteStatusRequirements(statusId);
    return requirements.twoStep;
};

export const isCustomerConfirmationRequired = async (statusId: number): Promise<boolean> => {
    const requirements = await getRemoteStatusRequirements(statusId);
    return requirements.customerConfirmation;
};

export const getStatusRequirements = async (
    statusId: number
): Promise<{
    callRequired: boolean;
    photoRequired: boolean;
    reasonRequired: boolean;
    twoStep: boolean;
    customerConfirmation: boolean;
}> => {
    return getRemoteStatusRequirements(statusId);
};

export const getStatusesForDriverTypesSync = (driverTypes: DriverType[]): number[] => {
    const PD_SUBCONTRACTOR_STATUSES = [10, 16, 17, 22, 23, 28, 31, 34, 37, 38, 47, 52, 59, 63, 64];
    const FREIGHT_STATUSES = [10, 16, 17, 22, 23, 28, 30, 31, 34, 37, 38, 47, 52, 59, 63, 64];

    if (!driverTypes || driverTypes.length === 0) {
        return [];
    }

    const allowedStatuses = new Set<number>();

    for (const type of driverTypes) {
        if (type === 'freight') {
            FREIGHT_STATUSES.forEach((id) => allowedStatuses.add(id));
        } else if (type === 'pd' || type === 'subcontractor') {
            PD_SUBCONTRACTOR_STATUSES.forEach((id) => allowedStatuses.add(id));
        }
    }

    return Array.from(allowedStatuses).sort((a, b) => a - b);
};

export const isCallRequiredSync = (statusId: number): boolean => {
    const CALL_REQUIRED_STATUSES = [17, 52, 22];
    return CALL_REQUIRED_STATUSES.includes(statusId);
};

export const isPhotoRequiredSync = (statusId: number): boolean => {
    const PHOTO_REQUIRED_STATUSES = [17, 52, 59, 16];
    return PHOTO_REQUIRED_STATUSES.includes(statusId);
};

export const isReasonRequiredSync = (statusId: number): boolean => {
    const REASON_REQUIRED_STATUSES = [31, 23, 38];
    return REASON_REQUIRED_STATUSES.includes(statusId);
};

export const isTwoStepStatusSync = (statusId: number): boolean => {
    const TWO_STEP_STATUSES = [47];
    return TWO_STEP_STATUSES.includes(statusId);
};

export const isWarehouseScanStatusSync = (statusId: number): boolean => {
    return statusId === 37;
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
    64: 'BUSINESS CLOSED',
};

export const COD_CASH_COLLECTED_STATUS_ID = 47;
export const LEFT_MESSAGE_NOTE_1_STATUS_ID = 17;
export const LEFT_MESSAGE_NOTE_2_STATUS_ID = 52;
export const WRONG_CASE_PACKAGING_STATUS_ID = 59;
export const CORRECT_CONTACT_DETAILS_STATUS_ID = 16;
export const RESCHEDULED_DELIVERY_STATUS_ID = 31;
export const ON_HOLD_FOR_PICKUP_STATUS_ID = 22;
export const PARTIAL_DELIVERY_STATUS_ID = 23;
export const SHIPMENT_REFUSED_STATUS_ID = 38;
export const PICKED_UP_STATUS_ID = 28;
export const WAREHOUSE_SCAN_STATUS_ID = 37;