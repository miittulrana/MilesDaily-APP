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
    
    const response = await fetch('https://fleet.milesxp.com/api/driver-devices/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Validation request failed: ${response.status} - ${errorText}`);
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

export const submitDeviceCode = async (driverId: string, deviceCode: string): Promise<DeviceCodeValidationResponse> => {
  try {
    const validation = await validateDriverDeviceCode(driverId, deviceCode);
    
    if (validation.is_valid) {
      await storeDeviceCode(driverId, deviceCode);
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