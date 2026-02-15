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
import { DriverType, COD_CASH_COLLECTED_STATUS_ID, DELIVERED_STATUS_ID } from '../../../lib/statusPermissions';
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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [driverTypes, setDriverTypes] = useState<DriverType[]>([]);

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

    setLoading(true);

    const result = await findBooking(barcode.trim());

    if (!result.success) {
      Alert.alert('Error', result.error || 'Booking not found');
      setLoading(false);
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
        router.back();
      } else {
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
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Update failed');
    }
  };

  const handleCancel = () => {
    setBooking(null);
    setSelectedStatus(null);
    setShowStatusSelector(false);
    setScanning(true);
    setPendingStatus(null);
    setPendingRequirements(null);
    setCallConfirmed(false);
    setCapturedPhotos([]);
    setCodInfo(DEFAULT_COD_INFO);
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
                  booking.status.status_id === DELIVERED_STATUS_ID && styles.deliveredStatus
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
              onStatusRequirementCheck={handleStatusRequirementCheck}
            />
          </View>
        </ScrollView>
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
  codBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginTop: layouts.spacing.md,
    gap: layouts.spacing.sm,
    borderWidth: 1,
    borderColor: '#f59e0b',
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
  specialInstructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray100,
    padding: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.md,
    marginTop: layouts.spacing.md,
    gap: layouts.spacing.sm,
  },
  specialInstructionText: {
    flex: 1,
    fontSize: 12,
    color: colors.textLight,
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