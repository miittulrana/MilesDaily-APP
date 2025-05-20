import { useState, useEffect } from 'react';
import * as Battery from 'expo-battery';

export function useBattery() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<Battery.Subscription | null>(null);

  useEffect(() => {
    const getBatteryLevel = async () => {
      const level = await Battery.getBatteryLevelAsync();
      setBatteryLevel(level);
    };

    getBatteryLevel();

    const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(batteryLevel);
    });

    setSubscription(subscription);

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { batteryLevel };
}