import { supabase } from './supabase';
import { compressImage, CompressedImage } from './imageCompression';
import * as FileSystem from 'expo-file-system/legacy';

export interface InvoiceScanRequest {
    id: string;
    requester_name: string;
    target_driver_name: string;
    status: string;
    customer_name?: string;
    date_from?: string;
    date_to?: string;
    notes?: string;
    photo_count: number;
    created_at: string;
}

const BUCKET = 'signed-invoice-photos';

/**
 * Check for pending scan requests targeted at this driver's bizhandle_staff_id
 */
export async function fetchPendingScanRequests(bizhandleStaffId: number): Promise<InvoiceScanRequest[]> {
    try {
        const { data, error } = await supabase
            .from('signed_invoice_scan_requests')
            .select('id, requester_name, target_driver_name, status, customer_name, date_from, date_to, notes, photo_count, created_at')
            .eq('target_bizhandle_staff_id', bizhandleStaffId)
            .in('status', ['pending', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Fetch scan requests error:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Fetch scan requests exception:', err);
        return [];
    }
}

/**
 * Mark request as in_progress when driver opens camera
 */
export async function markRequestInProgress(requestId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('signed_invoice_scan_requests')
            .update({
                status: 'in_progress',
                updated_at: new Date().toISOString(),
            })
            .eq('id', requestId);

        return !error;
    } catch {
        return false;
    }
}

/**
 * Update photo count during upload (live progress for webapp)
 */
async function updateUploadProgress(requestId: string, count: number, totalUrls: string[]): Promise<void> {
    try {
        await supabase
            .from('signed_invoice_scan_requests')
            .update({
                status: 'uploading',
                photo_count: count,
                photo_urls: totalUrls,
                updated_at: new Date().toISOString(),
            })
            .eq('id', requestId);
    } catch {
        // Non-critical, continue uploading
    }
}

/**
 * Upload photos one by one with compression, updating progress after each upload.
 * Returns array of public URLs.
 */
export async function uploadScanPhotos(
    requestId: string,
    photos: CompressedImage[],
    onProgress?: (uploaded: number, total: number) => void,
): Promise<{ success: boolean; urls: string[]; error?: string }> {
    const urls: string[] = [];
    const total = photos.length;

    try {
        for (let i = 0; i < total; i++) {
            const photo = photos[i];

            const timestamp = Date.now();
            const fileName = `${requestId}/photo_${timestamp}_${i}.jpg`;

            // Read as base64
            const base64 = await FileSystem.readAsStringAsync(photo.uri, { encoding: 'base64' });

            // Decode to ArrayBuffer
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
                bytes[j] = binaryString.charCodeAt(j);
            }

            // Upload
            const { data, error } = await supabase.storage
                .from(BUCKET)
                .upload(fileName, bytes.buffer, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (error) {
                console.error(`Upload error photo ${i + 1}:`, error);
                // Continue with remaining photos rather than failing entirely
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
            urls.push(urlData.publicUrl);

            // Update progress in DB so webapp sees live count
            await updateUploadProgress(requestId, urls.length, urls);

            // Callback for local UI
            onProgress?.(i + 1, total);
        }

        return { success: urls.length > 0, urls };
    } catch (err: any) {
        console.error('Upload scan photos error:', err);
        return { success: false, urls, error: err.message };
    }
}

/**
 * Mark request as completed with final photo URLs
 */
export async function markRequestCompleted(requestId: string, photoUrls: string[]): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('signed_invoice_scan_requests')
            .update({
                status: 'completed',
                photo_urls: photoUrls,
                photo_count: photoUrls.length,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', requestId);

        return !error;
    } catch {
        return false;
    }
}

/**
 * Mark request as failed
 */
export async function markRequestFailed(requestId: string): Promise<void> {
    try {
        await supabase
            .from('signed_invoice_scan_requests')
            .update({
                status: 'failed',
                updated_at: new Date().toISOString(),
            })
            .eq('id', requestId);
    } catch {
        // Silent
    }
}