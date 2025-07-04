import { supabase } from './supabase';
import { ImportantPhoneNumber } from '../utils/importantNumbersTypes';

export const fetchImportantNumbers = async (): Promise<ImportantPhoneNumber[]> => {
  try {
    const { data, error } = await supabase
      .from('important_phone_numbers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching important numbers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchImportantNumbers:', error);
    return [];
  }
};