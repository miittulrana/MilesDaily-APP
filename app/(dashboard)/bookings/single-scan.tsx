import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { findBooking, getStatuses, updateBooking } from '../../../lib/bizhandleApi';
import { Booking, Status } from '../../../lib/bizhandleTypes';
import BarcodeScanner from '../../../components/BarcodeScanner';
import StatusSelector from '../../../components/StatusSelector';
import LoadingIndicator from '../../../components/LoadingIndicator';

export default function SingleScanScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [manualSearch, setManualSearch] = useState('');

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    const result = await getStatuses();
    if (result.success && result.statuses) {
      setStatuses(result.statuses);
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

    setBooking(result.booking!);
    setShowStatusSelector(true);
    setScanning(false);
    setLoading(false);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setScanning(false);
    await handleSearch(barcode);
  };

  const handleManualSearch = () => {
    handleSearch(manualSearch);
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
            setManualSearch('');
            setScanning(true);
          },
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
    setManualSearch('');
    setScanning(true);
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Processing..." />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {scanning && !showStatusSelector && (
        <>
          {/* Manual Search Bar - ABOVE camera */}
          <View style={styles.manualSearchBar}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="barcode-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                value={manualSearch}
                onChangeText={setManualSearch}
                placeholder="Enter booking number..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleManualSearch}
              />
              {manualSearch.length > 0 && (
                <TouchableOpacity onPress={() => setManualSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.searchButton, !manualSearch.trim() && styles.searchButtonDisabled]}
              onPress={handleManualSearch}
              disabled={!manualSearch.trim()}
            >
              <Ionicons name="search" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Camera Scanner - BELOW search bar */}
          <View style={styles.scanContainer}>
            <BarcodeScanner onScan={handleBarcodeScan} />
          </View>
        </>
      )}

      {booking && showStatusSelector && (
        <ScrollView style={styles.content}>
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Ionicons name="cube-outline" size={32} color={colors.primary} />
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>
                  {booking.miles_ref} {booking.hawb}
                </Text>
                <Text style={styles.bookingStatus}>{booking.status.name}</Text>
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

          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Select Status</Text>
            <StatusSelector statuses={statuses} onSelect={handleStatusSelect} />
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
  manualSearchBar: {
    flexDirection: 'row',
    padding: layouts.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    gap: layouts.spacing.sm,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: layouts.borderRadius.lg,
    paddingHorizontal: layouts.spacing.md,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: layouts.spacing.sm,
    paddingVertical: layouts.spacing.xs,
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: layouts.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  content: {
    flex: 1,
    padding: layouts.spacing.lg,
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