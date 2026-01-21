import { supabase } from '../lib/supabase';
import { AssignedRunsheet, RunsheetBooking } from '../utils/runsheetTypes';

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

        return (data || []) as AssignedRunsheet[];
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

        return data as AssignedRunsheet;
    } catch (error: any) {
        console.error('Error fetching runsheet detail:', error);
        throw new Error(error.message || 'Failed to fetch runsheet detail');
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