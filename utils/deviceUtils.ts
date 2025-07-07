import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../constants/Config';

export const getDeviceId = async (): Promise<string | null> => {
  try {
    if (Platform.OS !== 'android') {
      return null;
    }

    const deviceId = await Device.getDeviceTypeAsync();
    const androidId = await Device.osInternalBuildId;
    
    if (androidId) {
      return androidId;
    }

    const deviceName = Device.deviceName || 'unknown';
    const modelName = Device.modelName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';
    
    const fallbackId = `${deviceName}-${modelName}-${osVersion}`.replace(/\s+/g, '-');
    return fallbackId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};

export const getDeviceInfo = async () => {
  try {
    const deviceId = await getDeviceId();
    
    return {
      deviceId,
      platform: Platform.OS,
      deviceName: Device.deviceName,
      modelName: Device.modelName,
      osVersion: Device.osVersion,
      brand: Device.brand,
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      deviceId: null,
      platform: Platform.OS,
      deviceName: null,
      modelName: null,
      osVersion: null,
      brand: null,
    };
  }
};

export const cacheDeviceValidation = async (isValid: boolean, driverId: string): Promise<void> => {
  try {
    const validationData = {
      isValid,
      driverId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };
    
    await AsyncStorage.setItem(
      config.storage.deviceValidationKey,
      JSON.stringify(validationData)
    );
  } catch (error) {
    console.error('Error caching device validation:', error);
  }
};

export const getCachedDeviceValidation = async (driverId: string): Promise<boolean | null> => {
  try {
    const cached = await AsyncStorage.getItem(config.storage.deviceValidationKey);
    
    if (!cached) {
      return null;
    }
    
    const validationData = JSON.parse(cached);
    
    if (validationData.driverId !== driverId) {
      return null;
    }
    
    if (Date.now() > validationData.expiresAt) {
      await AsyncStorage.removeItem(config.storage.deviceValidationKey);
      return null;
    }
    
    return validationData.isValid;
  } catch (error) {
    console.error('Error getting cached device validation:', error);
    return null;
  }
};

export const clearDeviceValidationCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(config.storage.deviceValidationKey);
  } catch (error) {
    console.error('Error clearing device validation cache:', error);
  }
};