import * as Network from 'expo-network';
import { ConfigVersion } from './types';
import { saveVersion, loadVersion, saveLastFetched, loadLastFetched, clearStorage } from './storage';
import { fetchStatusRules, clearStatusRulesCache } from './statusRules';
import { fetchStatusPermissions, clearPermissionsCache } from './statusPermissions';
import { fetchGeofenceConfig, clearGeofenceCache } from './geofence';
import { fetchStatusValidations, clearValidationsCache } from './validations';
import { fetchUIContent, clearUIContentCache } from './uiContent';
import { fetchModuleAccess, clearModuleAccessCache } from './moduleAccess';

const API_BASE_URL = 'https://fleet.milesxp.com/api/driver-config';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

let isInitialized = false;
let currentVersion: string | null = null;

export const checkVersion = async (): Promise<ConfigVersion | null> => {
    try {
        const storedVersion = await loadVersion();
        const url = storedVersion
            ? `${API_BASE_URL}/version?current_version=${storedVersion}`
            : `${API_BASE_URL}/version`;

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data: ConfigVersion = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking config version:', error);
        return null;
    }
};

export const fetchAllConfigs = async (): Promise<boolean> => {
    try {
        console.log('[RemoteConfig] Fetching all configs...');

        const results = await Promise.allSettled([
            fetchStatusRules(),
            fetchStatusPermissions(),
            fetchGeofenceConfig(),
            fetchStatusValidations(),
            fetchUIContent(),
            fetchModuleAccess(),
        ]);

        const allSucceeded = results.every((result) => result.status === 'fulfilled');

        if (allSucceeded) {
            const versionInfo = await checkVersion();
            if (versionInfo) {
                await saveVersion(versionInfo.global_version);
                currentVersion = versionInfo.global_version;
            }
            await saveLastFetched();
            console.log('[RemoteConfig] All configs fetched successfully');
        } else {
            const names = ['statusRules', 'statusPermissions', 'geofence', 'validations', 'uiContent', 'moduleAccess'];
            const failed = results
                .map((result, index) => (result.status === 'rejected' ? names[index] : null))
                .filter(Boolean);
            console.warn('[RemoteConfig] Some configs failed to fetch:', failed);
        }

        return allSucceeded;
    } catch (error) {
        console.error('[RemoteConfig] Error fetching configs:', error);
        return false;
    }
};

export const initRemoteConfig = async (): Promise<void> => {
    if (isInitialized) {
        console.log('[RemoteConfig] Already initialized');
        return;
    }

    console.log('[RemoteConfig] Initializing...');

    try {
        const networkState = await Network.getNetworkStateAsync();

        if (!networkState.isConnected) {
            console.log('[RemoteConfig] Offline - using cached/default config');
            isInitialized = true;
            return;
        }

        const versionInfo = await checkVersion();

        if (versionInfo && versionInfo.needs_update) {
            console.log('[RemoteConfig] New version available, fetching...');
            await fetchAllConfigs();
        } else {
            console.log('[RemoteConfig] Config is up to date');
            const lastFetched = await loadLastFetched();

            if (lastFetched) {
                const lastFetchedTime = new Date(lastFetched).getTime();
                const now = Date.now();
                if (now - lastFetchedTime > REFRESH_INTERVAL_MS) {
                    console.log('[RemoteConfig] Cache expired, refreshing...');
                    await fetchAllConfigs();
                }
            } else {
                await fetchAllConfigs();
            }
        }

        isInitialized = true;
        console.log('[RemoteConfig] Initialization complete');
    } catch (error) {
        console.error('[RemoteConfig] Initialization error:', error);
        isInitialized = true;
    }
};

export const refreshConfig = async (): Promise<boolean> => {
    console.log('[RemoteConfig] Refreshing config...');
    clearAllCaches();
    return await fetchAllConfigs();
};

export const clearAllCaches = (): void => {
    clearStatusRulesCache();
    clearPermissionsCache();
    clearGeofenceCache();
    clearValidationsCache();
    clearUIContentCache();
    clearModuleAccessCache();
    currentVersion = null;
};

export const clearAllStorageAndCaches = async (): Promise<void> => {
    clearAllCaches();
    await clearStorage();
    isInitialized = false;
};

export const isConfigInitialized = (): boolean => isInitialized;
export const getCurrentVersion = (): string | null => currentVersion;

export * from './statusRules';
export * from './statusPermissions';
export * from './geofence';
export * from './validations';
export * from './uiContent';
export * from './moduleAccess';
export * from './types';