import { useCallback, useEffect, useState } from 'react';
import { getAssignedVehicle, getCurrentFuelPrice } from './fuelService';
import { Vehicle } from '../utils/types';

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