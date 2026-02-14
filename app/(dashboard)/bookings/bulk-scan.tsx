import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
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

  const handleBarcodeScan = async (barcode: string) => {
    const alreadyScanned = scannedBookings.find(
      b => b.miles_ref === barcode || b.hawb === barcode
    );

    if (alreadyScanned) {
      Alert.alert('Already Scanned', `${barcode} is already in the list`);
      return;
    }

    setLoading(true);
    const result = await findBooking(barcode);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'Booking not found');
      return;
    }

    const booking = result.booking!;

    if (booking.status.status_id === DELIVERED_STATUS_ID) {
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

    setScannedBookings(prev => [...prev, scannedBooking]);
  };

  const handleRemoveBooking = (index: number) => {
    setScannedBookings(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to remove all scanned bookings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setScannedBookings([])
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
        'Photos Required',
        `This status requires photos for each booking. You will need to take ${scannedBookings.length} photo(s).`,
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

    const currentBooking = scannedBookings[currentBookingIndex];

    setLoading(true);

    try {
      const user = await getAuthUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        setLoading(false);
        return;
      }

      await saveStatusPOD({
        booking_id: currentBooking.booking_id,
        miles_ref: currentBooking.miles_ref,
        status_id: pendingStatus.status_id,
        photos,
        captured_by: user.id,
      });

      if (currentBookingIndex < scannedBookings.length - 1) {
        setCurrentBookingIndex(prev => prev + 1);
        setLoading(false);
        setShowPhotoCapture(true);
      } else {
        if (pendingRequirements?.reasonRequired && !bulkReason) {
          setLoading(false);
          setShowReasonInput(true);
        } else {
          await processBulkUpdate(pendingStatus, bulkReason);
        }
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
      <View style={styles.bookingItemLeft}>
        <View style={styles.bookingItemIndex}>
          <Text style={styles.bookingItemIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.bookingItemInfo}>
          <Text style={styles.bookingItemRef}>{item.miles_ref}</Text>
          <Text style={styles.bookingItemHawb}>{item.hawb}</Text>
          {item.codInfo?.hasCOD && (
            <View style={styles.codIndicator}>
              <Ionicons name="cash" size={12} color="#92400e" />
              <Text style={styles.codIndicatorText}>
                COD {item.codInfo.amount ? `${item.codInfo.currency} ${item.codInfo.amount.toFixed(2)}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveBooking(index)}
      >
        <Ionicons name="close-circle" size={24} color={colors.error} />
      </TouchableOpacity>
    </View>
  ), []);

  if (loading) {
    return <LoadingIndicator fullScreen message="Processing..." />;
  }

  return (
    <View style={styles.container}>
      {scanning && !showStatusSelector && (
        <>
          <View style={styles.scannerContainer}>
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onManualSearch={handleBarcodeScan}
            />
          </View>

          <View style={styles.scannedListContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                Scanned Bookings ({scannedBookings.length})
              </Text>
              {scannedBookings.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {scannedBookings.length === 0 ? (
              <View style={styles.emptyList}>
                <Ionicons name="scan-outline" size={48} color={colors.gray400} />
                <Text style={styles.emptyListText}>Scan barcodes to add bookings</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={scannedBookings}
                  renderItem={renderBookingItem}
                  keyExtractor={(item) => item.booking_id.toString()}
                  style={styles.bookingList}
                />

                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={handleProceedToStatus}
                >
                  <Ionicons name="arrow-forward" size={20} color={colors.background} />
                  <Text style={styles.proceedButtonText}>
                    Proceed with {scannedBookings.length} booking{scannedBookings.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}

      {showStatusSelector && (
        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToScanning}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Back to Scanning</Text>
          </TouchableOpacity>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="layers-outline" size={32} color={colors.primary} />
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
              {scannedBookings.slice(0, 5).map((booking, index) => (
                <View key={booking.booking_id} style={styles.summaryBookingItem}>
                  <Text style={styles.summaryBookingRef}>{booking.miles_ref}</Text>
                  {booking.codInfo?.hasCOD && (
                    <View style={styles.smallCodBadge}>
                      <Text style={styles.smallCodBadgeText}>COD</Text>
                    </View>
                  )}
                </View>
              ))}
              {scannedBookings.length > 5 && (
                <Text style={styles.moreBookingsText}>
                  +{scannedBookings.length - 5} more...
                </Text>
              )}
            </View>
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
        statusName={`${pendingStatus?.name || ''} - ${scannedBookings[currentBookingIndex]?.miles_ref || ''} (${currentBookingIndex + 1}/${scannedBookings.length})`}
        onComplete={handlePhotosCaptured}
        onCancel={() => {
          setShowPhotoCapture(false);
          setPendingStatus(null);
          setPendingRequirements(null);
          setCurrentBookingIndex(0);
        }}
        maxPhotos={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scannerContainer: {
    flex: 1,
    maxHeight: '50%',
  },
  scannedListContainer: {
    flex: 1,
    padding: layouts.spacing.lg,
    backgroundColor: colors.background,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  clearAllText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    marginTop: layouts.spacing.md,
    fontSize: 14,
    color: colors.textLight,
  },
  bookingList: {
    flex: 1,
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
  bookingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingItemIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: layouts.spacing.md,
  },
  bookingItemIndexText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  bookingItemInfo: {
    flex: 1,
  },
  bookingItemRef: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  bookingItemHawb: {
    fontSize: 12,
    color: colors.textLight,
  },
  codIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: layouts.spacing.xs,
    gap: 4,
  },
  codIndicatorText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  removeButton: {
    padding: layouts.spacing.xs,
  },
  proceedButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: layouts.spacing.sm,
    marginTop: layouts.spacing.md,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
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
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: layouts.spacing.md,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summarySubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  bookingSummaryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layouts.spacing.sm,
  },
  summaryBookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: layouts.spacing.sm,
    paddingVertical: layouts.spacing.xs,
    borderRadius: layouts.borderRadius.sm,
    gap: layouts.spacing.xs,
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
  moreBookingsText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
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