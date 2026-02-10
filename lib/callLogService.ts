import { supabase } from './supabase';

interface CallLogParams {
    miles_ref: string;
    hawb: string | null;
    contact_name: string;
    mobile_number: string;
    driver_name: string;
}

export async function logBookingCall(params: CallLogParams): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('booking_call_logs')
            .insert({
                miles_ref: params.miles_ref,
                hawb: params.hawb || null,
                contact_name: params.contact_name,
                mobile_number: params.mobile_number,
                driver_name: params.driver_name,
                called_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error logging call:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Exception logging call:', err);
        return { success: false, error: err.message || 'Failed to log call' };
    }
}