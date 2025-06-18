import { supabase } from './supabase';
import { AccidentReport, CreateAccidentRequest, ImageType } from '../utils/accidentTypes';

const BASE_URL = 'https://fleet.milesxp.com/api/drivers/accidents';

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

export const getDriverAccidents = async (): Promise<AccidentReport[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accidents: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching driver accidents:', error);
    throw error;
  }
};

export const createAccidentReport = async (data: CreateAccidentRequest): Promise<{ success: boolean; reportId?: string; error?: string }> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to create accident report' };
    }

    const result = await response.json();
    return { success: true, reportId: result.reportId };
  } catch (error) {
    console.error('Error creating accident report:', error);
    return { success: false, error: 'Network error' };
  }
};

export const uploadAccidentImage = async (
  reportId: string,
  imageUri: string,
  imageType: ImageType,
  imageOrder: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('No authenticated user');
    }

    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const imageData = await response.arrayBuffer();
    
    const fileExt = 'jpg';
    const fileName = `${imageType}_${imageOrder}_${reportId}_${Date.now()}.${fileExt}`;
    const filePath = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${reportId}/${fileName}`;
    
    const bucketName = imageType === 'accident_photo' ? 'accident-photos' : 'accident-forms';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageData, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData.publicUrl;

    const { data: imageRecord, error: imageError } = await supabase
      .from('accident_report_images')
      .insert({
        accident_report_id: reportId,
        image_type: imageType,
        image_order: imageOrder,
        image_url: imageUrl,
        image_name: fileName,
        image_size: imageData.byteLength,
        mime_type: 'image/jpeg',
        uploaded_by_driver: user.id
      })
      .select()
      .single();

    if (imageError) {
      console.error('Database insert error:', imageError);
      await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      
      throw new Error(`Failed to save image record: ${imageError.message}`);
    }

    return { success: true };
    
  } catch (error) {
    console.error('Error uploading accident image:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
};

export const submitAccidentReport = async (reportId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BASE_URL}/${reportId}/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to submit accident report' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting accident report:', error);
    return { success: false, error: 'Network error' };
  }
};

export const getDriverVehicles = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('id, license_plate, brand, model, type')
      .eq('driver_id', user.id)
      .eq('status', 'assigned');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching driver vehicles:', error);
    throw error;
  }
};