import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
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
import { DriverType, COD_CASH_COLLECTED_STATUS_ID, DELIVERED_STATUS_ID } from '../../../lib/statusPermissions';
import {
  parseCODFromSpecialInstruction,
  validateStatusSelection,
  checkLeftMessageDailyCount,
  isLeftMessageStatus,
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

const DEFAULT_COD_INFO: CODInfo = {
  hasCOD: false,
  amount: null,
  currency: 'EUR',
  rawText: null,
};

export default function SingleScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [showFoundConfirmation, setShowFoundConfirmation] = useState(false);
  const [foundBookingRef, setFoundBookingRef] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [driverTypes, setDriverTypes] = useState<DriverType[]>([]);
  const [manualInput, setManualInput] = useState('');

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
  const [callConfirmed, setCallConfirmed] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CompressedImage[]>([]);
  const [codInfo, setCodInfo] = useState<CODInfo>(DEFAULT_COD_INFO);

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

    setScanning(false);
    setFoundBookingRef(barcode.trim().toUpperCase());
    setLoadingMessage('Looking up booking...');
    setLoading(true);

    // Try up to 2 times (API can be slow on first request)
    let result = await findBooking(barcode.trim());

    if (!result.success && result.error === 'Booking not found') {
      await new Promise(resolve => setTimeout(resolve, 500));
      result = await findBooking(barcode.trim());
    }

    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoading(false);
      setFoundBookingRef(null);
      setScanning(true);
      Alert.alert('Error', result.error || 'Booking not found');
      return;
    }

    const bookingData = result.booking!;
    setBooking(bookingData);

    if (bookingData.special_instruction) {
      const cod = parseCODFromSpecialInstruction(bookingData.special_instruction);
      setCodInfo(cod);
    } else {
      setCodInfo(DEFAULT_COD_INFO);
    }

    // Show found confirmation
    setLoading(false);
    setShowFoundConfirmation(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Brief delay to show confirmation, then show status selector
    setTimeout(() => {
      setShowFoundConfirmation(false);
      setShowStatusSelector(true);
    }, 1000);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setScanning(false);
    await handleSearch(barcode);
  };

  const handleManualSearch = async (barcode: string) => {
    setScanning(false);
    await handleSearch(barcode);
  };

  const handleStatusRequirementCheck = async (
    status: Status,
    requirements: { callRequired: boolean; photoRequired: boolean; reasonRequired: boolean; twoStep: boolean }
  ) => {
    if (!booking) return;

    const validation = await validateStatusSelection(booking.booking_id, status.status_id, booking);

    if (!validation.allowed) {
      Alert.alert('Cannot Use This Status', validation.error || 'Status not allowed', [
        { text: 'OK' },
        ...(validation.suggestedStatusId ? [{
          text: 'Use Suggested Status',
          onPress: () => {
            const suggested = statuses.find(s => s.status_id === validation.suggestedStatusId);
            if (suggested) {
              handleStatusSelect(suggested);
            }
          }
        }] : [])
      ]);
      return;
    }

    if (isLeftMessageStatus(status.status_id)) {
      const leftMessageCheck = await checkLeftMessageDailyCount(status.status_id, booking.miles_ref);

      if (leftMessageCheck.warning) {
        Alert.alert(
          '⚠️ Warning',
          leftMessageCheck.message || `You have used this status ${leftMessageCheck.count} times today. Supervisor has been notified.`,
          [
            {
              text: 'Continue Anyway',
              onPress: () => proceedWithStatusFlow(status, requirements),
              style: 'default'
            },
            {
              text: 'Cancel',
              style: 'cancel'
            },
          ]
        );
        return;
      }
    }

    proceedWithStatusFlow(status, requirements);
  };

  const proceedWithStatusFlow = (
    status: Status,
    requirements: { callRequired: boolean; photoRequired: boolean; reasonRequired: boolean; twoStep: boolean }
  ) => {
    setPendingStatus(status);
    setPendingRequirements(requirements);
    setCallConfirmed(false);
    setCapturedPhotos([]);

    if (requirements.twoStep) {
      if (!codInfo.hasCOD) {
        const manualCod: CODInfo = {
          hasCOD: true,
          amount: null,
          currency: 'EUR',
          rawText: null,
        };
        setCodInfo(manualCod);
      }
      setShowCODConfirmation(true);
    } else if (requirements.callRequired) {
      setShowCallConfirmation(true);
    } else if (requirements.reasonRequired) {
      setShowReasonInput(true);
    } else if (requirements.photoRequired) {
      setShowPhotoCapture(true);
    }
  };

  const handleCallConfirmed = () => {
    setShowCallConfirmation(false);
    setCallConfirmed(true);

    if (pendingRequirements?.photoRequired) {
      setShowPhotoCapture(true);
    } else if (pendingRequirements?.reasonRequired) {
      setShowReasonInput(true);
    } else if (pendingStatus) {
      proceedWithStatusUpdate(pendingStatus);
    }
  };

  const handlePhotoCaptured = (photos: CompressedImage[]) => {
    setShowPhotoCapture(false);
    setCapturedPhotos(photos);

    if (pendingStatus) {
      proceedWithStatusUpdate(pendingStatus, photos);
    }
  };

  const handleReasonSubmitted = async (reason: string, piecesMissing?: number) => {
    setShowReasonInput(false);

    if (!pendingStatus || !booking) return;

    setLoading(true);

    try {
      const user = await getAuthUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        setLoading(false);
        return;
      }

      await saveStatusNote({
        booking_id: booking.booking_id,
        miles_ref: booking.miles_ref,
        status_id: pendingStatus.status_id,
        reason,
        pieces_missing: piecesMissing,
        captured_by: user.id,
      });

      await proceedWithStatusUpdate(pendingStatus, undefined, reason);
    } catch (error) {
      console.error('Error saving reason:', error);
      Alert.alert('Error', 'Failed to save reason');
      setLoading(false);
    }
  };

  const handleCODConfirmed = async (
    collectedAmount: number,
    paymentType: 'cash' | 'online',
    photo?: CompressedImage
  ) => {
    setShowCODConfirmation(false);

    if (!pendingStatus || !booking) return;

    setLoading(true);

    try {
      const user = await getAuthUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        setLoading(false);
        return;
      }

      const codRecord: any = {
        booking_id: booking.booking_id,
        miles_ref: booking.miles_ref,
        expected_amount: codInfo.amount || undefined,
        collected_amount: collectedAmount,
        currency: codInfo.currency || 'EUR',
        payment_type: paymentType,
        captured_by: user.id,
      };

      if (paymentType === 'online' && photo) {
        codRecord.photo = photo;
      }

      await saveCODRecord(codRecord);
      await proceedWithStatusUpdate(pendingStatus);

      Alert.alert(
        'COD Recorded',
        'Cash collection recorded. Now scan again and select "Delivered" to complete.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving COD record:', error);
      Alert.alert('Error', 'Failed to save COD record');
      setLoading(false);
    }
  };

  const proceedWithStatusUpdate = async (
    status: Status,
    photos?: CompressedImage[],
    reason?: string
  ) => {
    if (!booking) return;

    if (status.need_customer_confirmation) {
      router.push({
        pathname: '/(dashboard)/bookings/signature',
        params: {
          booking_id: booking.booking_id,
          status_id: status.status_id,
          mode: 'single',
          miles_ref: booking.miles_ref,
        },
      });
      return;
    }

    setLoading(true);

    try {
      const user = await getAuthUser();

      if (photos && photos.length > 0 && user) {
        await saveStatusPOD({
          booking_id: booking.booking_id,
          miles_ref: booking.miles_ref,
          status_id: status.status_id,
          photos,
          captured_by: user.id,
        });
      }

      const now = new Date();
      const delivered_date = now.toISOString().split('T')[0];
      const delivered_time = now.toTimeString().split(' ')[0];

      const result = await updateBooking({
        booking_id: booking.booking_id,
        status_id: status.status_id,
        delivered_date,
        delivered_time,
        reason,
      });

      setLoading(false);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (params.bookingRef) {
          router.replace('/(dashboard)/pickups');
        } else {
          router.back();
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to update booking');
    }
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (params.bookingRef) {
        router.replace('/(dashboard)/pickups');
      } else {
        router.back();
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', result.error || 'Update failed');
    }
  };

  const handleCancel = () => {
    setBooking(null);
    setSelectedStatus(null);
    setShowStatusSelector(false);
    setShowFoundConfirmation(false);
    setFoundBookingRef(null);
    setScanning(true);
    setPendingStatus(null);
    setPendingRequirements(null);
    setCallConfirmed(false);
    setCapturedPhotos([]);
    setCodInfo(DEFAULT_COD_INFO);
    setManualInput('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <View style={styles.loadingIconContainer}>
              <Ionicons name="search" size={32} color={colors.primary} />
            </View>
            {foundBookingRef && (
              <Text style={styles.loadingBookingRef}>{foundBookingRef}</Text>
            )}
            <Text style={styles.loadingMessage}>{loadingMessage}</Text>
            <View style={styles.loadingDots}>
              <View style={[styles.loadingDot, styles.loadingDotActive]} />
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (showFoundConfirmation && booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.foundContainer}>
          <View style={styles.foundContent}>
            <View style={styles.foundIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={styles.foundTitle}>Booking Found!</Text>
            <Text style={styles.foundBookingRef}>{booking.miles_ref}</Text>
            <Text style={styles.foundHawb}>{booking.hawb}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
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
            <View style={styles.scanHeader}>
              <TouchableOpacity
                style={styles.scanBackButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.scanHeaderTitle}>Single Scan</Text>
              <View style={styles.scanHeaderSpacer} />
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
                  onSubmitEditing={() => {
                    if (manualInput.trim()) {
                      handleManualSearch(manualInput.trim());
                      setManualInput('');
                    }
                  }}
                />
                {manualInput.length > 0 && (
                  <TouchableOpacity onPress={() => setManualInput('')}>
                    <Ionicons name="close-circle" size={20} color={colors.gray400} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.manualSearchButton,
                  !manualInput.trim() && styles.manualSearchButtonDisabled
                ]}
                onPress={() => {
                  if (manualInput.trim()) {
                    handleManualSearch(manualInput.trim());
                    setManualInput('');
                  }
                }}
                disabled={!manualInput.trim()}
              >
                <Ionicons name="search" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Scanner - Takes remaining space */}
            <View style={styles.scannerWrapper}>
              <BarcodeScanner
                onScan={handleBarcodeScan}
                compact={true}
              />
            </View>
          </>
        )}

        {booking && showStatusSelector && (
          <View style={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={handleCancel}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Status</Text>
            </View>

            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Booking Card */}
              <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingIcon}>
                    <Ionicons name="cube" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingRef}>{booking.miles_ref}</Text>
                    <Text style={styles.bookingHawb}>{booking.hawb}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    booking.status.status_id === DELIVERED_STATUS_ID && styles.statusBadgeDelivered
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      booking.status.status_id === DELIVERED_STATUS_ID && styles.statusBadgeTextDelivered
                    ]}>
                      {booking.status.name}
                    </Text>
                  </View>
                </View>

                {codInfo.hasCOD && (
                  <View style={styles.codBanner}>
                    <Ionicons name="cash" size={20} color="#92400e" />
                    <View style={styles.codBannerContent}>
                      <Text style={styles.codBannerTitle}>COD Required</Text>
                      {codInfo.amount && (
                        <Text style={styles.codBannerAmount}>
                          {codInfo.currency} {codInfo.amount.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {booking.special_instruction && (
                  <View style={styles.specialInstructionBox}>
                    <Ionicons name="information-circle" size={16} color={colors.warning} />
                    <Text style={styles.specialInstructionText} numberOfLines={3}>
                      {booking.special_instruction}
                    </Text>
                  </View>
                )}
              </View>

              {/* Status Section */}
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Select Status</Text>
                <StatusSelector
                  statuses={statuses}
                  driverTypes={driverTypes}
                  currentStatusId={booking.status.status_id}
                  onSelect={handleStatusSelect}
                  onStatusRequirementCheck={handleStatusRequirementCheck}
                />
              </View>
            </ScrollView>
          </View>
        )}

        <CallConfirmationModal
          visible={showCallConfirmation}
          statusName={pendingStatus?.name || ''}
          onConfirm={handleCallConfirmed}
          onCancel={() => {
            setShowCallConfirmation(false);
            setPendingStatus(null);
            setPendingRequirements(null);
          }}
        />

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

        <CODConfirmationModal
          visible={showCODConfirmation}
          codInfo={codInfo}
          onConfirm={handleCODConfirmed}
          onCancel={() => {
            setShowCODConfirmation(false);
            setPendingStatus(null);
            setPendingRequirements(null);
          }}
        />

        <StatusPhotoCapture
          visible={showPhotoCapture}
          statusId={pendingStatus?.status_id || 0}
          statusName={pendingStatus?.name || ''}
          onComplete={handlePhotoCaptured}
          onCancel={() => {
            setShowPhotoCapture(false);
            setPendingStatus(null);
            setPendingRequirements(null);
          }}
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
  contentContainer: {
    flex: 1,
  },

  // Scanning Screen Header
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.background,
  },
  scanBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  scanHeaderSpacer: {
    width: 40,
  },

  // Manual Input (matches bulk-scan)
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
  manualSearchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSearchButtonDisabled: {
    backgroundColor: colors.gray300,
  },

  // Scanner wrapper - takes remaining space
  scannerWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingBookingRef: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 1,
  },
  loadingMessage: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
  },
  loadingDotActive: {
    backgroundColor: colors.primary,
  },

  // Found Confirmation Screen
  foundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  foundContent: {
    alignItems: 'center',
    padding: 32,
  },
  foundIconContainer: {
    marginBottom: 20,
  },
  foundTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 16,
  },
  foundBookingRef: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
  foundHawb: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 4,
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

  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookingRef: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  bookingHawb: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeDelivered: {
    backgroundColor: `${colors.success}15`,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  statusBadgeTextDelivered: {
    color: colors.success,
  },

  // COD Banner
  codBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  codBannerContent: {
    flex: 1,
  },
  codBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  codBannerAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
  },

  // Special Instruction
  specialInstructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray100,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  specialInstructionText: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },

  // Status Section
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
});