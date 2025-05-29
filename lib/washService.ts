import { supabase } from './supabase';

export type WashSchedule = {
  id: string;
  vehicle_id: string;
  driver_id: string;
  scheduled_date: string;
  status: 'pending' | 'completed';
  completed_at: string | null;
  completed_by_type: 'driver' | 'admin' | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  vehicle?: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
    type: string;
  };
};

export type WashScheduleResponse = {
  schedules: WashSchedule[];
  date: string;
  has_wash_today: boolean;
};

export const getTodayWashSchedule = async (): Promise<WashScheduleResponse> => {
  try {
    // Get current session and token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token found');
    }

    // Call our driver API endpoint
    const response = await fetch('https://fleet.milesxp.com/api/drivers/wash-schedule', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching today wash schedule:', error);
    
    // Fallback: try direct Supabase query
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data: schedules, error } = await supabase
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
        .eq('driver_id', user.id)
        .eq('scheduled_date', today);
      
      if (error) {
        throw error;
      }
      
      return {
        schedules: schedules || [],
        date: today,
        has_wash_today: schedules && schedules.length > 0
      };
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      
      // Return empty result if both methods fail
      return {
        schedules: [],
        date: new Date().toISOString().split('T')[0],
        has_wash_today: false
      };
    }
  }
}; // <-- This closing brace was missing!

export const completeWash = async (scheduleId: string, imageUri: string): Promise<boolean> => {
  try {
    // Get current session and token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token found');
    }

    // Create FormData for image upload
    const formData = new FormData();
    formData.append('schedule_id', scheduleId);
    
    // Append image file
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `wash_${scheduleId}_${Date.now()}.jpg`,
    } as any);

    // Call the driver completion API
    const response = await fetch('https://fleet.milesxp.com/api/wash-schedule/driver-complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return true;
  } catch (error) {
    console.error('Error completing wash:', error);
    
    // Fallback: try direct Supabase update
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update wash schedule status directly
      const { error } = await supabase
        .from('wash_schedules')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by_type: 'driver',
          completed_by_user_id: user.id
        })
        .eq('id', scheduleId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (fallbackError) {
      console.error('Fallback update also failed:', fallbackError);
      return false;
    }
  }
};