import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_CODE_KEY = 'device_code_storage';

export interface StoredDeviceCode {
  driver_id: string;
  device_code: string;
  stored_at: string;
}

export const storeDeviceCode = async (driverId: string, deviceCode: string): Promise<void> => {
  try {
    const codeData: StoredDeviceCode = {
      driver_id: driverId,
      device_code: deviceCode,
      stored_at: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(DEVICE_CODE_KEY, JSON.stringify(codeData));
  } catch (error) {
    console.error('Error storing device code:', error);
  }
};

export const getStoredDeviceCode = async (driverId: string): Promise<string | null> => {
  try {
    const stored = await AsyncStorage.getItem(DEVICE_CODE_KEY);
    
    if (!stored) {
      return null;
    }
    
    const codeData: StoredDeviceCode = JSON.parse(stored);
    
    if (codeData.driver_id !== driverId) {
      return null;
    }
    
    return codeData.device_code;
  } catch (error) {
    console.error('Error getting stored device code:', error);
    return null;
  }
};

export const clearStoredDeviceCode = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DEVICE_CODE_KEY);
  } catch (error) {
    console.error('Error clearing stored device code:', error);
  }
};