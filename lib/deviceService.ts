import { config } from '../constants/Config';
import { getDeviceId, cacheDeviceValidation, getCachedDeviceValidation } from '../utils/deviceUtils';

export interface DeviceValidationRequest {
  driver_id: string;
  device_id: string;
}

export interface DeviceValidationResponse {
  is_valid: boolean;
  device_registered: boolean;
  device_active: boolean;
  message: string;
}

export const validateDriverDevice = async (driverId: string): Promise<DeviceValidationResponse> => {
  try {
    const deviceId = await getDeviceId();
    
    if (!deviceId) {
      return {
        is_valid: false,
        device_registered: false,
        device_active: false,
        message: 'Unable to get device ID'
      };
    }
    
    const cachedResult = await getCachedDeviceValidation(driverId);
    if (cachedResult !== null) {
      return {
        is_valid: cachedResult,
        device_registered: cachedResult,
        device_active: cachedResult,
        message: cachedResult ? 'Device validation successful' : 'Kindly login on Company\'s Device only'
      };
    }
    
    const requestData: DeviceValidationRequest = {
      driver_id: driverId,
      device_id: deviceId
    };
    
    const response = await fetch(config.api.deviceValidationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      throw new Error(`Validation request failed: ${response.status}`);
    }
    
    const result: DeviceValidationResponse = await response.json();
    
    await cacheDeviceValidation(result.is_valid, driverId);
    
    return result;
  } catch (error) {
    console.error('Error validating device:', error);
    
    const cachedResult = await getCachedDeviceValidation(driverId);
    if (cachedResult !== null) {
      return {
        is_valid: cachedResult,
        device_registered: cachedResult,
        device_active: cachedResult,
        message: cachedResult ? 'Device validation successful (offline)' : 'Kindly login on Company\'s Device only'
      };
    }
    
    return {
      is_valid: false,
      device_registered: false,
      device_active: false,
      message: 'Kindly login on Company\'s Device only'
    };
  }
};