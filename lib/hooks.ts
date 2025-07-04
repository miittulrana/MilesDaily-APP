import { useCallback, useEffect, useState } from 'react';
import { getAssignedVehicle, getCurrentFuelPrice } from './fuelService';
import { fetchDriverWashSchedules } from './washService';
import { Vehicle, WashSchedule } from '../utils/types';

export const useAssignedVehicle = (driverId: string) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    if (!driverId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getAssignedVehicle(driverId);
      setVehicle(data);
    } catch (err) {
      setError('Failed to load assigned vehicle');
      console.error('Error in useAssignedVehicle:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  return { vehicle, loading, error, refetch: fetchVehicle };
};

export const useFuelPrice = (fuelType: string) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!fuelType) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getCurrentFuelPrice(fuelType);
      setPrice(data);
    } catch (err) {
      setError('Failed to load fuel price');
      console.error('Error in useFuelPrice:', err);
    } finally {
      setLoading(false);
    }
  }, [fuelType]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return { price, loading, error, refetch: fetchPrice };
};

export const useWashSchedules = (driverId: string, vehicleId: string, date: string) => {
  const [schedules, setSchedules] = useState<WashSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (!driverId || !vehicleId || !date) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDriverWashSchedules(driverId, vehicleId, date);
      setSchedules(data);
    } catch (err) {
      setError('Failed to load wash schedules');
      console.error('Error in useWashSchedules:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId, vehicleId, date]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return { schedules, loading, error, refetch: fetchSchedules };
};