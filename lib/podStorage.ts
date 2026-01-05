import { supabase } from './supabase';
import { CompressedImage } from './imageCompression';
import { addToOfflineQueue, getOfflineQueue, removeFromOfflineQueue } from './offlineQueue';
import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';

interface PODData {
  booking_id: number;
  miles_ref: string;
  photos: CompressedImage[];
  client_name: string;
  id_card: string;
  signature_base64: string;
  delivered_date: string;
  delivered_time: string;
  captured_by: string;
}

export const uploadPODPhotos = async (
  booking_id: number,
  photos: CompressedImage[]
): Promise<string[]> => {
  console.log('=== uploadPODPhotos START ===');
  console.log('Booking ID:', booking_id);
  console.log('Photos to upload:', photos.length);

  const uploadedUrls: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    console.log(`\n--- Uploading photo ${i + 1}/${photos.length} ---`);
    console.log('Photo URI:', photo.uri);
    console.log('Photo size:', photo.size);

    const timestamp = Date.now();
    const fileName = `${booking_id}/photo_${timestamp}_${i}.jpg`;
    console.log('File name:', fileName);

    try {
      console.log('Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: 'base64',
      });
      console.log('Base64 read successful, length:', base64.length);

      console.log('Uploading to Supabase storage bucket: booking-pods');
      const { data, error } = await supabase.storage
        .from('booking-pods')
        .upload(fileName, decode(base64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Photo upload failed: ${error.message}`);
      }

      console.log('Upload successful! Storage path:', data.path);

      const { data: urlData } = supabase.storage
        .from('booking-pods')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', urlData.publicUrl);
      uploadedUrls.push(urlData.publicUrl);
    } catch (uploadError) {
      console.error(`ERROR uploading photo ${i + 1}:`, uploadError);
      throw uploadError;
    }
  }

  console.log('=== uploadPODPhotos COMPLETE ===');
  console.log('Total photos uploaded:', uploadedUrls.length);
  console.log('URLs:', uploadedUrls);
  return uploadedUrls;

  return uploadedUrls;
};

const decode = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const savePOD = async (podData: PODData): Promise<{ success: boolean; error?: string }> => {
  console.log('\n=== savePOD START ===');
  console.log('POD Data:', {
    booking_id: podData.booking_id,
    miles_ref: podData.miles_ref,
    client_name: podData.client_name,
    photos_count: podData.photos.length,
    has_signature: !!podData.signature_base64,
    captured_by: podData.captured_by,
  });

  try {
    console.log('Checking network status...');
    const networkState = await Network.getNetworkStateAsync();
    console.log('Network state:', {
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
      type: networkState.type,
    });
    
    if (!networkState.isConnected) {
      console.log('❌ OFFLINE - Adding to queue');
      await addToOfflineQueue({
        booking_id: podData.booking_id,
        miles_ref: podData.miles_ref,
        photos: podData.photos,
        client_name: podData.client_name,
        id_card: podData.id_card,
        signature_base64: podData.signature_base64,
        delivered_date: podData.delivered_date,
        delivered_time: podData.delivered_time,
        status_id: 0,
        created_at: new Date().toISOString(),
      });
      console.log('✅ Added to offline queue');
      return { success: true };
    }

    console.log('✅ ONLINE - Starting photo upload...');
    const photoUrls = await uploadPODPhotos(podData.booking_id, podData.photos);
    console.log('✅ Photos uploaded successfully, URLs count:', photoUrls.length);

    console.log('Inserting POD record into biz_booking_pods table...');
    const { error } = await supabase
      .from('biz_booking_pods')
      .insert({
        booking_id: podData.booking_id,
        miles_ref: podData.miles_ref,
        photo_urls: photoUrls,
        client_name: podData.client_name,
        id_card: podData.id_card,
        signature_base64: podData.signature_base64,
        delivered_date: podData.delivered_date,
        delivered_time: podData.delivered_time,
        captured_by: podData.captured_by,
        sync_status: 'completed',
        bizhandle_synced: false,
      });

    if (error) {
      console.error('❌ Database insert error:', error);
      throw error;
    }

    console.log('✅ POD record inserted successfully');
    console.log('=== savePOD COMPLETE ===\n');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Save POD error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });
    
    console.log('Adding to offline queue as fallback...');
    await addToOfflineQueue({
      booking_id: podData.booking_id,
      miles_ref: podData.miles_ref,
      photos: podData.photos,
      client_name: podData.client_name,
      id_card: podData.id_card,
      signature_base64: podData.signature_base64,
      delivered_date: podData.delivered_date,
      delivered_time: podData.delivered_time,
      status_id: 0,
      created_at: new Date().toISOString(),
    });
    console.log('✅ Added to offline queue');

    return { success: true };
  }
};

export const syncOfflinePODs = async (): Promise<void> => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      return;
    }

    const offlinePODs = await getOfflineQueue();

    for (const pod of offlinePODs) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No authenticated user for offline sync');
          continue;
        }

        const photoUrls = await uploadPODPhotos(pod.booking_id, pod.photos);

        const { error } = await supabase
          .from('biz_booking_pods')
          .insert({
            booking_id: pod.booking_id,
            miles_ref: pod.miles_ref,
            photo_urls: photoUrls,
            client_name: pod.client_name,
            id_card: pod.id_card,
            signature_base64: pod.signature_base64,
            delivered_date: pod.delivered_date,
            delivered_time: pod.delivered_time,
            captured_by: user.id,
            sync_status: 'completed',
            bizhandle_synced: false,
          });

        if (!error && pod.id) {
          await removeFromOfflineQueue(pod.id);
        }
      } catch (error) {
        console.error('Error syncing offline POD:', error);
      }
    }
  } catch (error) {
    console.error('Offline sync error:', error);
  }
};