import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { findBooking, getStatuses, updateBooking } from '../../../lib/bizhandleApi';
import { Booking, Status, ScannedBooking } from '../../../lib/bizhandleTypes';
import { getDriverInfo } from '../../../lib/auth';
import { DriverType } from '../../../lib/statusPermissions';
import BarcodeScanner from '../../../components/BarcodeScanner';
import StatusSelector from '../../../components/StatusSelector';
import LoadingIndicator from '../../../components/LoadingIndicator';

const DELIVERED_STATUS_ID = 10;

interface ExtendedScannedBooking extends ScannedBooking {
  current_status_id?: number;
  current_status_name?: string;
}

export default function BulkScanScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedBookings, setScannedBookings] = useState<ExtendedScannedBooking[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [driverTypes, setDriverTypes] = useState<DriverType[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadStatuses(),
      loadDriverTypes()
    ]);
  };

  const loadStatuses = async () => {
    const result = await getStatuses();
    if (result.success && result.statuses) {
      setStatuses(result.statuses);
    }
  };

  const loadDriverTypes = async () => {
    try {
      const driverInfo = await getDriverInfo();
      if (driverInfo?.driver_types) {
        setDriverTypes(driverInfo.driver_types as DriverType[]);
      }
    } catch (error) {
      console.error('Error loading driver types:', error);
    }
  };

  const handleSearch = async (barcode: string) => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter a booking number');
      return;
    }

    setLoading(true);

    const result = await findBooking(barcode.trim());

    if (!result.success) {
      Alert.alert('Error', result.error || 'Booking not found');
      setLoading(false);
      return;
    }

    const booking = result.booking!;
    const alreadyScanned = scannedBookings.find(
      (b) => b.booking_id === booking.booking_id
    );

    if (alreadyScanned) {
      Alert.alert('Already Scanned', 'This booking is already in the list');
      setLoading(false);
      return;
    }

    if (booking.status.status_id === DELIVERED_STATUS_ID) {
      Alert.alert(
        'Already Delivered',
        `Booking ${booking.miles_ref} ${booking.hawb} has already been delivered. It cannot be added to bulk scan.`,
        [{ text: 'OK' }]
      );
      setLoading(false);
      return;
    }

    setScannedBookings([
      ...scannedBookings,
      {
        booking_id: booking.booking_id,
        miles_ref: booking.miles_ref,
        hawb: booking.hawb,
        scanned_at: new Date().toISOString(),
        current_status_id: booking.status.status_id,
        current_status_name: booking.status.name,
      },
    ]);

    setLoading(false);
  };

  const handleBarcodeScan = async (barcode: string) => {
    await handleSearch(barcode);
  };

  const handleManualSearch = async (barcode: string) => {
    await handleSearch(barcode);
  };

  const handleRemoveBooking = (booking_id: number) => {
    setScannedBookings(scannedBookings.filter((b) => b.booking_id !== booking_id));
  };

  const handleDoneScanning = () => {
    if (scannedBookings.length === 0) {
      Alert.alert('No Bookings', 'Please scan at least one booking');
      return;
    }
    setScanning(false);
    setShowStatusSelector(true);
  };

  const handleStatusSelect = (status: Status) => {
    setSelectedStatus(status);

    if (status.need_customer_confirmation) {
      const bookingIds = scannedBookings.map((b) => b.booking_id);
      router.push({
        pathname: '/(dashboard)/bookings/signature',
        params: {
          booking_ids: JSON.stringify(bookingIds),
          status_id: status.status_id,
          mode: 'bulk',
        },
      });
    } else {
      handleBulkUpdate(status);
    }
  };

  const handleBulkUpdate = async (status: Status) => {
    setLoading(true);

    const now = new Date();
    const delivered_date = now.toISOString().split('T')[0];
    const delivered_time = now.toTimeString().split(' ')[0];

    let successCount = 0;
    let failCount = 0;

    for (const booking of scannedBookings) {
      const result = await updateBooking({
        booking_id: booking.booking_id,
        status_id: status.status_id,
        delivered_date,
        delivered_time,
      });

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setLoading(false);

    Alert.alert(
      'Update Complete',
      `Success: ${successCount}\nFailed: ${failCount}`,
      [
        {
          text: 'Scan More',
          onPress: () => {
            setScannedBookings([]);
            setSelectedStatus(null);
            setShowStatusSelector(false);
            setScanning(true);
          },
        },
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleCancel = () => {
    setSelectedStatus(null);
    setShowStatusSelector(false);
    setScanning(true);
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Processing..." />;
  }

  return (
    <View style={styles.container}>
      {scanning && !showStatusSelector && (
        <View style={styles.scanContainer}>
          <BarcodeScanner
            onScan={handleBarcodeScan}
            onManualSearch={handleManualSearch}
          />

          {scannedBookings.length > 0 && (
            <View style={styles.bottomControls}>
              <View style={styles.counterCard}>
                <Text style={styles.counterLabel}>Scanned</Text>
                <Text style={styles.counterValue}>{scannedBookings.length}</Text>
              </View>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleDoneScanning}
              >
                <Text style={styles.doneButtonText}>Done - Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {showStatusSelector && (
        <ScrollView style={styles.content}>
          <View style={styles.scannedList}>
            <Text style={styles.sectionTitle}>
              Scanned Bookings ({scannedBookings.length})
            </Text>
            <FlatList
              data={scannedBookings}
              keyExtractor={(item) => item.booking_id.toString()}
              renderItem={({ item }) => (
                <View style={styles.bookingItem}>
                  <View style={styles.bookingItemInfo}>
                    <Text style={styles.bookingItemText}>
                      {item.miles_ref} {item.hawb}
                    </Text>
                    {item.current_status_name && (
                      <Text style={styles.bookingItemStatus}>
                        Current: {item.current_status_name}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveBooking(item.booking_id)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />
          </View>

          {driverTypes.length > 0 && (
            <View style={styles.driverTypeInfo}>
              <Ionicons name="person-outline" size={16} color={colors.textLight} />
              <Text style={styles.driverTypeText}>
                Showing statuses for: {driverTypes.map(t => t.toUpperCase()).join(', ')}
              </Text>
            </View>
          )}

          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Select Status</Text>
            <StatusSelector
              statuses={statuses}
              driverTypes={driverTypes}
              onSelect={handleStatusSelect}
            />
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Back to Scanning</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scanContainer: {
    flex: 1,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: layouts.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: layouts.spacing.md,
  },
  counterCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    alignItems: 'center',
  },
  counterLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
  },
  counterValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  doneButton: {
    backgroundColor: colors.success,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  content: {
    flex: 1,
    padding: layouts.spacing.lg,
  },
  scannedList: {
    marginBottom: layouts.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  bookingItemInfo: {
    flex: 1,
  },
  bookingItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bookingItemStatus: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  driverTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.md,
    gap: layouts.spacing.xs,
  },
  driverTypeText: {
    fontSize: 12,
    color: colors.textLight,
  },
  statusSection: {
    marginBottom: layouts.spacing.lg,
  },
  cancelButton: {
    backgroundColor: colors.gray200,
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});