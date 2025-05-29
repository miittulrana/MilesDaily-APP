// lib/washService.ts
import { supabase } from './supabase';

export interface WashSchedule {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  scheduled_date: string;
  status: 'pending' | 'completed';
  completed_at: string | null;
  completed_by_type: 'driver' | 'admin' | null;
  completed_by_user_id: string | null;
  image_url: string | null;
  admin_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
    type: string;
    driver?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
    } | null;
  };
  completed_by_user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// Trigger auto-generation via web API
const triggerAutoGeneration = async (date: string): Promise<void> => {
  try {
    console.log('Triggering auto-generation via web API for:', date);
    
    const response = await fetch('https://fleet.milesxp.com/api/wash-schedule/auto-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Auto-generation result:', result);
    } else {
      console.log('Auto-generation failed:', response.status);
    }
  } catch (error) {
    console.error('Error triggering auto-generation:', error);
  }
};

// Fetch wash schedules - SIMPLE VERSION (no auto-generation)
export const fetchWashSchedules = async (date: string): Promise<WashSchedule[]> => {
  try {
    console.log('Fetching wash schedules from Supabase for date:', date);
    
    // Just read schedules from Supabase (webapp already created them)
    const { data, error } = await supabase
      .from('wash_schedules')
      .select(`
        *,
        vehicle:vehicles(
          id,
          license_plate,
          brand,
          model,
          type,
          driver:drivers(
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('scheduled_date', date)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return [];
    }

    console.log('Supabase schedules result:', data?.length || 0, 'schedules found');
    return data || [];
  } catch (error) {
    console.error('Error in fetchWashSchedules:', error);
    return [];
  }
};

// Complete wash by driver
export const completeWashByDriver = async (
  scheduleId: string,
  imageFile: File | Blob,
  notes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Completing wash via Supabase:', scheduleId);
    
    // First upload image to Supabase storage
    let imageUrl: string | null = null;
    
    if (imageFile) {
      const fileName = `driver_${scheduleId}_${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wash')
        .upload(fileName, imageFile, {
          contentType: imageFile.type || 'image/jpeg'
        });
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return { success: false, error: 'Failed to upload image' };
      }
      
      const { data: publicUrl } = supabase.storage
        .from('wash')
        .getPublicUrl(fileName);
      
      imageUrl = publicUrl.publicUrl;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Update schedule
    const { error: updateError } = await supabase
      .from('wash_schedules')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by_type: 'driver',
        completed_by_user_id: user?.id || null,
        image_url: imageUrl,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId);

    if (updateError) {
      console.error('Error updating schedule:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('Wash completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error completing wash:', error);
    return { success: false, error: 'Failed to complete wash schedule' };
  }
};

// Get driver's wash schedules for date
export const getDriverWashSchedules = async (
  driverId: string,
  date: string
): Promise<WashSchedule[]> => {
  const allSchedules = await fetchWashSchedules(date);
  return allSchedules.filter(schedule => schedule.driver_id === driverId);
};

// Get today's wash schedule for driver
export const getTodaysWashSchedule = async (driverId: string): Promise<WashSchedule[]> => {
  const today = new Date().toISOString().split('T')[0];
  return getDriverWashSchedules(driverId, today);
};