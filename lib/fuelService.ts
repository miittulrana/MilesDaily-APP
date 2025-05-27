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
    const response = await fetch(`https://fleet.milesxp.com/api/fuel?vehicleId=${vehicleId}&pageSize=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fuel records: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching all fuel records:', error);
    
    return getFuelRecords(driverId);
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
    const response = await fetch(`https://fleet.milesxp.com/api/fuel/prices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const prices = await response.json();
      const currentPrice = prices.find((price: any) => price.fuel_type === fuelType);
      if (currentPrice) {
        return currentPrice.price_per_liter;
      }
    }
    
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
    
    try {
      const response = await fetch('https://fleet.milesxp.com/api/fuel/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          driver_id: driverId,
          amount_euros: formData.amount_euros,
          current_km: formData.current_km,
          is_manual_entry: false
        }),
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, record: data };
      }
    } catch (error) {
      console.error('API error, falling back to local database:', error);
    }
    
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
      .select()
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
    const response = await fetch(`https://fleet.milesxp.com/api/fuel/stats?vehicleId=${vehicleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vehicle stats: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !data.stats || data.stats.length === 0) {
      return null;
    }
    
    const vehicleStat = data.stats.find((stat: any) => stat.vehicle_id === vehicleId);
    if (!vehicleStat) {
      return null;
    }
    
    return {
      total_spent_euros: vehicleStat.total_spent_euros || 0,
      total_liters: vehicleStat.total_liters || 0,
      total_distance_km: vehicleStat.total_distance_km || 0,
      record_count: vehicleStat.record_count || 0,
      avg_consumption_per_100km: vehicleStat.avg_consumption_per_100km || 0,
      last_km_reading: vehicleStat.last_km_reading || 0
    };
  } catch (error) {
    console.error('Error fetching vehicle stats from web API:', error);
    
    try {
      const { data, error: dbError } = await supabase
        .from('vehicle_fuel_stats')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .single();
      
      if (dbError) {
        return null;
      }
      
      return {
        total_spent_euros: data.total_spent_euros || 0,
        total_liters: data.total_liters || 0,
        total_distance_km: data.total_distance_km || 0,
        record_count: data.record_count || 0,
        avg_consumption_per_100km: data.avg_consumption_per_100km || 0,
        last_km_reading: data.last_km_reading || 0
      };
    } catch (dbError) {
      console.error('Error fetching stats from local database:', dbError);
      return null;
    }
  }
};