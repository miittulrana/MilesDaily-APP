import { supabase, supabaseQuery, withRetry } from './supabase';
import { supabaseBizhandle, bizhandleRpcWithRetry } from './bizhandleClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DriverPickupAssignment {
    id: string;
    booking_id: number;
    miles_ref: string;
    driver_id: string;
    assigned_by_email: string;
    pickup_date: string;
    message: string | null;
    is_urgent: boolean;
    status: 'assigned' | 'completed' | 'transfer_requested' | 'transferred' | 'cancelled';
    transfer_reason: string | null;
    transfer_requested_at: string | null;
    completed_at: string | null;
    created_at: string;
    // Enriched from BizHandle
    shipper_company?: string;
    shipper_locality?: string;
    shipper_contact_no?: string;
    shipper_address_1?: string;
    consignee_company?: string;
    consignee_locality?: string;
    consignee_country?: string;
    collection_time_from?: string;
    collection_time_to?: string;
    service_level?: string;
    current_status_id?: number;
    current_status_name?: string;
    total_pieces?: number;
    total_weight?: number;
}

// Fetch active assignments for a driver on a given date
export const fetchDriverAssignments = async (
    driverId: string,
    date: string
): Promise<{ assigned: DriverPickupAssignment[]; completed: DriverPickupAssignment[] }> => {
    try {
        const { data, error } = await supabaseQuery<any[]>(async (client) => {
            return await client
                .from('pickup_assignments')
                .select('*')
                .eq('driver_id', driverId)
                .eq('pickup_date', date)
                .in('status', ['assigned', 'completed', 'transfer_requested'])
                .order('created_at', { ascending: false });
        });

        if (error || !data) {
            console.error('Error fetching assignments:', error);
            return { assigned: [], completed: [] };
        }

        // Fetch booking details from BizHandle for all booking IDs
        const bookingIds = data.map((a: any) => a.booking_id);
        const enriched = await enrichWithBizHandleData(data, bookingIds);

        const assigned = enriched.filter(a => a.status === 'assigned' || a.status === 'transfer_requested');
        const completed = enriched.filter(a => a.status === 'completed');

        return { assigned, completed };
    } catch (err) {
        console.error('fetchDriverAssignments error:', err);
        return { assigned: [], completed: [] };
    }
};

// Fetch assignment history for date range
export const fetchAssignmentHistory = async (
    driverId: string,
    dateFrom: string,
    dateTo: string
): Promise<DriverPickupAssignment[]> => {
    try {
        const { data, error } = await supabaseQuery<any[]>(async (client) => {
            return await client
                .from('pickup_assignments')
                .select('*')
                .eq('driver_id', driverId)
                .gte('pickup_date', dateFrom)
                .lte('pickup_date', dateTo)
                .order('created_at', { ascending: false });
        });

        if (error || !data) return [];

        const bookingIds = data.map((a: any) => a.booking_id);
        return await enrichWithBizHandleData(data, bookingIds);
    } catch (err) {
        console.error('fetchAssignmentHistory error:', err);
        return [];
    }
};

