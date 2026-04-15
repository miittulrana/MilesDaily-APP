import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { findBooking, getStatuses, updateBooking } from '../../../lib/bizhandleApi';
import { Booking, Status } from '../../../lib/bizhandleTypes';
import { getDriverInfo } from '../../../lib/auth';
import { DriverType, DELIVERED_STATUS_ID } from '../../../lib/statusPermissions';
import {
  parseCODFromSpecialInstruction,
  validateStatusSelection,
  CODInfo,
} from '../../../lib/statusHelpers';
import { saveStatusPOD, saveStatusNote, saveCODRecord } from '../../../lib/bookingNotesApi';
import { getAuthUser } from '../../../lib/supabase';
import { CompressedImage } from '../../../lib/imageCompression';
import BarcodeScanner from '../../../components/BarcodeScanner';
import StatusSelector from '../../../components/StatusSelector';
import LoadingIndicator from '../../../components/LoadingIndicator';
import CallConfirmationModal from '../../../components/CallConfirmationModal';
import ReasonInputModal from '../../../components/ReasonInputModal';
import CODConfirmationModal from '../../../components/CODConfirmationModal';
import StatusPhotoCapture from '../../../components/StatusPhotoCapture';

interface ScannedBooking extends Booking {
  scanned_at: string;
  codInfo?: CODInfo;
}

