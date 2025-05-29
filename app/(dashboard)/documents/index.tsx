import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import LoadingIndicator from '../../../components/LoadingIndicator';
import DocumentList from '../../../components/documents/DocumentList';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { getDriverInfo, getAssignedVehicle } from '../../../lib/auth';
import { fetchDriverDocuments, fetchVehicleDocuments } from '../../../lib/documentsService';
import { DriverInfo, Vehicle } from '../../../utils/types';
import { DriverDocument, VehicleDocument } from '../../../utils/documentTypes';

export default function DocumentsScreen() {
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driverDocs, setDriverDocs] = useState<DriverDocument[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const driverData = await getDriverInfo();
      setDriver(driverData);

      if (driverData?.id) {
        const vehicleData = await getAssignedVehicle(driverData.id);
        setVehicle(vehicleData);

        const [driverDocsData, vehicleDocsData] = await Promise.all([
          fetchDriverDocuments(driverData.id),
          vehicleData ? fetchVehicleDocuments(vehicleData.id) : Promise.resolve([])
        ]);

        setDriverDocs(driverDocsData);
        setVehicleDocs(vehicleDocsData);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <LoadingIndicator fullScreen message="Loading documents..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Documents</Text>
        {vehicle && (
          <Text style={styles.subtitle}>
            {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
          </Text>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <DocumentList
        driverDocuments={driverDocs}
        vehicleDocuments={vehicleDocs}
        driverName={driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() : ''}
        vehicleName={vehicle ? `${vehicle.license_plate} - ${vehicle.brand} ${vehicle.model}` : ''}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layouts.spacing.lg,
  },
  header: {
    marginBottom: layouts.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
});