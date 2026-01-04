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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { findBooking, getStatuses, updateBooking } from '../../../lib/bizhandleApi';
import { Booking, Status, ScannedBooking } from '../../../lib/bizhandleTypes';
import BarcodeScanner from '../../../components/BarcodeScanner';
import StatusSelector from '../../../components/StatusSelector';
import LoadingIndicator from '../../../components/LoadingIndicator';

export default function BulkScanScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedBookings, setScannedBookings] = useState<ScannedBooking[]>([]);
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

    const booking = result.booking!;
    const alreadyScanned = scannedBookings.find(
      (b) => b.booking_id === booking.booking_id
    );

    if (alreadyScanned) {
      Alert.alert('Already Scanned', 'This booking is already in the list');
      setLoading(false);
      setManualSearch('');
      return;
    }

    setScannedBookings([
      ...scannedBookings,
      {
        booking_id: booking.booking_id,
        miles_ref: booking.miles_ref,
        hawb: booking.hawb,
        scanned_at: new Date().toISOString(),
      },
    ]);

    setLoading(false);
    setManualSearch('');
  };

  const handleBarcodeScan = async (barcode: string) => {
    await handleSearch(barcode);
  };

  const handleManualSearch = () => {
    handleSearch(manualSearch);
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
              <Ionicons name="add-circle" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Camera Scanner - BELOW search bar */}
          <View style={styles.scanContainer}>
            <BarcodeScanner onScan={handleBarcodeScan} />

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {scannedBookings.length > 0 && (
                <>
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
                </>
              )}
            </View>
          </View>
        </>
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

          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Select Status</Text>
            <StatusSelector statuses={statuses} onSelect={handleStatusSelect} />
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Back to Scanning</Text>
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