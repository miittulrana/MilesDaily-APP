import { supabase } from './supabase';
import { FuelFormData, FuelRecord, FuelStats, Vehicle } from '../utils/types';

export const getFuelRecords = async (driverId: string): Promise<FuelRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('fuel_records')
      .select(`
        *,
        vehicle:vehicles(license_plate, brand, model, type)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching fuel records:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getFuelRecords:', error);
    return [];
  }
};

export const getAllFuelRecords = async (driverId: string, vehicleId: string): Promise<FuelRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('fuel_records')
      .select(`
        *,
        vehicle:vehicles(license_plate, brand, model, type)
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching all fuel records:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllFuelRecords:', error);
    return [];
  }
};

export const getAssignedVehicle = async (driverId: string): Promise<Vehicle | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'assigned')
      .single();
    
    if (error) {
      console.error('Error fetching assigned vehicle:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAssignedVehicle:', error);
    return null;
  }
};

export const getCurrentFuelPrice = async (fuelType: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('fuel_prices')
      .select('price_per_liter')
      .eq('fuel_type', fuelType)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching fuel price:', error);
      return fuelType === 'petrol' ? 1.34 : 1.21;
    }
    
    return data.price_per_liter;
  } catch (error) {
    console.error('Error in getCurrentFuelPrice:', error);
    return fuelType === 'petrol' ? 1.34 : 1.21;
  }
};

export const createFuelRecord = async (
  formData: FuelFormData, 
  driverId: string,
  fuelPrice: number
): Promise<{ success: boolean; record?: FuelRecord; error?: string }> => {
  try {
    const vehicle = await getAssignedVehicle(driverId);
    
    if (!vehicle) {
      return { success: false, error: 'No assigned vehicle found' };
    }
    
    const liters = formData.amount_euros / fuelPrice;
    
    const { data, error } = await supabase
      .from('fuel_records')
      .insert({
        vehicle_id: formData.vehicle_id,
        driver_id: driverId,
        amount_euros: formData.amount_euros,
        current_km: formData.current_km,
        liters,
        created_by: driverId,
        is_manual_entry: false
      })
      .select(`
        *,
        vehicle:vehicles(license_plate, brand, model, type)
      `)
      .single();
    
    if (error) {
      console.error('Error creating fuel record:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, record: data };
  } catch (error) {
    console.error('Error in createFuelRecord:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const fetchVehicleStats = async (vehicleId: string): Promise<FuelStats | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicle_fuel_stats')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .single();
    
    if (error) {
      const { data: records, error: recordsError } = await supabase
        .from('fuel_records')
        .select('amount_euros, liters, current_km')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: true });
      
      if (recordsError || !records || records.length === 0) {
        return null;
      }
      
      const totalSpent = records.reduce((sum, record) => sum + record.amount_euros, 0);
      const totalLiters = records.reduce((sum, record) => sum + (record.liters || 0), 0);
      const firstReading = records[0]?.current_km || 0;
      const lastReading = records[records.length - 1]?.current_km || 0;
      const totalDistance = lastReading - firstReading;
      const avgConsumption = totalDistance > 0 && totalLiters > 0 
        ? (totalLiters / totalDistance) * 100 
        : 0;
      
      return {
        total_spent_euros: totalSpent,
        total_liters: totalLiters,
        total_distance_km: totalDistance,
        record_count: records.length,
        avg_consumption_per_100km: avgConsumption,
        last_km_reading: lastReading
      };
    }
    
    return {
      total_spent_euros: data.total_spent_euros || 0,
      total_liters: data.total_liters || 0,
      total_distance_km: data.total_distance_km || 0,
      record_count: data.record_count || 0,
      avg_consumption_per_100km: data.avg_consumption_per_100km || 0,
      last_km_reading: data.last_km_reading || 0
    };
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    return null;
  }
};