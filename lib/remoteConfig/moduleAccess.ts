import { ModuleAccessConfig } from './types';
import { saveModuleAccess, loadModuleAccess } from './storage';

const API_BASE_URL = 'https://fleet.milesxp.com/api/driver-config';

const DEFAULT_MODULE_ACCESS: ModuleAccessConfig = {
    access: {},
    version: '1.0.0',
    updated_at: new Date().toISOString(),
};

let cachedModuleAccess: ModuleAccessConfig | null = null;

export const fetchModuleAccess = async (): Promise<ModuleAccessConfig> => {
    try {
        const response = await fetch(`${API_BASE_URL}/module-access`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ModuleAccessConfig = await response.json();
        await saveModuleAccess(data);
        cachedModuleAccess = data;
        return data;
    } catch (error) {
        console.error('Error fetching module access config:', error);
        throw error;
    }
};

export const getModuleAccess = async (): Promise<ModuleAccessConfig> => {
    if (cachedModuleAccess) return cachedModuleAccess;

    const stored = await loadModuleAccess();
    if (stored) {
        cachedModuleAccess = stored;
        return stored;
    }

    return DEFAULT_MODULE_ACCESS;
};

/**
 * Given a driver's driver_types array, returns the union of all allowed modules
 * across all their types.
 *
 * IMPORTANT: If a driver type is not found in the config (new type added to DB
 * but not yet in the remote config cache), we grant FULL access for that type
 * so new types never accidentally lock drivers out.
 *
 * If driver_types is empty or null, full access is granted (backwards compat).
 */
export const getAllowedModulesForDriver = async (driverTypes: string[]): Promise<string[]> => {
    if (!driverTypes || driverTypes.length === 0) {
        // No restriction configured = show everything
        return ['__ALL__'];
    }

    const config = await getModuleAccess();
    const allowed = new Set<string>();
    let grantFullAccess = false;

    for (const type of driverTypes) {
        const modules = config.access[type.toLowerCase()];

        if (modules === undefined) {
            // Type exists on driver but not in config yet = full access fallback
            grantFullAccess = true;
            break;
        }

        modules.forEach((m) => allowed.add(m));
    }

    if (grantFullAccess) return ['__ALL__'];

    return Array.from(allowed);
};

/**
 * Returns true if a specific module is allowed for this driver.
 * '__ALL__' sentinel means unrestricted access.
 */
export const isModuleAllowed = async (
    moduleKey: string,
    driverTypes: string[]
): Promise<boolean> => {
    const allowed = await getAllowedModulesForDriver(driverTypes);
    if (allowed.includes('__ALL__')) return true;
    return allowed.includes(moduleKey);
};

/**
 * Returns true if the vehicle section should be shown.
 * Purely config-driven: if ANY of the driver's allowed modules
 * are vehicle-related modules, show the vehicle section.
 * Vehicle-related modules are: fuel, truck-log, wash, minor-repairs,
 * accident, damage-log, breakdown.
 */
export const shouldShowVehicleSection = async (driverTypes: string[]): Promise<boolean> => {
    const allowed = await getAllowedModulesForDriver(driverTypes);

    // Full access = show vehicle
    if (allowed.includes('__ALL__')) return true;

    const vehicleRelatedModules = [
        'fuel',
        'truck-log',
        'wash',
        'minor-repairs',
        'accident',
        'damage-log',
        'breakdown',
    ];

    return vehicleRelatedModules.some((m) => allowed.includes(m));
};

export const clearModuleAccessCache = (): void => {
    cachedModuleAccess = null;
};