import { supabase } from './supabase';
import { BreakdownReport, CreateBreakdownData, AssistanceNumber } from '../utils/breakdownTypes';

export const fetchDriverBreakdownReports = async (driverId: string): Promise<BreakdownReport[]> => {
  try {
    const { data, error } = await supabase
      .from('breakdown_reports')
      .select(`
        *,
        vehicle:vehicles(
          license_plate,
          brand,
          model,
          type
        ),
        photos:breakdown_photos(
          id,
          photo_url,
          photo_name,
          photo_order
        )
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching breakdown reports:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchDriverBreakdownReports:', error);
    return [];
  }
};

export const createBreakdownReport = async (data: CreateBreakdownData): Promise<BreakdownReport> => {
  try {
    const { data: breakdownReport, error } = await supabase
      .from('breakdown_reports')
      .insert([
        {
          driver_id: data.driver_id,
          vehicle_id: data.vehicle_id,
          location_address: data.location_address,
          location_latitude: data.location_latitude || null,
          location_longitude: data.location_longitude || null,
          notes: data.notes || null,
          status: 'pending',
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
      console.error('Error creating breakdown report:', error);
      throw error;
    }

    if (data.image_uri) {
      console.log('Starting image upload for:', data.image_uri);
      
      const fileName = `breakdown-${breakdownReport.id}-${Date.now()}.jpg`;
      
      const response = await fetch(data.image_uri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      if (arrayBuffer.byteLength === 0) {
        console.error('Image file is empty');
        throw new Error('Image file is empty');
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('breakdown-photos')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('breakdown-photos')
          .getPublicUrl(fileName);

        console.log('Image uploaded successfully:', urlData.publicUrl);
        
        const { error: photoError } = await supabase
          .from('breakdown_photos')
          .insert([
            {
              breakdown_report_id: breakdownReport.id,
              photo_url: urlData.publicUrl,
              photo_name: fileName,
              photo_order: 1,
              uploaded_by: data.driver_id,
            },
          ]);

        if (photoError) {
          console.error('Error saving photo record:', photoError);
        }
      } else {
        console.error('Upload error:', uploadError);
      }
    }

    console.log('Breakdown report created successfully:', breakdownReport);
    return breakdownReport;
  } catch (error) {
    console.error('Error in createBreakdownReport:', error);
    throw error;
  }
};

export const getAssistanceNumbers = async (): Promise<AssistanceNumber[]> => {
  try {
    const { data, error } = await supabase
      .from('breakdown_assistance_numbers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assistance numbers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAssistanceNumbers:', error);
    return [];
  }
};