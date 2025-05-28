import { supabase } from './supabase';
import { DriverWashSchedule, WashCompletionData } from '../utils/washTypes';
import { getDriverInfo } from './auth';

export const getDriverWashSchedules = async (date: string): Promise<DriverWashSchedule[]> => {
  try {
    const driverInfo = await getDriverInfo();
    if (!driverInfo?.id) {
      throw new Error('Driver information not available');
    }

    const response = await fetch(`https://fleet.milesxp.com/api/wash-schedule?date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wash schedules: ${response.status}`);
    }

    const result = await response.json();
    const allSchedules = result.schedules || [];

    const driverSchedules = allSchedules
      .filter((schedule: any) => schedule.driver_id === driverInfo.id)
      .map((schedule: any) => ({
        id: schedule.id,
        vehicle_id: schedule.vehicle_id,
        scheduled_date: schedule.scheduled_date,
        status: schedule.status,
        completed_at: schedule.completed_at,
        completed_by_type: schedule.completed_by_type,
        image_url: schedule.image_url,
        admin_reason: schedule.admin_reason,
        notes: schedule.notes,
        vehicle: {
          id: schedule.vehicle.id,
          license_plate: schedule.vehicle.license_plate,
          brand: schedule.vehicle.brand,
          model: schedule.vehicle.model,
          type: schedule.vehicle.type,
        },
        was_completed_early: schedule.completed_at ? 
          new Date(schedule.completed_at) < new Date(schedule.scheduled_date + 'T00:00:00') : 
          false,
      }));

    return driverSchedules;
  } catch (error) {
    console.error('Error fetching driver wash schedules:', error);
    
    try {
      const driverInfo = await getDriverInfo();
      if (!driverInfo?.id) return [];

      const { data, error: dbError } = await supabase
        .from('wash_schedules')
        .select(`
          *,
          vehicle:vehicles(
            id,
            license_plate,
            brand,
            model,
            type
          )
        `)
        .eq('scheduled_date', date)
        .eq('driver_id', driverInfo.id);

      if (dbError) {
        console.error('Database error:', dbError);
        return [];
      }

      return (data || []).map((schedule: any) => ({
        id: schedule.id,
        vehicle_id: schedule.vehicle_id,
        scheduled_date: schedule.scheduled_date,
        status: schedule.status,
        completed_at: schedule.completed_at,
        completed_by_type: schedule.completed_by_type,
        image_url: schedule.image_url,
        admin_reason: schedule.admin_reason,
        notes: schedule.notes,
        vehicle: {
          id: schedule.vehicle.id,
          license_plate: schedule.vehicle.license_plate,
          brand: schedule.vehicle.brand,
          model: schedule.vehicle.model,
          type: schedule.vehicle.type,
        },
        was_completed_early: schedule.completed_at ? 
          new Date(schedule.completed_at) < new Date(schedule.scheduled_date + 'T00:00:00') : 
          false,
      }));
    } catch (dbError) {
      console.error('Fallback database error:', dbError);
      return [];
    }
  }
};

export const fetchDriverWashSchedules = async (
  driverId: string, 
  vehicleId: string, 
  date: string
): Promise<WashSchedule[]> => {
  console.log('Fetching wash schedules for:', { driverId, vehicleId, date });
  
  try {
    // Try direct database query first to see if data exists
    const { supabase } = await import('./supabase');
    
    // First, let's see what dates we have in the database
    const { data: allSchedules } = await supabase
      .from('wash_schedules')
      .select('scheduled_date, vehicle_id, driver_id, status')
      .limit(10);
    
    console.log('All schedules in database (first 10):', allSchedules);
    
    // Now query for the specific date
    const { data, error: dbError } = await supabase
      .from('wash_schedules')
      .select(`
        *,
        vehicle:vehicles(
          id,
          license_plate,
          brand,
          model,
          type
        )
      `)
      .eq('vehicle_id', vehicleId)
      .eq('scheduled_date', date);
    
    console.log('Database query result for date:', { date, data, error: dbError });
    
    if (dbError) {
      console.error('Database error:', dbError);
      return [];
    }
    
    // Filter for this driver (in case vehicle was reassigned)
    const driverSchedules = (data || []).filter((schedule: any) => 
      schedule.driver_id === driverId || schedule.vehicle_id === vehicleId
    );
    
    console.log('Filtered schedules for driver:', driverSchedules);
    
    // If no schedules for today, let's check if there are any schedules for this vehicle at all
    if (driverSchedules.length === 0) {
      const { data: anySchedules } = await supabase
        .from('wash_schedules')
        .select(`
          *,
          vehicle:vehicles(
            id,
            license_plate,
            brand,
            model,
            type
          )
        `)
        .eq('vehicle_id', vehicleId)
        .limit(5);
      
      console.log('Any schedules for this vehicle:', anySchedules);
    }
    
    return driverSchedules;
  } catch (error) {
    console.error('Error fetching driver wash schedules:', error);
    return [];
  }
};

export const completeWashByDriver = async (data: {
  schedule_id: string;
  image_uri: string;
  notes?: string;
}): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('schedule_id', data.schedule_id);
    formData.append('notes', data.notes || '');
    
    // Convert image URI to blob for upload
    const response = await fetch(data.image_uri);
    const blob = await response.blob();
    formData.append('image', blob as any, 'wash_photo.jpg');
    
    const apiResponse = await fetch('https://fleet.milesxp.com/api/wash-schedule/driver-complete', {
      method: 'POST',
      body: formData
    });
    
    if (!apiResponse.ok) {
      throw new Error(`Failed to complete wash: ${apiResponse.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error completing wash by driver:', error);
    return false;
  }
};

export const getTodaysWashSchedules = async (): Promise<DriverWashSchedule[]> => {
  const today = new Date().toISOString().split('T')[0];
  return getDriverWashSchedules(today);
};

export const hasWashScheduleForDate = async (date: string): Promise<boolean> => {
  try {
    const schedules = await getDriverWashSchedules(date);
    return schedules.length > 0;
  } catch (error) {
    console.error('Error checking wash schedule for date:', error);
    return false;
  }
};

export const getWashScheduleById = async (scheduleId: string): Promise<WashSchedule | null> => {
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase
      .from('wash_schedules')
      .select(`
        *,
        vehicle:vehicles(
          id,
          license_plate,
          brand,
          model,
          type
        )
      `)
      .eq('id', scheduleId)
      .single();
    
    if (error) {
      console.error('Error fetching schedule by ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching wash schedule by ID:', error);
    return null;
  }
};