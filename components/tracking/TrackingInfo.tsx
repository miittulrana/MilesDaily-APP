import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface TrackingInfoProps {
  location?: {
    latitude: number;
    longitude: number;
    speed?: number | null;
  };
  batteryLevel?: number;
  driverName?: string;
}

function Card({ children, style }: { children: React.ReactNode, style?: any }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

export default function TrackingInfo({ 
  location, 
  batteryLevel, 
  driverName = 'Driver'
}: TrackingInfoProps) {
  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Current Status</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Driver:</Text>
        <Text style={styles.infoValue}>{driverName}</Text>
      </View>
      
      {location && (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Speed:</Text>
            <Text style={styles.infoValue}>
              {location.speed ? `${Math.round(location.speed)} m/s` : 'N/A'}
            </Text>
          </View>
        </>
      )}
      
      {batteryLevel !== undefined && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Battery:</Text>
          <Text style={styles.infoValue}>{Math.round(batteryLevel * 100)}%</Text>
        </View>
      )}
      
      <Text style={styles.updateText}>
        Updates sent every 3 seconds
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '400',
  },
  updateText: {
    fontSize: 12,
    color: Colors.darkGray,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});