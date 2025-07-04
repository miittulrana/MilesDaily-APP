import { supabase } from './supabase';
import { 
  AssignedVehicle, 
  TruckLogSession, 
  PunchData, 
  PunchResponse, 
  SessionsResponse, 
  VehiclesResponse 
} from '../utils/truckLogTypes';

const BASE_URL = 'https://fleet.milesxp.com/api/drivers/truck-log';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No authentication token available');
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

export const getAssignedVehicles = async (): Promise<AssignedVehicle[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BASE_URL}/vehicles`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.status}`);
    }

    const result: VehiclesResponse = await response.json();
    return result.vehicles || [];
  } catch (error) {
    console.error('Error fetching assigned vehicles:', error);
    throw error;
  }
};

export const punchInOut = async (data: PunchData): Promise<PunchResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BASE_URL}/punch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to punch in/out');
    }

    const result: PunchResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error punching in/out:', error);
    throw error;
  }
};

export const getDriverSessions = async (params?: {
  limit?: number;
  offset?: number;
  status?: 'active' | 'completed';
}): Promise<TruckLogSession[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.status) searchParams.append('status', params.status);
    
    const url = `${BASE_URL}/sessions${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.status}`);
    }

    const result: SessionsResponse = await response.json();
    return result.sessions || [];
  } catch (error) {
    console.error('Error fetching driver sessions:', error);
    throw error;
  }
};

export const getActiveSession = async (): Promise<TruckLogSession | null> => {
  try {
    const sessions = await getDriverSessions({ status: 'active', limit: 1 });
    return sessions.length > 0 ? sessions[0] : null;
  } catch (error) {
    console.error('Error fetching active session:', error);
    return null;
  }
};

export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 10000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};