import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface StatusIndicatorProps {
  isTracking: boolean;
  lastUpdate?: string;
  batteryLevel?: number;
}

export default function StatusIndicator({ 
  isTracking, 
  lastUpdate, 
  batteryLevel 
}: StatusIndicatorProps) {
  
  const statusColor = isTracking ? Colors.success : Colors.error;
  const statusText = isTracking ? 'Active Tracking' : 'Tracking Inactive';
  
  const batteryPercentage = batteryLevel !== undefined 
    ? `${Math.round(batteryLevel * 100)}%` 
    : 'Unknown';
  
  return (
    <View style={styles.container}>
      <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{statusText}</Text>
        {isTracking && lastUpdate && (
          <Text style={styles.lastUpdateText}>Last update: {lastUpdate}</Text>
        )}
      </View>
      <View style={styles.batteryContainer}>
        <Text style={styles.batteryText}>Battery: {batteryPercentage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginVertical: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  lastUpdateText: {
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 2,
  },
  batteryContainer: {
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: Colors.lightGray,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.darkGray,
  },
});