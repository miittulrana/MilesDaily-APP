import { config } from '../constants/Config';
import { getStoredDeviceCode, storeDeviceCode } from '../utils/deviceCodeStorage';

export interface DeviceCodeValidationRequest {
  driver_id: string;
  device_code: string;
}

export interface DeviceCodeValidationResponse {
  is_valid: boolean;
  device_registered: boolean;
  device_active: boolean;
  message: string;
}

export const validateDriverDeviceCode = async (driverId: string, deviceCode?: string): Promise<DeviceCodeValidationResponse> => {
  try {
    if (__DEV__) {
      return {
        is_valid: true,
        device_registered: true,
        device_active: true,
        message: 'Development mode - validation bypassed'
      };
    }

    const storedCode = await getStoredDeviceCode(driverId);
    
    const codeToValidate = deviceCode || storedCode;
    
    if (!codeToValidate) {
      return {
        is_valid: false,
        device_registered: false,
        device_active: false,
        message: 'DEVICE_CODE_REQUIRED'
      };
    }
    
    const requestData: DeviceCodeValidationRequest = {
      driver_id: driverId,
      device_code: codeToValidate
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
    
    const result: DeviceCodeValidationResponse = await response.json();
    
    if (result.is_valid && deviceCode) {
      await storeDeviceCode(driverId, deviceCode);
    }
    
    return result;
  } catch (error) {
    console.error('Error validating device code:', error);
    
    return {
      is_valid: false,
      device_registered: false,
      device_active: false,
      message: 'Device validation failed'
    };
  }
};