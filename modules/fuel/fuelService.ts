import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { FuelFormData, FuelRecord, FuelStats, Vehicle } from './fuelTypes';

// Default fuel prices if API fails
const DEFAULT_PRICES = {
  diesel: 1.21,
  petrol: 1.34,
  petrol_lpg: 0.74,
  electric: 0.25
};

export async function getFuelRecords(driverId: string): Promise<FuelRecord[]> {
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
}

export async function getAssignedVehicle(driverId: string): Promise<Vehicle | null> {
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
}

export async function getCurrentFuelPrice(fuelType: string): Promise<number> {
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
      return DEFAULT_PRICES[fuelType] || 1.21; // Default to diesel price
    }
    
    return data.price_per_liter;
  } catch (error) {
    console.error('Error in getCurrentFuelPrice:', error);
    return DEFAULT_PRICES[fuelType] || 1.21; // Default to diesel price
  }
}

export async function createFuelRecord(
  formData: FuelFormData, 
  driverId: string,
  fuelPrice: number
): Promise<{ success: boolean; record?: FuelRecord; error?: string }> {
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
        location: formData.location || null,
        notes: formData.notes || null,
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
}

export async function getFuelStats(driverId: string): Promise<FuelStats | null> {
  try {
    const vehicle = await getAssignedVehicle(driverId);
    
    if (!vehicle) {
      return null;
    }
    
    // Try to get stats from the view first
    const { data: viewData, error: viewError } = await supabase
      .from('vehicle_fuel_stats')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .single();
    
    if (!viewError && viewData) {
      return {
        total_spent_euros: viewData.total_spent_euros || 0,
        total_liters: viewData.total_liters || 0,
        total_distance_km: viewData.total_distance_km || 0,
        record_count: viewData.record_count || 0,
        avg_consumption_per_100km: viewData.avg_consumption_per_100km || 0,
        last_km_reading: viewData.last_km_reading || 0
      };
    }
    
    // If view doesn't exist or returned an error, calculate stats from records
    const { data: records, error: recordsError } = await supabase
      .from('fuel_records')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: true });
    
    if (recordsError || !records || records.length === 0) {
      return {
        total_spent_euros: 0,
        total_liters: 0,
        total_distance_km: 0,
        record_count: 0,
        avg_consumption_per_100km: 0,
        last_km_reading: 0
      };
    }
    
    // Calculate basic stats
    const totalSpent = records.reduce((sum, record) => sum + record.amount_euros, 0);
    const totalLiters = records.reduce((sum, record) => sum + (record.liters || 0), 0);
    const recordCount = records.length;
    
    // Calculate distance (based on odometer differences)
    let totalDistance = 0;
    
    if (records.length > 1) {
      for (let i = 1; i < records.length; i++) {
        const prevRecord = records[i-1];
        const currRecord = records[i];
        
        if (prevRecord.current_km && currRecord.current_km) {
          const distance = currRecord.current_km - prevRecord.current_km;
          if (distance > 0 && distance < 10000) { // Sanity check (max 10,000 km between refills)
            totalDistance += distance;
          }
        }
      }
    }
    
    // Calculate consumption
    const avgConsumption = totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0;
    
    // Get latest km reading
    const lastKmReading = Math.max(...records.map(r => r.current_km || 0));
    
    return {
      total_spent_euros: totalSpent,
      total_liters: totalLiters,
      total_distance_km: totalDistance,
      record_count: recordCount,
      avg_consumption_per_100km: avgConsumption,
      last_km_reading: lastKmReading
    };
  } catch (error) {
    console.error('Error in getFuelStats:', error);
    return null;
  }
}