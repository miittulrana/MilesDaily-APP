import { useCallback, useEffect, useState } from 'react';
import {
  UniformType,
  UniformSize,
  UniformInventoryItem,
  DriverSizePreference,
  UniformRequest,
  DriverUniformAllocation,
  UniformReturnRequest,
  SelfReportedUniform,
  CreateRequestData,
  CreatePreferenceData,
  CreateReturnData,
  CreateSelfReportData
} from '../../utils/uniformTypes';
import {
  fetchUniformTypes,
  fetchUniformSizes,
  fetchUniformInventory,
  fetchDriverPreferences,
  createDriverPreference,
  fetchUniformRequests,
  createUniformRequest,
  fetchDriverAllocations,
  fetchUniformReturns,
  createUniformReturn,
  fetchSelfReportedUniforms,
  createSelfReportedUniform
} from '../uniformService';

export const useUniformTypes = () => {
  const [types, setTypes] = useState<UniformType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUniformTypes();
      setTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch uniform types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return { types, loading, error, refetch: fetchTypes };
};

export const useUniformSizes = (uniformTypeId?: string) => {
  const [sizes, setSizes] = useState<UniformSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSizes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUniformSizes(uniformTypeId);
      setSizes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch uniform sizes');
    } finally {
      setLoading(false);
    }
  }, [uniformTypeId]);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  return { sizes, loading, error, refetch: fetchSizes };
};

export const useUniformInventory = (uniformTypeId?: string, category?: string) => {
  const [inventory, setInventory] = useState<UniformInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUniformInventory(uniformTypeId, category);
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch uniform inventory');
    } finally {
      setLoading(false);
    }
  }, [uniformTypeId, category]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return { inventory, loading, error, refetch: fetchInventory };
};

export const useDriverPreferences = () => {
  const [preferences, setPreferences] = useState<DriverSizePreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDriverPreferences();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch driver preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPreference = useCallback(async (preferenceData: CreatePreferenceData) => {
    try {
      const newPreference = await createDriverPreference(preferenceData);
      setPreferences(prev => [...prev.filter(p => p.uniform_type_id !== preferenceData.uniform_type_id), newPreference]);
      return newPreference;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return { 
    preferences, 
    loading, 
    error, 
    refetch: fetchPreferences,
    createPreference 
  };
};

export const useUniformRequests = () => {
  const [requests, setRequests] = useState<UniformRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUniformRequests();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch uniform requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequest = useCallback(async (requestData: CreateRequestData) => {
    try {
      const newRequest = await createUniformRequest(requestData);
      setRequests(prev => [newRequest, ...prev]);
      return newRequest;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { 
    requests, 
    loading, 
    error, 
    refetch: fetchRequests,
    createRequest 
  };
};

export const useDriverAllocations = () => {
  const [allocations, setAllocations] = useState<DriverUniformAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDriverAllocations();
      setAllocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch driver allocations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  return { allocations, loading, error, refetch: fetchAllocations };
};

export const useUniformReturns = () => {
  const [returns, setReturns] = useState<UniformReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUniformReturns();
      setReturns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch uniform returns');
    } finally {
      setLoading(false);
    }
  }, []);

  const createReturn = useCallback(async (returnData: CreateReturnData) => {
    try {
      const newReturn = await createUniformReturn(returnData);
      setReturns(prev => [newReturn, ...prev]);
      return newReturn;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return { 
    returns, 
    loading, 
    error, 
    refetch: fetchReturns,
    createReturn 
  };
};

export const useSelfReportedUniforms = () => {
  const [selfReported, setSelfReported] = useState<SelfReportedUniform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSelfReported = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSelfReportedUniforms();
      setSelfReported(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch self-reported uniforms');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSelfReport = useCallback(async (reportData: CreateSelfReportData) => {
    try {
      const newReport = await createSelfReportedUniform(reportData);
      setSelfReported(prev => [...prev.filter(p => !(p.uniform_type_id === reportData.uniform_type_id && p.uniform_size_id === reportData.uniform_size_id)), newReport]);
      return newReport;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSelfReported();
  }, [fetchSelfReported]);

  return { 
    selfReported, 
    loading, 
    error, 
    refetch: fetchSelfReported,
    createSelfReport 
  };
};