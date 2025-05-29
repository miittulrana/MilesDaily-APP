import { supabase } from './supabase';
import { notificationService } from './notificationService';

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
    
    const response = {
      schedules: schedules || [],
      date: today,
      has_wash_today: schedules && schedules.length > 0
    };

    if (response.has_wash_today && schedules) {
      for (const schedule of schedules) {
        if (schedule.status === 'pending' && schedule.vehicle) {
          try {
            await notificationService.startWashReminders(schedule.id, {
              license_plate: schedule.vehicle.license_plate,
              brand: schedule.vehicle.brand,
              model: schedule.vehicle.model
            });
          } catch (notificationError) {
            console.error('Error starting wash reminders:', notificationError);
          }
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching today wash schedule:', error);
    return {
      schedules: [],
      date: new Date().toISOString().split('T')[0],
      has_wash_today: false
    };
  }
};

export const completeWashByDriver = async (completionData: {
  schedule_id: string;
  image_uri: string;
  notes?: string;
}): Promise<boolean> => {
  try {
    console.log('Starting wash completion process...');
    console.log('Schedule ID:', completionData.schedule_id);
    console.log('Image URI:', completionData.image_uri);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: schedule, error: scheduleError } = await supabase
      .from('wash_schedules')
      .select('*')
      .eq('id', completionData.schedule_id)
      .eq('driver_id', user.id)
      .single();

    if (scheduleError || !schedule) {
      throw new Error('Wash schedule not found or access denied');
    }

    if (schedule.status === 'completed') {
      throw new Error('Wash schedule is already completed');
    }

    console.log('Uploading image to Supabase Storage...');
    
    const fileUri = completionData.image_uri;
    let imageData: ArrayBuffer;
    
    try {
      const response = await fetch(fileUri);
      imageData = await response.arrayBuffer();
    } catch (fetchError) {
      console.error('Failed to read image file:', fetchError);
      throw new Error('Failed to read image file');
    }
    
    const fileExt = 'jpg';
    const fileName = `wash_${completionData.schedule_id}_${Date.now()}.${fileExt}`;
    
    console.log('Uploading file:', fileName, 'Size:', imageData.byteLength);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wash')
      .upload(fileName, imageData, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    console.log('Image uploaded successfully:', uploadData.path);

    const { data: publicUrlData } = supabase.storage
      .from('wash')
      .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData.publicUrl;
    console.log('Image public URL:', imageUrl);

    const { data: updatedSchedule, error: updateError } = await supabase
      .from('wash_schedules')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by_type: 'driver',
        completed_by_user_id: user.id,
        image_url: imageUrl,
        notes: completionData.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', completionData.schedule_id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      
      await supabase.storage
        .from('wash')
        .remove([uploadData.path]);
      
      throw new Error(`Failed to update wash schedule: ${updateError.message}`);
    }

    console.log('Wash completion successful:', updatedSchedule);

    try {
      await notificationService.stopWashReminders(completionData.schedule_id);
      console.log('Stopped wash reminders for completed schedule:', completionData.schedule_id);
    } catch (notificationError) {
      console.error('Error stopping wash reminders:', notificationError);
    }

    return true;
  } catch (error) {
    console.error('Error in completeWashByDriver:', error);
    throw error;
  }
};

export const completeWash = async (scheduleId: string, imageUri: string): Promise<boolean> => {
  const result = await completeWashByDriver({
    schedule_id: scheduleId,
    image_uri: imageUri
  });

  if (result) {
    try {
      await notificationService.stopWashReminders(scheduleId);
    } catch (notificationError) {
      console.error('Error stopping wash reminders in legacy function:', notificationError);
    }
  }

  return result;
};

export const getWashScheduleById = async (scheduleId: string): Promise<WashSchedule | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

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
      .eq('driver_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching wash schedule:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getWashScheduleById:', error);
    return null;
  }
};