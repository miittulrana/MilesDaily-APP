import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    STATUS_RULES: 'remote_config_status_rules',
    STATUS_PERMISSIONS: 'remote_config_status_permissions',
    GEOFENCE: 'remote_config_geofence',
    VALIDATIONS: 'remote_config_validations',
    UI_CONTENT: 'remote_config_ui_content',
    VERSION: 'remote_config_version',
    LAST_FETCHED: 'remote_config_last_fetched',
};

export const saveToStorage = async <T>(key: string, data: T): Promise<void> => {
    try {
        const jsonData = JSON.stringify(data);
        await AsyncStorage.setItem(key, jsonData);
    } catch (error) {
        console.error(`Error saving ${key} to storage:`, error);
    }
};

export const loadFromStorage = async <T>(key: string): Promise<T | null> => {
    try {
        const jsonData = await AsyncStorage.getItem(key);
        if (jsonData) {
            return JSON.parse(jsonData) as T;
        }
        return null;
    } catch (error) {
        console.error(`Error loading ${key} from storage:`, error);
        return null;
    }
};

export const clearStorage = async (): Promise<void> => {
    try {
        const keys = Object.values(STORAGE_KEYS);
        await AsyncStorage.multiRemove(keys);
    } catch (error) {
        console.error('Error clearing remote config storage:', error);
    }
};

export const saveStatusRules = async (data: any): Promise<void> => {
    await saveToStorage(STORAGE_KEYS.STATUS_RULES, data);
};

export const loadStatusRules = async (): Promise<any | null> => {
    return loadFromStorage(STORAGE_KEYS.STATUS_RULES);
};

export const saveStatusPermissions = async (data: any): Promise<void> => {
    await saveToStorage(STORAGE_KEYS.STATUS_PERMISSIONS, data);
};

export const loadStatusPermissions = async (): Promise<any | null> => {
    return loadFromStorage(STORAGE_KEYS.STATUS_PERMISSIONS);
};

export const saveGeofence = async (data: any): Promise<void> => {
    await saveToStorage(STORAGE_KEYS.GEOFENCE, data);
};

export const loadGeofence = async (): Promise<any | null> => {
    return loadFromStorage(STORAGE_KEYS.GEOFENCE);
};

export const saveValidations = async (data: any): Promise<void> => {
    await saveToStorage(STORAGE_KEYS.VALIDATIONS, data);
};

export const loadValidations = async (): Promise<any | null> => {
    return loadFromStorage(STORAGE_KEYS.VALIDATIONS);
};

export const saveUIContent = async (data: any): Promise<void> => {
    await saveToStorage(STORAGE_KEYS.UI_CONTENT, data);
};

export const loadUIContent = async (): Promise<any | null> => {
    return loadFromStorage(STORAGE_KEYS.UI_CONTENT);
};

export const saveVersion = async (version: string): Promise<void> => {
    await saveToStorage(STORAGE_KEYS.VERSION, version);
};

export const loadVersion = async (): Promise<string | null> => {
    return loadFromStorage(STORAGE_KEYS.VERSION);
};

export const saveLastFetched = async (): Promise<void> => {
    await saveToStorage(STORAGE_KEYS.LAST_FETCHED, new Date().toISOString());
};

export const loadLastFetched = async (): Promise<string | null> => {
    return loadFromStorage(STORAGE_KEYS.LAST_FETCHED);
};

export { STORAGE_KEYS };