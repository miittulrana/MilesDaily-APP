import { StatusPermissions } from './types';
import { saveStatusPermissions, loadStatusPermissions } from './storage';
import { DEFAULT_CONFIG } from '../../constants/defaultConfig';

const API_BASE_URL = 'https://fleet.milesxp.com/api/driver-config';

let cachedPermissions: StatusPermissions | null = null;

export const fetchStatusPermissions = async (): Promise<StatusPermissions> => {
    try {
        const response = await fetch(`${API_BASE_URL}/status-permissions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: StatusPermissions = await response.json();

        await saveStatusPermissions(data);
        cachedPermissions = data;

        return data;
    } catch (error) {
        console.error('Error fetching status permissions:', error);
        throw error;
    }
};

export const getStatusPermissions = async (): Promise<StatusPermissions> => {
    if (cachedPermissions) {
        return cachedPermissions;
    }

    const stored = await loadStatusPermissions();
    if (stored) {
        cachedPermissions = stored;
        return stored;
    }

    return DEFAULT_CONFIG.statusPermissions;
};

export const getStatusesForDriverType = async (driverType: string): Promise<number[]> => {
    const permissions = await getStatusPermissions();
    const type = driverType.toLowerCase();
    return permissions.permissions[type] || [];
};

export const getStatusesForDriverTypes = async (driverTypes: string[]): Promise<number[]> => {
    const permissions = await getStatusPermissions();
    const allowedStatuses = new Set<number>();

    for (const type of driverTypes) {
        const typePermissions = permissions.permissions[type.toLowerCase()];
        if (typePermissions) {
            typePermissions.forEach((id) => allowedStatuses.add(id));
        }
    }

    return Array.from(allowedStatuses).sort((a, b) => a - b);
};

export const isStatusAllowedForDriver = async (
    statusId: number,
    driverTypes: string[]
): Promise<boolean> => {
    const allowedStatuses = await getStatusesForDriverTypes(driverTypes);
    return allowedStatuses.includes(statusId);
};

export const isWarehouseScanStatus = async (statusId: number): Promise<boolean> => {
    const permissions = await getStatusPermissions();
    return permissions.warehouse_scan_statuses.includes(statusId);
};

export const getDeliveredStatusId = async (): Promise<number> => {
    const permissions = await getStatusPermissions();
    return permissions.delivered_status_id;
};

export const clearPermissionsCache = (): void => {
    cachedPermissions = null;
};