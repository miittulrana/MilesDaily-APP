import { supabase } from './supabase';
import { CompressedImage } from './imageCompression';
import * as FileSystem from 'expo-file-system/legacy';

export interface StatusNote {
    id?: string;
    booking_id: number;
    miles_ref: string;
    status_id: number;
    reason: string;
    pieces_missing?: number;
    captured_by: string;
    created_at?: string;
}

export interface CODRecord {
    id?: string;
    booking_id: number;
    miles_ref: string;
    expected_amount?: number;
    collected_amount: number;
    currency: string;
    payment_type: 'cash' | 'online';
    photo_url?: string;
    captured_by: string;
    collected_at?: string;
    created_at?: string;
}

export interface StatusPOD {
    booking_id: number;
    miles_ref: string;
    status_id: number;
    photos: CompressedImage[];
    captured_by: string;
}

const decode = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

export const uploadStatusPhoto = async (
    bookingId: number,
    statusId: number,
    photo: CompressedImage,
    index: number
): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${bookingId}/status_${statusId}_photo_${timestamp}_${index}.jpg`;

    const base64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: 'base64',
    });

    const { data, error } = await supabase.storage
        .from('booking-pods')
        .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: false,
        });

    if (error) {
        throw new Error(`Photo upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('booking-pods')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
};

export const saveStatusPOD = async (podData: StatusPOD): Promise<{ success: boolean; error?: string }> => {
    try {
        const photoUrls: string[] = [];

        for (let i = 0; i < podData.photos.length; i++) {
            const url = await uploadStatusPhoto(
                podData.booking_id,
                podData.status_id,
                podData.photos[i],
                i
            );
            photoUrls.push(url);
        }

        const now = new Date();
        const delivered_date = now.toISOString().split('T')[0];
        const delivered_time = now.toTimeString().split(' ')[0];

        const { error } = await supabase
            .from('biz_booking_pods')
            .insert({
                booking_id: podData.booking_id,
                miles_ref: podData.miles_ref,
                status_id: podData.status_id,
                photo_urls: photoUrls,
                client_name: '',
                id_card: '',
                signature_base64: '',
                delivered_date,
                delivered_time,
                captured_by: podData.captured_by,
                sync_status: 'completed',
                bizhandle_synced: false,
            });

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error saving status POD:', error);
        return { success: false, error: error.message };
    }
};

export const saveStatusNote = async (note: StatusNote): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('biz_booking_status_notes')
            .insert({
                booking_id: note.booking_id,
                miles_ref: note.miles_ref,
                status_id: note.status_id,
                reason: note.reason,
                pieces_missing: note.pieces_missing,
                captured_by: note.captured_by,
            });

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error saving status note:', error);
        return { success: false, error: error.message };
    }
};

export const saveCODRecord = async (record: CODRecord): Promise<{ success: boolean; error?: string }> => {
    try {
        let photoUrl: string | undefined;

        if (record.payment_type === 'online' && (record as any).photo) {
            const photo = (record as any).photo as CompressedImage;
            photoUrl = await uploadStatusPhoto(
                record.booking_id,
                47,
                photo,
                0
            );
        }

        const { error } = await supabase
            .from('biz_booking_cod_records')
            .insert({
                booking_id: record.booking_id,
                miles_ref: record.miles_ref,
                expected_amount: record.expected_amount,
                collected_amount: record.collected_amount,
                currency: record.currency,
                payment_type: record.payment_type,
                photo_url: photoUrl || record.photo_url,
                captured_by: record.captured_by,
                collected_at: new Date().toISOString(),
            });

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error saving COD record:', error);
        return { success: false, error: error.message };
    }
};

export const getStatusNotes = async (bookingId: number): Promise<StatusNote[]> => {
    try {
        const { data, error } = await supabase
            .from('biz_booking_status_notes')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching status notes:', error);
        return [];
    }
};

export const getCODRecords = async (bookingId: number): Promise<CODRecord[]> => {
    try {
        const { data, error } = await supabase
            .from('biz_booking_cod_records')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching COD records:', error);
        return [];
    }
};

export const getStatusPODs = async (bookingId: number, statusId?: number): Promise<any[]> => {
    try {
        let query = supabase
            .from('biz_booking_pods')
            .select('*')
            .eq('booking_id', bookingId);

        if (statusId !== undefined) {
            query = query.eq('status_id', statusId);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching status PODs:', error);
        return [];
    }
};