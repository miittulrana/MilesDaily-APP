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
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createDriverIfNotExists(user: User) {
  const { data: existingDriver } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (!existingDriver) {
    await supabase
      .from('drivers')
      .insert([
        {
          id: user.id,
          name: user.email?.split('@')[0] || 'Driver',
          email: user.email,
        },
      ]);
  }
}

export async function updateLocation(userId: string, locationData: LocationData) {
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