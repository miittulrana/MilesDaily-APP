import { supabase } from './supabase';
import { MinorRepair, RepairType, CreateMinorRepairData } from '../utils/minorRepairsTypes';

export const fetchDriverMinorRepairs = async (driverId: string): Promise<MinorRepair[]> => {
  try {
    const { data, error } = await supabase
      .from('minor_repairs')
      .select(`
        *,
        repair_type:repair_types(
          id,
          name,
          description
        ),
        vehicle:vehicles(
          id,
          license_plate,
          brand,
          model,
          type
        )
      `)
      .eq('submitted_by_driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching driver minor repairs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchDriverMinorRepairs:', error);
    throw error;
  }
};

export const fetchRepairTypes = async (): Promise<RepairType[]> => {
  try {
    const { data, error } = await supabase
      .from('repair_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching repair types:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRepairTypes:', error);
    throw error;
  }
};

export const createMinorRepair = async (data: CreateMinorRepairData): Promise<MinorRepair> => {
  try {
    let imageUrl: string | null = null;

    if (data.image_uri) {
      console.log('Starting image upload for:', data.image_uri);
      
      const fileName = `repair-${Date.now()}.jpg`;
      
      const response = await fetch(data.image_uri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      if (arrayBuffer.byteLength === 0) {
        console.error('Image file is empty');
        throw new Error('Image file is empty');
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('minor-repairs')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('minor-repairs')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
        console.log('Image uploaded successfully:', imageUrl);
        
        const { data: fileInfo } = await supabase.storage
          .from('minor-repairs')
          .list('', { search: fileName });
        
        if (fileInfo && fileInfo.length > 0) {
          console.log('File size after upload:', fileInfo[0].metadata?.size);
        }
      } else {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
    }

    const { data: driverInfo } = await supabase.auth.getUser();
    
    if (!driverInfo.user) {
      throw new Error('No authenticated user found');
    }

    const { data: repair, error } = await supabase
      .from('minor_repairs')
      .insert([
        {
          repair_type_id: data.repair_type_id,
          vehicle_id: data.vehicle_id,
          cost_euros: data.cost_euros,
          description: data.description,
          image_url: imageUrl,
          submitted_by_type: 'driver',
          submitted_by_driver_id: driverInfo.user.id,
          submitted_by_user_id: null,
        },
      ])
      .select(`
        *,
        repair_type:repair_types(
          id,
          name,
          description
        ),
        vehicle:vehicles(
          id,
          license_plate,
          brand,
          model,
          type
        )
      `)
      .single();

    if (error) {
      console.error('Error creating minor repair:', error);
      throw error;
    }

    console.log('Minor repair created successfully:', repair);
    return repair;
  } catch (error) {
    console.error('Error in createMinorRepair:', error);
    throw error;
  }
};