import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { getDriverInfo } from '../../../lib/auth';

interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  type: string;
  is_available: boolean;
  current_session?: any;
}

interface ActiveSession {
  id: string;
  vehicle_id: string;
  punch_in_at: string;
  vehicle?: Vehicle;
}

export default function TruckLogScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [driverId, setDriverId] = useState<string | null>(null);

  useEffect(() => {
    initializeDriver();
  }, []);

  useEffect(() => {
    if (driverId) {
      loadVehicles();
      loadActiveSession();
    }
  }, [driverId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeSession) {
      interval = setInterval(() => {
        const startTime = new Date(activeSession.punch_in_at);
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const initializeDriver = async () => {
    try {
      const driver = await getDriverInfo();
      if (driver?.id) {
        setDriverId(driver.id);
      }
    } catch (error) {
      console.error('Error getting driver info:', error);
    }
  };

  const loadVehicles = async () => {
    if (!driverId) return;
    
    try {
      const { data: assignments, error } = await supabase
        .from('truck_log_assignments')
        .select(`
          id,
          vehicle:vehicles(id, license_plate, brand, model, type)
        `)
        .eq('driver_id', driverId);

      if (error) {
        console.error('Error loading assignments:', error);
        return;
      }

      const vehicleList = [];
      for (const assignment of assignments || []) {
        if (assignment.vehicle) {
          const { data: activeSessionData } = await supabase
            .from('truck_log_sessions')
            .select('id, driver_id')
            .eq('vehicle_id', assignment.vehicle.id)
            .eq('is_active', true)
            .single();

          const isAvailable = !activeSessionData;
          
          vehicleList.push({
            ...assignment.vehicle,
            is_available: isAvailable,
            current_session: activeSessionData || null
          });
        }
      }
      
      setVehicles(vehicleList);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadActiveSession = async () => {
    if (!driverId) return;
    
    try {
      const { data: session, error } = await supabase
        .from('truck_log_sessions')
        .select(`
          *,
          vehicle:vehicles(id, license_plate, brand, model, type)
        `)
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .single();
      
      if (!error && session) {
        setActiveSession(session);
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  };

  const handlePunchIn = async (vehicle: Vehicle) => {
    if (!vehicle.is_available) {
      Alert.alert('Vehicle Unavailable', 'This vehicle is currently in use by another driver.');
      return;
    }

    if (!driverId) {
      Alert.alert('Error', 'Driver information not available');
      return;
    }

    try {
      setLoading(true);
      
      const { data: assignment } = await supabase
        .from('truck_log_assignments')
        .select('id')
        .eq('driver_id', driverId)
        .eq('vehicle_id', vehicle.id)
        .single();

      if (!assignment) {
        Alert.alert('Error', 'Vehicle not assigned to you');
        return;
      }

      const { data: existingActive } = await supabase
        .from('truck_log_sessions')
        .select('id')
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .single();

      if (existingActive) {
        Alert.alert('Error', 'You already have an active session');
        return;
      }

      const { data: vehicleInUse } = await supabase
        .from('truck_log_sessions')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .eq('is_active', true)
        .single();

      if (vehicleInUse) {
        Alert.alert('Error', 'Vehicle is currently in use by another driver');
        return;
      }

      const { data: newSession, error } = await supabase
        .from('truck_log_sessions')
        .insert({
          assignment_id: assignment.id,
          driver_id: driverId,
          vehicle_id: vehicle.id,
          punch_in_at: new Date().toISOString()
        })
        .select(`
          *,
          vehicle:vehicles(id, license_plate, brand, model, type)
        `)
        .single();

      if (error) {
        Alert.alert('Error', 'Failed to punch in');
        return;
      }

      setActiveSession(newSession);
      loadVehicles();
      Alert.alert('Success', `Punched in to ${vehicle.license_plate}`);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while punching in');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!activeSession) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('truck_log_sessions')
        .update({
          punch_out_at: new Date().toISOString()
        })
        .eq('id', activeSession.id);

      if (error) {
        Alert.alert('Error', 'Failed to punch out');
        return;
      }

      setActiveSession(null);
      setElapsedTime('00:00:00');
      loadVehicles();
      Alert.alert('Success', 'Punched out successfully');
    } catch (error) {
      Alert.alert('Error', 'An error occurred while punching out');
    } finally {
      setLoading(false);
    }
  };

  if (activeSession) {
    return (
      <View style={truckLogStyles.container}>
        <View style={truckLogStyles.header}>
          <Text style={truckLogStyles.headerTitle}>Active Session</Text>
          <Text style={truckLogStyles.headerSubtitle}>Currently working</Text>
        </View>
        
        <View style={truckLogStyles.activeSessionContainer}>
          <View style={truckLogStyles.activeSessionCard}>
            <View style={truckLogStyles.statusIndicator} />
            
            <Text style={truckLogStyles.vehicleName}>
              {activeSession.vehicle?.license_plate || 'Unknown'}
            </Text>
            <Text style={truckLogStyles.vehicleDetails}>
              {activeSession.vehicle?.brand} {activeSession.vehicle?.model}
            </Text>
            
            <Text style={truckLogStyles.timeDisplay}>{elapsedTime}</Text>
            <Text style={truckLogStyles.timeLabel}>Time Elapsed</Text>
            
            <TouchableOpacity
              style={truckLogStyles.punchOutButton}
              onPress={handlePunchOut}
              disabled={loading}
            >
              <Text style={truckLogStyles.punchOutText}>
                {loading ? 'Ending...' : 'End Session'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={truckLogStyles.container}>
      <View style={truckLogStyles.header}>
        <Text style={truckLogStyles.headerTitle}>Start Session</Text>
        <Text style={truckLogStyles.headerSubtitle}>Select your vehicle</Text>
      </View>

      <ScrollView style={truckLogStyles.vehicleList}>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              truckLogStyles.vehicleCard,
              !vehicle.is_available && truckLogStyles.vehicleCardDisabled
            ]}
            onPress={() => handlePunchIn(vehicle)}
            disabled={!vehicle.is_available || loading}
          >
            <View style={truckLogStyles.vehicleHeader}>
              <View>
                <Text style={truckLogStyles.vehiclePlate}>{vehicle.license_plate}</Text>
                <Text style={truckLogStyles.vehicleDescription}>
                  {vehicle.brand} {vehicle.model}
                </Text>
                <Text style={truckLogStyles.vehicleType}>{vehicle.type}</Text>
              </View>
              
              <View style={[
                truckLogStyles.statusBadge,
                vehicle.is_available ? truckLogStyles.availableBadge : truckLogStyles.unavailableBadge
              ]}>
                <Text style={[
                  truckLogStyles.statusText,
                  vehicle.is_available ? truckLogStyles.availableText : truckLogStyles.unavailableText
                ]}>
                  {vehicle.is_available ? 'Available' : 'In Use'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {vehicles.length === 0 && (
        <View style={truckLogStyles.emptyState}>
          <Ionicons name="car-outline" size={80} color="#d1d5db" style={truckLogStyles.emptyIcon} />
          <Text style={truckLogStyles.emptyTitle}>No Vehicles</Text>
          <Text style={truckLogStyles.emptyMessage}>
            No vehicles have been assigned to your account. Please contact your supervisor.
          </Text>
        </View>
      )}
    </View>
  );
}

const truckLogStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
  },
  activeSessionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  activeSessionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    marginBottom: 16,
  },
  vehicleName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  vehicleDetails: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 40,
    textAlign: 'center',
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: '300',
    color: '#ff6b00',
    fontFamily: 'monospace',
    marginBottom: 12,
    letterSpacing: 2,
  },
  timeLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 40,
  },
  punchOutButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  punchOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  vehicleList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  vehicleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#f8fafc',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehiclePlate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  vehicleDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  availableBadge: {
    backgroundColor: '#dcfce7',
  },
  unavailableBadge: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  availableText: {
    color: '#16a34a',
  },
  unavailableText: {
    color: '#dc2626',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeSessionCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  timeDisplay: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ff6b00',
    fontFamily: 'monospace',
  },
  startTime: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  punchOutButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  punchOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleList: {
    flex: 1,
    padding: 20,
  },
  vehicleCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  vehicleStatus: {
    alignItems: 'flex-end',
  },
  availableStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  unavailableStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unavailableText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});