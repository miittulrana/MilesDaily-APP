import { supabase } from './supabase';
import { DamageLog, CreateDamageLogData } from '../utils/damageLogTypes';

export const fetchDriverDamageLogs = async (driverId: string): Promise<DamageLog[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://fleet.milesxp.com'}/api/drivers/damages-log`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch damage logs: ${response.status}`);
    }

    const result = await response.json();
    return result.damages || [];
  } catch (error) {
    console.error('Error in fetchDriverDamageLogs:', error);
    throw error;
  }
};

export const createDamageLog = async (data: CreateDamageLogData): Promise<DamageLog> => {
  try {
    let imageUrl: string | null = null;

    if (data.image_uri) {
      console.log('Starting image upload for:', data.image_uri);
      
      const fileName = `damage-${Date.now()}.jpg`;
      
      // READ THE IMAGE FILE CORRECTLY
      const response = await fetch(data.image_uri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      // Make sure we have actual image data
      if (arrayBuffer.byteLength === 0) {
        console.error('Image file is empty');
        throw new Error('Image file is empty');
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('damage-photos')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('damage-photos')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
        console.log('Image uploaded successfully:', imageUrl);
        
        // Verify the upload worked
        const { data: fileInfo } = await supabase.storage
          .from('damage-photos')
          .list('', { search: fileName });
        
        if (fileInfo && fileInfo.length > 0) {
          console.log('File size after upload:', fileInfo[0].metadata?.size);
        }
      } else {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
    }

    const { data: damageLog, error } = await supabase
      .from('damages_log')
      .insert([
        {
          driver_id: data.driver_id,
          vehicle_id: data.vehicle_id,
          image_url: imageUrl,
          remarks: data.remarks,
          is_viewed: false,
        },
      ])
      .select(`
        *,
        vehicle:vehicles(
          license_plate,
          brand,
          model,
          type
        )
      `)
      .single();

    if (error) {
      console.error('Error creating damage log:', error);
      throw error;
    }

    console.log('Damage log created successfully:', damageLog);
    return damageLog;
  } catch (error) {
    console.error('Error in createDamageLog:', error);
    throw error;
  }
};