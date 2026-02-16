import { supabase } from './supabase';
import { DriverGuide } from '../utils/driverGuidesTypes';

export const fetchDriverGuides = async (): Promise<DriverGuide[]> => {
  try {
    const { data, error } = await supabase
      .from('driver_guides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching driver guides:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchDriverGuides:', error);
    throw error;
  }
};