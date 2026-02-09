import { supabase } from '../lib/supabase';
import { supabaseBizhandle } from './bizhandleClient';
import { AssignedRunsheet, RunsheetBooking, BookingStatusMap, RouteOptimizationData } from '../utils/runsheetTypes';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fleet-staging.milesxp.com';

export async function fetchAssignedRunsheets(dateFrom: string, dateTo: string): Promise<AssignedRunsheet[]> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('Not authenticated');
        }

        const driverId = session.user.id;

        const startOfDay = `${dateFrom}T00:00:00Z`;
        const endOfDay = `${dateTo}T23:59:59Z`;

        const { data, error } = await supabase
            .from('runsheet_assignments_app')
            .select(`
                id,
                runsheet_id,
                driver_id,
                assigned_at,
                assigned_by,
                status,
                is_optimized,
                optimization_id,
                created_at,
                updated_at,
                runsheet:runsheet_generator (
                    id,
                    staff_id,
                    staff_name,
                    date_from,
                    date_to,
                    csv_data,
                    report_type,
                    report_subtype,
                    created_at,
                    updated_at
                )
            `)
            .eq('driver_id', driverId)
            .gte('assigned_at', startOfDay)
            .lte('assigned_at', endOfDay)
            .order('assigned_at', { ascending: false });

        if (error) {
            throw error;
        }

        const processedData = (data || []).map(item => ({
            ...item,
            is_optimized: item.is_optimized || false,
            optimization_id: item.optimization_id || null
        }));

        return processedData as AssignedRunsheet[];
    } catch (error: any) {
        console.error('Error fetching assigned runsheets:', error);
        throw new Error(error.message || 'Failed to fetch runsheets');
    }
}

export async function fetchRunsheetDetail(runsheetId: string): Promise<AssignedRunsheet> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('Not authenticated');
        }

        const driverId = session.user.id;

        const { data, error } = await supabase
            .from('runsheet_assignments_app')
            .select(`
                id,
                runsheet_id,
                driver_id,
                assigned_at,
                assigned_by,
                status,
                is_optimized,
                optimization_id,
                created_at,
                updated_at,
                runsheet:runsheet_generator (
                    id,
                    staff_id,
                    staff_name,
                    date_from,
                    date_to,
                    csv_data,
                    report_type,
                    report_subtype,
                    created_at,
                    updated_at
                )
            `)
            .eq('driver_id', driverId)
            .eq('runsheet_id', runsheetId)
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error('Runsheet not found');
        }

        const processedData = {
            ...data,
            is_optimized: data.is_optimized || false,
            optimization_id: data.optimization_id || null
        };

        return processedData as AssignedRunsheet;
    } catch (error: any) {
        console.error('Error fetching runsheet detail:', error);
        throw new Error(error.message || 'Failed to fetch runsheet detail');
    }
}

/**
 * Fetch route optimization data by optimization_id (NOT runsheet_id)
 * The optimization_id is stored in runsheet_assignments_app when "Assign Optimized" is clicked
 */
export async function fetchRouteOptimization(optimizationId: string): Promise<RouteOptimizationData | null> {
    try {
        console.log('[fetchRouteOptimization] Fetching optimization by ID:', optimizationId);
        
        const { data, error } = await supabase
            .from('route_optimizations')
            .select(`
                id,
                runsheet_id,
                optimized_stops,
                failed_stops,
                total_distance_km,
                total_duration_minutes,
                cluster_count,
                departure_time,
                status,
                created_at,
                updated_at
            `)
            .eq('id', optimizationId)
            .eq('status', 'completed')
            .single();

        if (error) {
            console.error('[fetchRouteOptimization] Error:', error);
            return null;
        }

        console.log('[fetchRouteOptimization] Found optimization:', {
            id: data?.id,
            status: data?.status,
            stops_count: data?.optimized_stops?.length || 0,
            distance: data?.total_distance_km,
            duration: data?.total_duration_minutes
        });

        return data as RouteOptimizationData;
    } catch (error: any) {
        console.error('[fetchRouteOptimization] Exception:', error);
        return null;
    }
}

export async function updateRunsheetStatus(assignmentId: string, status: 'viewed' | 'acknowledged'): Promise<void> {
    try {
        const { error } = await supabase
            .from('runsheet_assignments_app')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', assignmentId);

        if (error) {
            throw error;
        }
    } catch (error: any) {
        console.error('Error updating runsheet status:', error);
        throw new Error(error.message || 'Failed to update status');
    }
}

export async function fetchBookingStatuses(
    bookings: RunsheetBooking[],
    originalStaffId: string
): Promise<BookingStatusMap> {
    try {
        if (bookings.length === 0) {
            return {};
        }

        const milesRefs = bookings.map(b => `'${b.miles_ref}'`).join(',');

        const lookupQuery = `
SELECT 
    b.booking_id,
    b.miles_ref
FROM miles_production.booking b
WHERE b.miles_ref IN (${milesRefs})
    AND b.deleted_at IS NULL
LIMIT 500
        `;

        const { data: lookupData, error: lookupError } = await supabaseBizhandle.rpc('execute_sql', {
            sql: lookupQuery
        });

        if (lookupError || !lookupData || lookupData.length === 0) {
            console.error('Error looking up booking IDs:', lookupError);
            return {};
        }

        const refToIdMap: { [key: string]: number } = {};
        lookupData.forEach((row: any) => {
            refToIdMap[row.miles_ref] = row.booking_id;
        });

        const bookingIds = Object.values(refToIdMap);

        if (bookingIds.length === 0) {
            return {};
        }

        const bookingIdsStr = bookingIds.join(',');

        const statusQuery = `
SELECT DISTINCT ON (bs.booking_id)
    bs.booking_id,
    bs.status_id,
    s.name as status_name,
    bs.staff_id,
    CONCAT(staff.name, ' ', staff.surname) as staff_name,
    bs.delivered_date,
    bs.delivered_time
FROM miles_production.booking_status bs
LEFT JOIN miles_production.status s ON s.status_id = bs.status_id
LEFT JOIN miles_production.staff staff ON staff.staff_id = bs.staff_id
WHERE bs.booking_id IN (${bookingIdsStr})
    AND bs.deleted_at IS NULL
    AND bs.status_id >= 41
ORDER BY bs.booking_id, bs.delivered_date DESC, bs.delivered_time DESC, bs.booking_status_id DESC
        `;

        const { data: statusData, error: statusError } = await supabaseBizhandle.rpc('execute_sql', {
            sql: statusQuery
        });

        if (statusError) {
            console.error('Error fetching booking statuses:', statusError);
            return {};
        }

        const statusMap: BookingStatusMap = {};

        (statusData || []).forEach((row: any) => {
            const milesRef = Object.keys(refToIdMap).find(
                ref => refToIdMap[ref] === row.booking_id
            );

            if (milesRef) {
                const showStaffName = row.staff_id !== originalStaffId;

                statusMap[milesRef] = {
                    booking_id: row.booking_id,
                    status_id: row.status_id,
                    status_name: row.status_name || 'Unknown Status',
                    staff_id: row.staff_id,
                    staff_name: showStaffName ? (row.staff_name || 'Unknown') : '',
                    delivered_date: row.delivered_date,
                    delivered_time: row.delivered_time
                };
            }
        });

        return statusMap;
    } catch (error: any) {
        console.error('Error in fetchBookingStatuses:', error);
        return {};
    }
}