export default function BulkScanScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [scannedBookings, setScannedBookings] = useState<ScannedBooking[]>([]);
  const [driverTypes, setDriverTypes] = useState<DriverType[]>([]);
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  const [showCallConfirmation, setShowCallConfirmation] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [showCODConfirmation, setShowCODConfirmation] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [pendingRequirements, setPendingRequirements] = useState<{
    callRequired: boolean;
    photoRequired: boolean;
    reasonRequired: boolean;
    twoStep: boolean;
  } | null>(null);
  const [currentBookingIndex, setCurrentBookingIndex] = useState(0);
  const [bulkReason, setBulkReason] = useState<string>('');
  const [bulkPhotos, setBulkPhotos] = useState<CompressedImage[]>([]);

  // Manual input state
  const [manualInput, setManualInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const processingBarcode = useRef<string | null>(null);
  const scannedBarcodesRef = useRef<Set<string>>(new Set());
  const listRef = useRef<FlatList>(null);

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

  const addBookingToList = async (barcode: string) => {
    const normalizedBarcode = barcode.trim().toUpperCase();

    if (processingBarcode.current === normalizedBarcode) {
      return;
    }

    if (scannedBarcodesRef.current.has(normalizedBarcode)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Already Scanned', `${barcode} is already in the list`);
      return;
    }

    const alreadyScanned = scannedBookings.find(
      b => b.miles_ref.toUpperCase() === normalizedBarcode ||
        b.hawb.toUpperCase() === normalizedBarcode
    );

    if (alreadyScanned) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Already Scanned', `${barcode} is already in the list`);
      return;
    }

    processingBarcode.current = normalizedBarcode;
    setIsSearching(true);

    // Try up to 2 times for manual input (API can be slow on first request)
    let result = await findBooking(barcode);

    if (!result.success && result.error === 'Booking not found') {
      // Wait briefly and retry once
      await new Promise(resolve => setTimeout(resolve, 500));
      result = await findBooking(barcode);
    }

    setIsSearching(false);
    processingBarcode.current = null;

    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', result.error || 'Booking not found');
      return;
    }

    const booking = result.booking!;

    const alreadyInList = scannedBookings.find(
      b => b.booking_id === booking.booking_id
    );

    if (alreadyInList) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Already Scanned', `${booking.miles_ref} is already in the list`);
      return;
    }

    if (booking.status.status_id === DELIVERED_STATUS_ID) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Already Delivered',
        `${booking.miles_ref} has already been delivered. It cannot be added to bulk scan.`
      );
      return;
    }

    const codInfo = booking.special_instruction
      ? parseCODFromSpecialInstruction(booking.special_instruction)
      : undefined;

    const scannedBooking: ScannedBooking = {
      ...booking,
      scanned_at: new Date().toISOString(),
      codInfo,
    };

    scannedBarcodesRef.current.add(normalizedBarcode);
    scannedBarcodesRef.current.add(booking.miles_ref.toUpperCase());
    scannedBarcodesRef.current.add(booking.hawb.toUpperCase());

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScannedBookings(prev => {
      const newList = [...prev, scannedBooking];
      // Scroll to bottom after adding
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return newList;
    });
  };

  const handleBarcodeScan = async (barcode: string) => {
    await addBookingToList(barcode);
  };

  const handleManualSubmit = async () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;

    setManualInput('');
    await addBookingToList(trimmed);
  };

  const handleRemoveBooking = (index: number) => {
    const bookingToRemove = scannedBookings[index];

    scannedBarcodesRef.current.delete(bookingToRemove.miles_ref.toUpperCase());
    scannedBarcodesRef.current.delete(bookingToRemove.hawb.toUpperCase());

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScannedBookings(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All',
      `Remove all ${scannedBookings.length} scanned bookings?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            scannedBarcodesRef.current.clear();
            setScannedBookings([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  const handleProceedToStatus = () => {
    if (scannedBookings.length === 0) {
      Alert.alert('No Bookings', 'Please scan at least one booking');
      return;
    }

    setScanning(false);
    setShowStatusSelector(true);
  };

  const handleStatusRequirementCheck = async (
    status: Status,
    requirements: { callRequired: boolean; photoRequired: boolean; reasonRequired: boolean; twoStep: boolean }
  ) => {
    const hasCODBookings = scannedBookings.some(b => b.codInfo?.hasCOD);
    if (requirements.twoStep && hasCODBookings) {
      Alert.alert(
        'COD Not Supported in Bulk',
        'Some bookings have COD requirements. Please process them individually using Single Scan.',
        [{ text: 'OK' }]
      );
      return;
    }

    for (const booking of scannedBookings) {
      const validation = await validateStatusSelection(booking.booking_id, status.status_id, booking);
      if (!validation.allowed) {
        Alert.alert(
          'Status Not Allowed',
          `Cannot use "${status.name}" for ${booking.miles_ref}: ${validation.error}`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setPendingStatus(status);
    setPendingRequirements(requirements);
    setCurrentBookingIndex(0);
    setBulkReason('');
    setBulkPhotos([]);

    if (requirements.callRequired) {
      Alert.alert(
        'Call Required',
        `This status requires calling customers. For ${scannedBookings.length} bookings, you confirm you have called ALL customers?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => { setPendingStatus(null); setPendingRequirements(null); } },
          { text: 'Yes, I Called All', onPress: () => handleBulkCallConfirmed(status, requirements) }
        ]
      );
    } else if (requirements.reasonRequired) {
      setShowReasonInput(true);
    } else if (requirements.photoRequired) {
      Alert.alert(
        'Photo Required',
        `Take 1 photo that will be applied to all ${scannedBookings.length} bookings.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => { setPendingStatus(null); setPendingRequirements(null); } },
          { text: 'Continue', onPress: () => setShowPhotoCapture(true) }
        ]
      );
    }
  };

  const handleBulkCallConfirmed = (status: Status, requirements: { callRequired: boolean; photoRequired: boolean; reasonRequired: boolean; twoStep: boolean }) => {
    if (requirements.photoRequired) {
      setShowPhotoCapture(true);
    } else if (requirements.reasonRequired) {
      setShowReasonInput(true);
    } else {
      processBulkUpdate(status);
    }
  };

  const handleReasonSubmitted = async (reason: string, piecesMissing?: number) => {
    setShowReasonInput(false);
    setBulkReason(reason);

    if (!pendingStatus) return;

    setLoading(true);

    try {
      const user = await getAuthUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        setLoading(false);
        return;
      }

      for (const booking of scannedBookings) {
        await saveStatusNote({
          booking_id: booking.booking_id,
          miles_ref: booking.miles_ref,
          status_id: pendingStatus.status_id,
          reason,
          pieces_missing: piecesMissing,
          captured_by: user.id,
        });
      }

      await processBulkUpdate(pendingStatus, reason);
    } catch (error) {
      console.error('Error saving reasons:', error);
      Alert.alert('Error', 'Failed to save reasons');
      setLoading(false);
    }
  };

  const handlePhotosCaptured = async (photos: CompressedImage[]) => {
    setShowPhotoCapture(false);

    if (!pendingStatus) return;

    setBulkPhotos(photos);
    setLoading(true);

    try {
      const user = await getAuthUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        setLoading(false);
        return;
      }

      for (const booking of scannedBookings) {
        await saveStatusPOD({
          booking_id: booking.booking_id,
          miles_ref: booking.miles_ref,
          status_id: pendingStatus.status_id,
          photos,
          captured_by: user.id,
        });
      }

      if (pendingRequirements?.reasonRequired && !bulkReason) {
        setLoading(false);
        setShowReasonInput(true);
      } else {
        await processBulkUpdate(pendingStatus, bulkReason);
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
      setLoading(false);
    }
  };

  const processBulkUpdate = async (status: Status, reason?: string) => {
    if (status.need_customer_confirmation) {
      const bookingIds = scannedBookings.map(b => b.booking_id).join(',');
      const milesRefs = scannedBookings.map(b => b.miles_ref).join(',');

      router.push({
        pathname: '/(dashboard)/bookings/signature',
        params: {
          booking_ids: bookingIds,
          status_id: status.status_id,
          mode: 'bulk',
          miles_refs: milesRefs,
        },
      });
      return;
    }

    setLoading(true);

    const now = new Date();
    const delivered_date = now.toISOString().split('T')[0];
    const delivered_time = now.toTimeString().split(' ')[0];

    let successCount = 0;
    let failedBookings: string[] = [];

    for (const booking of scannedBookings) {
      const result = await updateBooking({
        booking_id: booking.booking_id,
        status_id: status.status_id,
        delivered_date,
        delivered_time,
        reason,
      });

      if (result.success) {
        successCount++;
      } else {
        failedBookings.push(booking.miles_ref);
      }
    }

    setLoading(false);

    if (failedBookings.length === 0) {
      Alert.alert(
        'Success',
        `All ${successCount} bookings updated successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert(
        'Partial Success',
        `${successCount} bookings updated. Failed: ${failedBookings.join(', ')}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const handleStatusSelect = (status: Status) => {
    setSelectedStatus(status);

    if (status.need_customer_confirmation) {
      const bookingIds = scannedBookings.map(b => b.booking_id).join(',');
      const milesRefs = scannedBookings.map(b => b.miles_ref).join(',');

      router.push({
        pathname: '/(dashboard)/bookings/signature',
        params: {
          booking_ids: bookingIds,
          status_id: status.status_id,
          mode: 'bulk',
          miles_refs: milesRefs,
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
    let failedBookings: string[] = [];

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
        failedBookings.push(booking.miles_ref);
      }
    }

    setLoading(false);

    if (failedBookings.length === 0) {
      Alert.alert(
        'Success',
        `All ${successCount} bookings updated successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert(
        'Partial Success',
        `${successCount} bookings updated. Failed: ${failedBookings.join(', ')}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const handleBackToScanning = () => {
    setShowStatusSelector(false);
    setScanning(true);
    setSelectedStatus(null);
    setPendingStatus(null);
    setPendingRequirements(null);
  };

  const renderBookingItem = useCallback(({ item, index }: { item: ScannedBooking; index: number }) => (
    <View style={styles.bookingItem}>
      <View style={styles.bookingItemNumber}>
        <Text style={styles.bookingItemNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.bookingItemContent}>
        <Text style={styles.bookingItemRef}>{item.miles_ref}</Text>
        <Text style={styles.bookingItemHawb}>{item.hawb}</Text>
      </View>
      {item.codInfo?.hasCOD && (
        <View style={styles.codBadge}>
          <Text style={styles.codBadgeText}>COD</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveBooking(index)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={22} color={colors.error} />
      </TouchableOpacity>
    </View>
  ), [scannedBookings]);

  const renderEmptyList = () => (
    <View style={styles.emptyList}>
      <Ionicons name="cube-outline" size={48} color={colors.gray300} />
      <Text style={styles.emptyListTitle}>No bookings scanned</Text>
      <Text style={styles.emptyListText}>Scan barcodes or type booking numbers above</Text>
    </View>
  );

  if (loading) {
    return <LoadingIndicator fullScreen message="Processing..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scanning && !showStatusSelector && (
          <>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Bulk Scan</Text>
              {scannedBookings.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearAllButton}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Manual Input */}
            <View style={styles.manualInputContainer}>
              <View style={styles.manualInputWrapper}>
                <Ionicons name="barcode-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.manualInput}
                  value={manualInput}
                  onChangeText={setManualInput}
                  placeholder="Type booking number..."
                  placeholderTextColor={colors.gray400}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleManualSubmit}
                />
                {manualInput.length > 0 && (
                  <TouchableOpacity onPress={() => setManualInput('')}>
                    <Ionicons name="close-circle" size={20} color={colors.gray400} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.manualInputButton,
                  !manualInput.trim() && styles.manualInputButtonDisabled
                ]}
                onPress={handleManualSubmit}
                disabled={!manualInput.trim()}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Scanner - Compact */}
            <View style={styles.scannerWrapper}>
              <BarcodeScanner
                onScan={handleBarcodeScan}
                cooldownMode={true}
                cooldownDuration={1500}
                compact={true}
              />
            </View>

            {/* Scanned List */}
            <View style={styles.listContainer}>
              <View style={styles.listHeader}>
                <Ionicons name="layers-outline" size={20} color={colors.text} />
                <Text style={styles.listTitle}>Scanned</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{scannedBookings.length}</Text>
                </View>
              </View>

              {isSearching && (
                <View style={styles.searchingIndicator}>
                  <Text style={styles.searchingText}>Looking up booking...</Text>
                </View>
              )}

              <FlatList
                ref={listRef}
                data={scannedBookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item.booking_id.toString()}
                style={styles.bookingList}
                contentContainerStyle={scannedBookings.length === 0 ? styles.emptyListContainer : styles.listContent}
                ListEmptyComponent={renderEmptyList}
                showsVerticalScrollIndicator={true}
              />
            </View>

            {/* Proceed Button - Fixed at bottom */}
            {scannedBookings.length > 0 && (
              <View style={styles.proceedContainer}>
                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={handleProceedToStatus}
                >
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  <Text style={styles.proceedButtonText}>
                    Proceed with {scannedBookings.length} booking{scannedBookings.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {showStatusSelector && (
          <ScrollView style={styles.statusContent} showsVerticalScrollIndicator={false}>
            <View style={styles.statusHeader}>
              <TouchableOpacity
                style={styles.statusBackButton}
                onPress={handleBackToScanning}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
                <Text style={styles.statusBackButtonText}>Back to Scanning</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="layers" size={24} color={colors.primary} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryTitle}>
                    {scannedBookings.length} Booking{scannedBookings.length !== 1 ? 's' : ''} Selected
                  </Text>
                  <Text style={styles.summarySubtitle}>
                    Select a status to apply to all
                  </Text>
                </View>
              </View>

              <View style={styles.bookingSummaryList}>
                {scannedBookings.slice(0, 6).map((booking, index) => (
                  <View key={booking.booking_id} style={styles.summaryBookingItem}>
                    <Text style={styles.summaryBookingRef}>{booking.miles_ref}</Text>
                    {booking.codInfo?.hasCOD && (
                      <View style={styles.smallCodBadge}>
                        <Text style={styles.smallCodBadgeText}>COD</Text>
                      </View>
                    )}
                  </View>
                ))}
                {scannedBookings.length > 6 && (
                  <View style={styles.moreBookingsBadge}>
                    <Text style={styles.moreBookingsText}>+{scannedBookings.length - 6} more</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Removed: Showing statuses for
            {driverTypes.length > 0 && (
              <View style={styles.driverTypeInfo}>
                <Ionicons name="person-outline" size={16} color={colors.textLight} />
                <Text style={styles.driverTypeText}>
                  Showing statuses for: {driverTypes.map(t => t.toUpperCase()).join(', ')}
                </Text>
              </View>
            )}
            */}

            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Select Status</Text>
              <StatusSelector
                statuses={statuses}
                driverTypes={driverTypes}
                onSelect={handleStatusSelect}
                onStatusRequirementCheck={handleStatusRequirementCheck}
              />
            </View>
          </ScrollView>
        )}

        <ReasonInputModal
          visible={showReasonInput}
          statusId={pendingStatus?.status_id || 0}
          statusName={pendingStatus?.name || ''}
          onSubmit={handleReasonSubmitted}
          onCancel={() => {
            setShowReasonInput(false);
            setPendingStatus(null);
            setPendingRequirements(null);
          }}
        />

        <StatusPhotoCapture
          visible={showPhotoCapture}
          statusId={pendingStatus?.status_id || 0}
          statusName={`${pendingStatus?.name || ''} - All ${scannedBookings.length} bookings`}
          onComplete={handlePhotosCaptured}
          onCancel={() => {
            setShowPhotoCapture(false);
            setPendingStatus(null);
            setPendingRequirements(null);
            setCurrentBookingIndex(0);
          }}
          maxPhotos={2}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.background,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  clearAllButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },

  // Manual Input
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  manualInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  manualInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  manualInputButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualInputButtonDisabled: {
    backgroundColor: colors.gray300,
  },

  // Scanner
  scannerWrapper: {
    height: 260,
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  // List
  listContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    gap: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchingIndicator: {
    backgroundColor: colors.gray100,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  searchingText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
  },
  bookingList: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray500,
    marginTop: 12,
  },
  emptyListText: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 4,
  },

  // Booking Item
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  bookingItemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingItemNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  bookingItemContent: {
    flex: 1,
  },
  bookingItemRef: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  bookingItemHawb: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  codBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  codBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  removeButton: {
    padding: 4,
  },

  // Proceed Button
  proceedContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Status Selection Screen
  statusContent: {
    flex: 1,
    padding: 16,
  },
  statusHeader: {
    marginBottom: 16,
  },
  statusBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summarySubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  bookingSummaryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryBookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  summaryBookingRef: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  smallCodBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallCodBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400e',
  },
  moreBookingsBadge: {
    backgroundColor: colors.gray200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moreBookingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  driverTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  driverTypeText: {
    fontSize: 13,
    color: colors.textLight,
  },
  statusSection: {
    marginBottom: 24,
  },
});