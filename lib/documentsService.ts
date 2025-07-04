import { supabase } from './supabase';
import { DriverDocument, VehicleDocument } from '../utils/documentTypes';

export const fetchDriverDocuments = async (driverId: string): Promise<DriverDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching driver documents:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchDriverDocuments:', error);
    throw error;
  }
};

export const fetchVehicleDocuments = async (vehicleId: string): Promise<VehicleDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicle documents:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchVehicleDocuments:', error);
    throw error;
  }
};

export const fetchTempAssignmentDocuments = async (vehicleId: string): Promise<VehicleDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching temp assignment documents:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchTempAssignmentDocuments:', error);
    throw error;
  }
};