import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getOfflineData, saveOfflineData, clearOfflineData } from '../../utils/offlineStorage';
import { completeWashByDriver } from '../washService';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(!!online);
      
      if (online && !isOnline) {
        syncOfflineData();
      }
    });

    checkOfflineData();

    return () => {
      unsubscribe();
    };
  }, []);

  const checkOfflineData = async () => {
    try {
      const offlineData = await getOfflineData('wash_completions');
      setPendingSync(offlineData && offlineData.length > 0);
    } catch (error) {
      console.error('Error checking offline data:', error);
    }
  };

  const syncOfflineData = async () => {
    try {
      const offlineData = await getOfflineData('wash_completions');
      if (!offlineData || offlineData.length === 0) {
        setPendingSync(false);
        return;
      }

      for (const completion of offlineData) {
        try {
          await completeWashByDriver(completion);
        } catch (error) {
          console.error('Error syncing wash completion:', error);
        }
      }

      await clearOfflineData('wash_completions');
      setPendingSync(false);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const saveWashCompletion = async (completionData: any) => {
    if (isOnline) {
      try {
        return await completeWashByDriver(completionData);
      } catch (error) {
        await saveOfflineData('wash_completions', completionData);
        setPendingSync(true);
        throw error;
      }
    } else {
      await saveOfflineData('wash_completions', completionData);
      setPendingSync(true);
      return true;
    }
  };

  const forceSyncNow = async () => {
    if (isOnline) {
      await syncOfflineData();
    }
  };

  return {
    isOnline,
    pendingSync,
    saveWashCompletion,
    forceSyncNow,
    checkOfflineData,
  };
};