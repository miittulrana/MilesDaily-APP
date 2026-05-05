import { supabase, supabaseQuery, withRetry } from './supabase';
import { supabaseBizhandle, bizhandleRpcWithRetry } from './bizhandleClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PickupItem {
    description: string;
    pieces: number;
    weight: number;
    length: number;
    height: number;
    width: number;
}

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
    service_level_id: number | null;
    service_level: string;
    is_export: boolean;
    collection_date: string | null;
    collection_time_from: string | null;
    collection_time_to: string | null;
    shipper_company: string;
    shipper_contact_name: string;
    shipper_address_1: string;
    shipper_address_2: string;
    shipper_locality: string;
    shipper_post_code: string;
    shipper_country: string;
    shipper_contact_no: string;
    shipper_email: string;
    consignee_company: string;
    consignee_contact_name: string;
    consignee_address_1: string;
    consignee_address_2: string;
    consignee_locality: string;
    consignee_post_code: string;
    consignee_country: string;
    consignee_contact_no: string;
    total_pieces: number;
    total_weight: number;
    items: PickupItem[];
    special_instruction: string;
    current_status_id?: number;
    current_status_name?: string;
}

export interface GroupedPickupAssignment {
    key: string;
    shipper_company: string;
    shipper_locality: string;
    assignments: DriverPickupAssignment[];
    totalPieces: number;
    totalWeight: number;
    hasUrgent: boolean;
    hasTransferRequested: boolean;
}

const ASSIGNMENT_SELECT = `
    id, booking_id, miles_ref, driver_id, assigned_by_email,
    pickup_date, message, is_urgent, status, transfer_reason,
    transfer_requested_at, completed_at, created_at,
    service_level_id, service_level, is_export,
    collection_date, collection_time_from, collection_time_to,
    shipper_company, shipper_contact_name, shipper_address_1, shipper_address_2,
    shipper_locality, shipper_post_code, shipper_country, shipper_contact_no, shipper_email,
    consignee_company, consignee_contact_name, consignee_address_1, consignee_address_2,
    consignee_locality, consignee_post_code, consignee_country, consignee_contact_no,
    total_pieces, total_weight, items, special_instruction
`;

function mapAssignment(row: any): DriverPickupAssignment {
    return {
        id: row.id,
        booking_id: row.booking_id,
        miles_ref: row.miles_ref,
        driver_id: row.driver_id,
        assigned_by_email: row.assigned_by_email || '',
        pickup_date: row.pickup_date,
        message: row.message,
        is_urgent: row.is_urgent || false,
        status: row.status,
        transfer_reason: row.transfer_reason,
        transfer_requested_at: row.transfer_requested_at,
        completed_at: row.completed_at,
        created_at: row.created_at,
        service_level_id: row.service_level_id || null,
        service_level: row.service_level || '',
        is_export: row.is_export || false,
        collection_date: row.collection_date || null,
        collection_time_from: row.collection_time_from || null,
        collection_time_to: row.collection_time_to || null,
        shipper_company: row.shipper_company || '',
        shipper_contact_name: row.shipper_contact_name || '',
        shipper_address_1: row.shipper_address_1 || '',
        shipper_address_2: row.shipper_address_2 || '',
        shipper_locality: row.shipper_locality || '',
        shipper_post_code: row.shipper_post_code || '',
        shipper_country: row.shipper_country || '',
        shipper_contact_no: row.shipper_contact_no || '',
        shipper_email: row.shipper_email || '',
        consignee_company: row.consignee_company || '',
        consignee_contact_name: row.consignee_contact_name || '',
        consignee_address_1: row.consignee_address_1 || '',
        consignee_address_2: row.consignee_address_2 || '',
        consignee_locality: row.consignee_locality || '',
        consignee_post_code: row.consignee_post_code || '',
        consignee_country: row.consignee_country || '',
        consignee_contact_no: row.consignee_contact_no || '',
        total_pieces: row.total_pieces || 0,
        total_weight: row.total_weight || 0,
        items: Array.isArray(row.items) ? row.items : [],
        special_instruction: row.special_instruction || '',
    };
}

/** Group assignments by shipper + date + service level (same logic as web) */
export function groupAssignments(assignments: DriverPickupAssignment[]): {
    grouped: GroupedPickupAssignment[];
    singles: DriverPickupAssignment[];
} {
    const groupMap = new Map<string, DriverPickupAssignment[]>();

    assignments.forEach(a => {
        const key = `${a.shipper_company}_${a.collection_date}_${a.service_level}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(a);
    });

    const grouped: GroupedPickupAssignment[] = [];
    const singles: DriverPickupAssignment[] = [];

    groupMap.forEach((items, key) => {
        if (items.length > 1) {
            grouped.push({
                key,
                shipper_company: items[0].shipper_company,
                shipper_locality: items[0].shipper_locality,
                assignments: items,
                totalPieces: items.reduce((s, a) => s + a.total_pieces, 0),
                totalWeight: items.reduce((s, a) => s + a.total_weight, 0),
                hasUrgent: items.some(a => a.is_urgent),
                hasTransferRequested: items.some(a => a.status === 'transfer_requested'),
            });
        } else {
            singles.push(items[0]);
        }
    });

    return { grouped, singles };
}

export const fetchDriverAssignments = async (
    driverId: string,
    date: string
): Promise<{ assigned: DriverPickupAssignment[]; completed: DriverPickupAssignment[] }> => {
    try {
        const { data: activeData, error: activeError } = await supabaseQuery<any[]>(async (client) => {
            return await client
                .from('pickup_assignments')
                .select(ASSIGNMENT_SELECT)
                .eq('driver_id', driverId)
                .in('status', ['assigned', 'transfer_requested'])
                .order('created_at', { ascending: false });
        });

        const { data: completedData, error: completedError } = await supabaseQuery<any[]>(async (client) => {
            return await client
                .from('pickup_assignments')
                .select(ASSIGNMENT_SELECT)
                .eq('driver_id', driverId)
                .eq('pickup_date', date)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false });
        });

        if (activeError) console.error('Error fetching active assignments:', activeError);
        if (completedError) console.error('Error fetching completed assignments:', completedError);

        const assigned = (activeData || []).map(mapAssignment);
        const completed = (completedData || []).map(mapAssignment);

        return { assigned, completed };
    } catch (err) {
        console.error('fetchDriverAssignments error:', err);
        return { assigned: [], completed: [] };
    }
};

export const fetchAssignmentHistory = async (
    driverId: string,
    dateFrom: string,
    dateTo: string
): Promise<DriverPickupAssignment[]> => {
    try {
        const { data, error } = await supabaseQuery<any[]>(async (client) => {
            return await client
                .from('pickup_assignments')
                .select(ASSIGNMENT_SELECT)
                .eq('driver_id', driverId)
                .gte('pickup_date', dateFrom)
                .lte('pickup_date', dateTo)
                .order('created_at', { ascending: false });
        });

        if (error || !data) return [];

        return data.map(mapAssignment);
    } catch (err) {
        console.error('fetchAssignmentHistory error:', err);
        return [];
    }
};

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

        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        if (userId) {
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
  AND bs.status_id = 28
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