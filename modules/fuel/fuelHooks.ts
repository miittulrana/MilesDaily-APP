import { useCallback, useEffect, useState } from 'react';
import { getFuelRecords, getFuelStats, getAssignedVehicle as getVehicle, getCurrentFuelPrice } from './fuelService';
import { FuelRecord, FuelStats, Vehicle } from './fuelTypes';

export const useFuelRecords = (driverId: string) => {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!driverId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getFuelRecords(driverId);
      
      // Sort records by date (newest first)
      const sortedRecords = [...data].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setRecords(sortedRecords);
    } catch (err) {
      console.error('Error in useFuelRecords:', err);
      setError('Failed to load fuel records');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
};

export const useAssignedVehicle = (driverId: string) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    if (!driverId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getVehicle(driverId);
      setVehicle(data);
    } catch (err) {
      console.error('Error in useAssignedVehicle:', err);
      setError('Failed to load assigned vehicle');
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
      console.error('Error in useFuelPrice:', err);
      setError('Failed to load fuel price');
    } finally {
      setLoading(false);
    }
  }, [fuelType]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return { price, loading, error, refetch: fetchPrice };
};

export const useFuelStats = (driverId: string) => {
  const [stats, setStats] = useState<FuelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!driverId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getFuelStats(driverId);
      setStats(data);
    } catch (err) {
      console.error('Error in useFuelStats:', err);
      setError('Failed to load fuel statistics');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};