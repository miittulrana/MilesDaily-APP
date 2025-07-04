import { supabase } from './supabase';
import {
  UniformType,
  UniformSize,
  UniformInventoryItem,
  DriverSizePreference,
  UniformRequest,
  DriverUniformAllocation,
  UniformReturnRequest,
  SelfReportedUniform,
  CreateRequestData,
  CreatePreferenceData,
  CreateReturnData,
  CreateSelfReportData
} from '../utils/uniformTypes';

const API_BASE = 'https://fleet.milesxp.com/api/drivers/uniforms';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No authentication token available');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const fetchUniformTypes = async (): Promise<UniformType[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/types`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch uniform types');
    }
    
    const data = await response.json();
    return data.types || [];
  } catch (error) {
    console.error('Error fetching uniform types:', error);
    throw error;
  }
};

export const fetchUniformSizes = async (uniformTypeId?: string): Promise<UniformSize[]> => {
  try {
    const headers = await getAuthHeaders();
    const url = uniformTypeId 
      ? `${API_BASE}/sizes?uniform_type_id=${uniformTypeId}`
      : `${API_BASE}/sizes`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch uniform sizes');
    }
    
    const data = await response.json();
    return data.sizes || [];
  } catch (error) {
    console.error('Error fetching uniform sizes:', error);
    throw error;
  }
};

export const fetchUniformInventory = async (
  uniformTypeId?: string,
  category?: string
): Promise<UniformInventoryItem[]> => {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    
    if (uniformTypeId) params.append('uniform_type_id', uniformTypeId);
    if (category) params.append('category', category);
    
    const url = `${API_BASE}/inventory${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch uniform inventory');
    }
    
    const data = await response.json();
    return data.inventory || [];
  } catch (error) {
    console.error('Error fetching uniform inventory:', error);
    throw error;
  }
};

export const fetchDriverPreferences = async (): Promise<DriverSizePreference[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/preferences`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch driver preferences');
    }
    
    const data = await response.json();
    return data.preferences || [];
  } catch (error) {
    console.error('Error fetching driver preferences:', error);
    throw error;
  }
};

export const createDriverPreference = async (
  preferenceData: CreatePreferenceData
): Promise<DriverSizePreference> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/preferences`, {
      method: 'POST',
      headers,
      body: JSON.stringify(preferenceData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create preference');
    }
    
    const data = await response.json();
    return data.preference;
  } catch (error) {
    console.error('Error creating driver preference:', error);
    throw error;
  }
};

export const fetchUniformRequests = async (): Promise<UniformRequest[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/requests`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch uniform requests');
    }
    
    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error('Error fetching uniform requests:', error);
    throw error;
  }
};

export const createUniformRequest = async (
  requestData: CreateRequestData
): Promise<UniformRequest> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/requests/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create uniform request');
    }
    
    const data = await response.json();
    return data.request;
  } catch (error) {
    console.error('Error creating uniform request:', error);
    throw error;
  }
};

export const fetchDriverAllocations = async (): Promise<DriverUniformAllocation[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/allocations`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch driver allocations');
    }
    
    const data = await response.json();
    return data.allocations || [];
  } catch (error) {
    console.error('Error fetching driver allocations:', error);
    throw error;
  }
};

export const fetchUniformReturns = async (): Promise<UniformReturnRequest[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/returns`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch uniform returns');
    }
    
    const data = await response.json();
    return data.returns || [];
  } catch (error) {
    console.error('Error fetching uniform returns:', error);
    throw error;
  }
};

export const createUniformReturn = async (
  returnData: CreateReturnData
): Promise<UniformReturnRequest> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/returns`, {
      method: 'POST',
      headers,
      body: JSON.stringify(returnData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create return request');
    }
    
    const data = await response.json();
    return data.return_request;
  } catch (error) {
    console.error('Error creating uniform return:', error);
    throw error;
  }
};

export const fetchSelfReportedUniforms = async (): Promise<SelfReportedUniform[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/self-report`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch self-reported uniforms');
    }
    
    const data = await response.json();
    return data.self_reported || [];
  } catch (error) {
    console.error('Error fetching self-reported uniforms:', error);
    throw error;
  }
};

export const createSelfReportedUniform = async (
  reportData: CreateSelfReportData
): Promise<SelfReportedUniform> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/self-report`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reportData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create self-report');
    }
    
    const data = await response.json();
    return data.self_report;
  } catch (error) {
    console.error('Error creating self-reported uniform:', error);
    throw error;
  }
};