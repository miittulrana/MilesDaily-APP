import { User } from '@supabase/supabase-js';
import supabase from '../utils/supabase';

export interface LocationData {
  lat: number;
  lng: number;
  speed: number | null;
  battery: number | null;
  timestamp?: string;
}

export async function getDriver(userId: string) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting driver:', error);
      throw error;
    }
    
    // Normalize the data to handle both schema types
    return {
      id: data.id,
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email?.split('@')?.[0] || 'Driver',
      email: data.email,
    };
  } catch (error) {
    console.error('Failed to get driver:', error);
    // Return a basic driver object with id if query fails
    return {
      id: userId,
      name: 'Driver',
      email: 'Unknown',
    };
  }
}

export async function createDriverIfNotExists(user: User) {
  if (!user || !user.id || !user.email) {
    console.error('Invalid user object provided to createDriverIfNotExists');
    return;
  }

  try {
    // Check if the driver already exists
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    // Skip if driver already exists
    if (existingDriver) {
      console.log('Driver already exists:', existingDriver.id);
      return;
    }
    
    // User name from email
    const emailName = user.email?.split('@')[0] || 'Driver';
    
    // Try inserting with the full schema (driver SQL)
    try {
      const { error: insertError } = await supabase
        .from('drivers')
        .insert({
          id: user.id,
          email: user.email,
          first_name: emailName,
          last_name: '',
          role: 'van-driver', // Required field in the driver SQL
        });
      
      if (insertError) {
        console.error('Error inserting driver (full schema):', insertError);
        throw insertError;
      }
      
      console.log('Successfully created driver with full schema');
    } catch (fullSchemaError) {
      console.log('Full schema insert failed, trying simplified schema');
      
      // Try inserting with the simplified schema (tracking app SQL)
      try {
        const { error: simpleInsertError } = await supabase
          .from('drivers')
          .insert({
            id: user.id,
            name: emailName,
            email: user.email,
          });
        
        if (simpleInsertError) {
          console.error('Error inserting driver (simple schema):', simpleInsertError);
          throw simpleInsertError;
        }
        
        console.log('Successfully created driver with simple schema');
      } catch (simpleSchemaError) {
        console.error('Both schema insert attempts failed');
        // Let the error propagate up
        throw simpleSchemaError;
      }
    }
  } catch (error) {
    console.error('Failed to create driver:', error);
    throw error;
  }
}

export async function updateLocation(userId: string, locationData: LocationData) {
  // Update the current location
  const { error: liveError } = await supabase
    .from('locations')
    .upsert({
      driver_id: userId,
      lat: locationData.lat,
      lng: locationData.lng,
      speed: locationData.speed,
      battery: locationData.battery,
      updated_at: new Date().toISOString(),
    });
  
  if (liveError) throw liveError;
  
  // Add to location history
  const { error: logError } = await supabase
    .from('location_logs')
    .insert([
      {
        driver_id: userId,
        lat: locationData.lat,
        lng: locationData.lng,
        speed: locationData.speed,
        battery: locationData.battery,
        timestamp: locationData.timestamp || new Date().toISOString(),
      },
    ]);
  
  if (logError) throw logError;
  
  return { success: true };
}