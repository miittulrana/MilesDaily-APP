import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { findBooking, getStatuses, updateBooking } from '../../../lib/bizhandleApi';
import { Booking, Status } from '../../../lib/bizhandleTypes';
import { getDriverInfo } from '../../../lib/auth';
import { DriverType } from '../../../lib/statusPermissions';
import BarcodeScanner from '../../../components/BarcodeScanner';
import StatusSelector from '../../../components/StatusSelector';
import LoadingIndicator from '../../../components/LoadingIndicator';

export default function SingleScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [driverTypes, setDriverTypes] = useState<DriverType[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (params.bookingRef) {
      handleAutoSearch(params.bookingRef as string);
    }
  }, [params.bookingRef]);

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

  const handleAutoSearch = async (ref: string) => {
    setScanning(false);
    setLoading(true);
    await handleSearch(ref);
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

    setBooking(result.booking!);
    setShowStatusSelector(true);
    setScanning(false);
    setLoading(false);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setScanning(false);
    await handleSearch(barcode);
  };

  const handleManualSearch = async (barcode: string) => {
    setScanning(false);
    await handleSearch(barcode);
  };

  const handleStatusSelect = (status: Status) => {
    setSelectedStatus(status);

    if (status.need_customer_confirmation) {
      router.push({
        pathname: '/(dashboard)/bookings/signature',
        params: {
          booking_id: booking!.booking_id,
          status_id: status.status_id,
          mode: 'single',
          miles_ref: booking!.miles_ref,
        },
      });
    } else {
      handleUpdate(status);
    }
  };

  const handleUpdate = async (status: Status) => {
    setLoading(true);

    const now = new Date();
    const delivered_date = now.toISOString().split('T')[0];
    const delivered_time = now.toTimeString().split(' ')[0];

    const result = await updateBooking({
      booking_id: booking!.booking_id,
      status_id: status.status_id,
      delivered_date,
      delivered_time,
    });

    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Booking updated successfully', [
        {
          text: 'Scan Another',
          onPress: () => {
            setBooking(null);
            setSelectedStatus(null);
            setShowStatusSelector(false);
            setScanning(true);
          },
        },
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Update failed');
    }
  };

  const handleCancel = () => {
    setBooking(null);
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
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onManualSearch={handleManualSearch}
        />
      )}

      {booking && showStatusSelector && (
        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Back to Scan</Text>
          </TouchableOpacity>

          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Ionicons name="cube-outline" size={32} color={colors.primary} />
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>
                  {booking.miles_ref} {booking.hawb}
                </Text>
                <Text style={[
                  styles.bookingStatus,
                  booking.status.status_id === 10 && styles.deliveredStatus
                ]}>
                  {booking.status.name}
                </Text>
              </View>
            </View>

            {booking.consignee_address && (
              <View style={styles.addressSection}>
                <Text style={styles.sectionTitle}>Consignee</Text>
                <Text style={styles.addressText}>
                  {booking.consignee_address.name}
                </Text>
                <Text style={styles.addressText}>
                  {booking.consignee_address.address}
                </Text>
              </View>
            )}
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
              currentStatusId={booking.status.status_id}
              onSelect={handleStatusSelect}
            />
          </View>
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
  content: {
    flex: 1,
    padding: layouts.spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layouts.spacing.md,
    gap: layouts.spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: layouts.spacing.md,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  bookingStatus: {
    fontSize: 14,
    color: colors.textLight,
  },
  deliveredStatus: {
    color: colors.success,
    fontWeight: '700',
  },
  addressSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: layouts.spacing.md,
    marginTop: layouts.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  addressText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: layouts.spacing.xs,
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
});