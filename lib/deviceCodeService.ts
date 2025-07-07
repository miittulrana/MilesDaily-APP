import { config } from '../constants/Config';
import { getStoredDeviceCode, storeDeviceCode } from './deviceCodeStorage';

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
    console.log('validateDriverDeviceCode called with:', { driverId, deviceCode });
    
    const storedCode = await getStoredDeviceCode(driverId);
    console.log('Stored device code:', storedCode);
    
    const codeToValidate = deviceCode || storedCode;
    console.log('Code to validate:', codeToValidate);
    
    if (!codeToValidate) {
      console.log('No code to validate - returning DEVICE_CODE_REQUIRED');
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
    
    console.log('Making API request to:', config.api.deviceValidationUrl);
    console.log('Request data:', requestData);
    
    const response = await fetch(config.api.deviceValidationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    console.log('API response status:', response.status);
    console.log('API response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response error:', errorText);
      throw new Error(`Validation request failed: ${response.status} - ${errorText}`);
    }
    
    const result: DeviceCodeValidationResponse = await response.json();
    console.log('API response result:', result);
    
    if (result.is_valid && deviceCode) {
      console.log('Validation successful - storing device code');
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

export const submitDeviceCode = async (driverId: string, deviceCode: string): Promise<DeviceCodeValidationResponse> => {
  try {
    console.log('submitDeviceCode called with:', { driverId, deviceCode });
    
    const validation = await validateDriverDeviceCode(driverId, deviceCode);
    
    console.log('validateDriverDeviceCode returned:', validation);
    
    if (validation.is_valid) {
      console.log('Validation successful - storing device code');
      await storeDeviceCode(driverId, deviceCode);
      console.log('Device code stored successfully');
    } else {
      console.log('Validation failed:', validation.message);
    }
    
    return validation;
  } catch (error) {
    console.error('Error in submitDeviceCode:', error);
    return {
      is_valid: false,
      device_registered: false,
      device_active: false,
      message: 'Failed to submit device code'
    };
  }
};