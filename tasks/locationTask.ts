import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

const LOCATION_TASK_NAME = 'background-location-task';

interface LocationTaskData {
  locations: Location.LocationObject[];
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as LocationTaskData;
    
    if (locations && locations.length > 0) {
      const location = locations[0];
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          return;
        }

        const locationUpdate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy_meters: location.coords.accuracy || null,
          altitude_meters: location.coords.altitude || null,
          speed_kmh: location.coords.speed ? location.coords.speed * 3.6 : null,
          heading_degrees: location.coords.heading || null,
          recorded_at: new Date(location.timestamp).toISOString(),
          location_source: 'gps'
        };

        const response = await fetch('https://fleet.milesxp.com/api/tracking/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(locationUpdate)
        });

        if (!response.ok) {
          console.error('Failed to send location update:', response.status);
        }
      } catch (err) {
        console.error('Error sending location update:', err);
      }
    }
  }
});

export { LOCATION_TASK_NAME };