// Request transfer (driver side)
export const requestTransfer = async (assignmentId: string, reason: string): Promise<boolean> => {
    try {
        const { error } = await supabaseQuery(async (client) => {
            return await client
                .from('pickup_assignments')
                .update({
                    status: 'transfer_requested',
                    transfer_reason: reason,
                    transfer_requested_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', assignmentId)
                .eq('status', 'assigned');
        });

        if (error) {
            console.error('Request transfer error:', error);
            return false;
        }

        // Also log it
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        if (userId) {
            // Get assignment details for logging
            const { data: assignment } = await supabaseQuery<any>(async (client) => {
                return await client
                    .from('pickup_assignments')
                    .select('booking_id, miles_ref, driver_id')
                    .eq('id', assignmentId)
                    .single();
            });

            if (assignment) {
                await supabaseQuery(async (client) => {
                    return await client.from('pickup_assignment_logs').insert({
                        booking_id: assignment.booking_id,
                        miles_ref: assignment.miles_ref,
                        action: 'transfer_requested',
                        from_driver_id: assignment.driver_id,
                        performed_by: userId,
                        performed_by_email: user.data.user?.email || '',
                        reason
                    });
                });
            }
        }

        return true;
    } catch (err) {
        console.error('requestTransfer error:', err);
        return false;
    }
};

// Check if any assigned bookings have been picked up (status_id 29)
// Called every 5 seconds from the polling loop
export const checkPickedUpStatus = async (assignments: DriverPickupAssignment[]): Promise<number[]> => {
    const activeAssignments = assignments.filter(a => a.status === 'assigned');
    if (activeAssignments.length === 0) return [];

    const bookingIds = activeAssignments.map(a => a.booking_id);

    try {
        const query = `
SELECT DISTINCT b.booking_id
FROM miles_production.booking b
INNER JOIN miles_production.booking_status bs ON b.booking_id = bs.booking_id
WHERE b.booking_id IN (${bookingIds.join(',')})
  AND bs.status_id = 29
  AND bs.deleted_at IS NULL
        `;

        const { data, error } = await bizhandleRpcWithRetry('execute_sql', { sql: query });

        if (error || !data) return [];

        return (data as any[]).map(row => row.booking_id);
    } catch (err) {
        console.error('checkPickedUpStatus error:', err);
        return [];
    }
};

// Mark assignments as completed for picked-up bookings
export const markAssignmentsCompleted = async (bookingIds: number[]): Promise<void> => {
    if (bookingIds.length === 0) return;

    try {
        for (const bookingId of bookingIds) {
            await supabaseQuery(async (client) => {
                return await client
                    .from('pickup_assignments')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('booking_id', bookingId)
                    .eq('status', 'assigned');
            });
        }
    } catch (err) {
        console.error('markAssignmentsCompleted error:', err);
    }
};

// Supabase Realtime subscription for new assignments
let realtimeChannel: RealtimeChannel | null = null;

export const subscribeToAssignments = (
    driverId: string,
    onNewAssignment: () => void,
    onStatusChange: () => void
): (() => void) => {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }

    realtimeChannel = supabase
        .channel(`pickup_assignments_${driverId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'pickup_assignments',
                filter: `driver_id=eq.${driverId}`
            },
            () => {
                console.log('[Realtime] New assignment received');
                onNewAssignment();
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'pickup_assignments',
                filter: `driver_id=eq.${driverId}`
            },
            () => {
                console.log('[Realtime] Assignment updated');
                onStatusChange();
            }
        )
        .subscribe();

    return () => {
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
    };
};

// Enrich assignment data with booking info from BizHandle
async function enrichWithBizHandleData(
    assignments: any[],
    bookingIds: number[]
): Promise<DriverPickupAssignment[]> {
    if (bookingIds.length === 0) return assignments;

    try {
        const query = `
SELECT 
  b.booking_id,
  COALESCE(NULLIF(TRIM(shipper.company), ''), shipper.contact_name) as shipper_company,
  COALESCE(shipper.custom_city, shipper_city.name) as shipper_locality,
  shipper.contact_no as shipper_contact_no,
  shipper.address_1 as shipper_address_1,
  COALESCE(NULLIF(TRIM(consignee.company), ''), consignee.contact_name) as consignee_company,
  COALESCE(consignee.custom_city, consignee_city.name) as consignee_locality,
  consignee_country.name as consignee_country,
  bt.time_from as collection_time_from,
  bt.time_to as collection_time_to,
  sl.name as service_level,
  be.total_pieces,
  be.total_weight,
  latest_status.status_id as current_status_id,
  latest_status.status_name as current_status_name
FROM miles_production.booking b
LEFT JOIN miles_production.booking_timeframe bt ON b.booking_id = bt.booking_id AND bt.type IN ('collection', 'am')
LEFT JOIN miles_production.service_level sl ON b.service_level_id = sl.service_level_id
LEFT JOIN miles_production.prev_address shipper ON b.shipper_prev_address_id = shipper.prev_address_id
LEFT JOIN miles_production.prev_address consignee ON b.consignee_prev_address_id = consignee.prev_address_id
LEFT JOIN miles_production.city shipper_city ON shipper.city_id = shipper_city.city_id
LEFT JOIN miles_production.city consignee_city ON consignee.city_id = consignee_city.city_id
LEFT JOIN miles_production.country consignee_country ON consignee.country_id = consignee_country.country_id
LEFT JOIN miles_production.booking_extra be ON b.booking_id = be.booking_id
INNER JOIN LATERAL (
  SELECT bs.status_id, s.name as status_name
  FROM miles_production.booking_status bs
  LEFT JOIN miles_production.status s ON s.status_id = bs.status_id
  WHERE bs.booking_id = b.booking_id AND bs.deleted_at IS NULL
  ORDER BY bs.delivered_date DESC, bs.delivered_time DESC, bs.updated_at DESC
  LIMIT 1
) latest_status ON true
WHERE b.booking_id IN (${bookingIds.join(',')})
  AND b.deleted_at IS NULL
        `;

        const { data: bhData } = await bizhandleRpcWithRetry('execute_sql', { sql: query });

        const bhMap = new Map<number, any>();
        (bhData || []).forEach((row: any) => bhMap.set(row.booking_id, row));

        return assignments.map((a: any) => {
            const bh = bhMap.get(a.booking_id);
            return {
                ...a,
                shipper_company: bh?.shipper_company || '',
                shipper_locality: bh?.shipper_locality || '',
                shipper_contact_no: bh?.shipper_contact_no || '',
                shipper_address_1: bh?.shipper_address_1 || '',
                consignee_company: bh?.consignee_company || '',
                consignee_locality: bh?.consignee_locality || '',
                consignee_country: bh?.consignee_country || '',
                collection_time_from: bh?.collection_time_from || '',
                collection_time_to: bh?.collection_time_to || '',
                service_level: bh?.service_level || '',
                current_status_id: bh?.current_status_id,
                current_status_name: bh?.current_status_name || '',
                total_pieces: bh?.total_pieces || 0,
                total_weight: bh?.total_weight || 0
            };
        });
    } catch (err) {
        console.error('enrichWithBizHandleData error:', err);
        return assignments;
    }
}