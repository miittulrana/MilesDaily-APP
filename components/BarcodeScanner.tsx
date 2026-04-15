import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void | Promise<void>;
  onManualSearch?: (barcode: string) => void | Promise<void>;
  cooldownMode?: boolean;
  cooldownDuration?: number;
  compact?: boolean;
  locked?: boolean; // External lock to prevent scanning while parent is processing
}

interface ScanBuffer {
  code: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

// Configuration
const CONFIG = {
  // Minimum reads of same barcode to confirm
  MIN_CONSISTENT_READS: 3,
  // Time window to collect reads (ms)
  BUFFER_WINDOW: 800,
  // Minimum time spread required - barcode must be read over at least this duration (ms)
  // This prevents instant confirmation when camera reads 3 times in 50ms
  MIN_TIME_SPREAD: 400,
  // Minimum barcode length
  MIN_LENGTH: 6,
  // Maximum barcode length
  MAX_LENGTH: 20,
  // Time to show confirmation before processing (ms)
  CONFIRMATION_DISPLAY_TIME: 600,
  // Buffer cleanup interval (ms)
  BUFFER_CLEANUP_INTERVAL: 1000,
  // Stale buffer entry threshold (ms)
  BUFFER_STALE_THRESHOLD: 2000,
};

// Validate barcode format
const isValidBarcodeFormat = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;

  const trimmed = code.trim();

  // Length check
  if (trimmed.length < CONFIG.MIN_LENGTH || trimmed.length > CONFIG.MAX_LENGTH) {
    return false;
  }

  // Must be alphanumeric (allows for HAWB codes)
  // Rejects special characters, control characters, garbage
  if (!/^[A-Za-z0-9\-]+$/.test(trimmed)) {
    return false;
  }

  // Reject if too many consecutive same characters (likely misread)
  // Allow up to 5 consecutive (910000 pattern is common)
  if (/(.)\1{5,}/.test(trimmed)) {
    return false;
  }

  return true;
};

// Normalize barcode (trim, uppercase)
const normalizeBarcode = (code: string): string => {
  return code.trim().toUpperCase();
};

export default function BarcodeScanner({
  onScan,
  onManualSearch,
  cooldownMode = false,
  cooldownDuration = 2000,
  compact = false,
  locked = false,
}: BarcodeScannerProps) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // Scanner states
  const [scannerState, setScannerState] = useState<'ready' | 'scanning' | 'confirming' | 'processing' | 'cooldown'>('ready');
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [scanProgress, setScanProgress] = useState(0); // 0-100 for visual feedback

  // Refs for scan logic
  const scanBufferRef = useRef<Map<string, ScanBuffer>>(new Map());
  const isProcessingRef = useRef(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bufferCleanupRef = useRef<NodeJS.Timeout | null>(null);
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle external lock state
  useEffect(() => {
    if (locked) {
      // When locked externally, set to processing state
      if (scannerState === 'ready' || scannerState === 'scanning') {
        setScannerState('processing');
      }
    } else {
      // When unlocked, if we were in processing due to lock, go to cooldown or ready
      if (scannerState === 'processing' && !isProcessingRef.current) {
        if (cooldownMode) {
          startCooldown();
        } else {
          resetScanner();
        }
      }
    }
  }, [locked]);

  // Cleanup on unmount
  useEffect(() => {
    // Start buffer cleanup interval
    bufferCleanupRef.current = setInterval(() => {
      cleanupStaleBufferEntries();
    }, CONFIG.BUFFER_CLEANUP_INTERVAL);

    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (bufferCleanupRef.current) clearInterval(bufferCleanupRef.current);
      if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    };
  }, []);

  // Cleanup old buffer entries
  const cleanupStaleBufferEntries = useCallback(() => {
    const now = Date.now();
    const buffer = scanBufferRef.current;

    for (const [code, entry] of buffer.entries()) {
      if (now - entry.lastSeen > CONFIG.BUFFER_STALE_THRESHOLD) {
        buffer.delete(code);
      }
    }
  }, []);

  // Reset scanner to ready state
  const resetScanner = useCallback(() => {
    scanBufferRef.current.clear();
    isProcessingRef.current = false;
    setScannerState('ready');
    setConfirmedCode(null);
    setScanProgress(0);
  }, []);

  // Start cooldown period (for bulk mode)
  const startCooldown = useCallback(() => {
    if (!cooldownMode) {
      resetScanner();
      return;
    }

    setScannerState('cooldown');
    setCooldownRemaining(Math.ceil(cooldownDuration / 1000));

    countdownIntervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    cooldownTimerRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      resetScanner();
    }, cooldownDuration);
  }, [cooldownMode, cooldownDuration, resetScanner]);

  // Process confirmed barcode
  const processConfirmedBarcode = useCallback(async (code: string) => {
    setConfirmedCode(code);
    setScannerState('confirming');

    // Haptic feedback - success pattern
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Brief display of confirmed code, then process
    confirmationTimerRef.current = setTimeout(async () => {
      setScannerState('processing');

      // Await the onScan callback if it returns a promise
      try {
        await onScan(code);
      } catch (error) {
        console.error('Error in onScan callback:', error);
      }

      // Only start cooldown if not externally locked
      // If locked, the parent will unlock when ready
      if (!locked) {
        startCooldown();
      }
    }, CONFIG.CONFIRMATION_DISPLAY_TIME);
  }, [onScan, startCooldown, locked]);

  // Handle raw barcode scan from camera
  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    // Ignore if externally locked
    if (locked) {
      return;
    }

    // Ignore if not ready to scan
    if (scannerState !== 'ready' && scannerState !== 'scanning') {
      return;
    }

    if (isProcessingRef.current) {
      return;
    }

    // Normalize and validate
    const normalizedCode = normalizeBarcode(data);

    if (!isValidBarcodeFormat(normalizedCode)) {
      return; // Silently ignore invalid formats
    }

    // Update state to scanning if first valid read
    if (scannerState === 'ready') {
      setScannerState('scanning');
    }

    // Add to buffer
    const now = Date.now();
    const buffer = scanBufferRef.current;
    const existing = buffer.get(normalizedCode);

    if (existing) {
      // Update existing entry
      existing.count++;
      existing.lastSeen = now;

      // Check if within time window
      const timeElapsed = now - existing.firstSeen;

      if (timeElapsed <= CONFIG.BUFFER_WINDOW) {
        // Calculate progress based on both count and time spread
        const countProgress = existing.count / CONFIG.MIN_CONSISTENT_READS;
        const timeProgress = timeElapsed / CONFIG.MIN_TIME_SPREAD;
        const overallProgress = Math.min(countProgress, timeProgress) * 100;
        setScanProgress(Math.min(overallProgress, 100));

        // Check if we have enough consistent reads AND enough time has passed
        const hasEnoughReads = existing.count >= CONFIG.MIN_CONSISTENT_READS;
        const hasEnoughTimeSpread = timeElapsed >= CONFIG.MIN_TIME_SPREAD;

        if (hasEnoughReads && hasEnoughTimeSpread) {
          isProcessingRef.current = true;
          processConfirmedBarcode(normalizedCode);
        }
      } else {
        // Outside window, reset this entry
        buffer.set(normalizedCode, {
          code: normalizedCode,
          count: 1,
          firstSeen: now,
          lastSeen: now,
        });
        setScanProgress(0);
      }
    } else {
      // New barcode
      buffer.set(normalizedCode, {
        code: normalizedCode,
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });
      // Initial progress is minimal since we need both count and time
      setScanProgress(5);
    }
  }, [scannerState, processConfirmedBarcode, locked]);

  // Handle manual search
  const handleManualSubmit = useCallback(async () => {
    const trimmed = manualInput.trim();

    if (!trimmed) return;
    if (locked) return;
    if (scannerState === 'cooldown' || scannerState === 'processing') return;

    const normalized = normalizeBarcode(trimmed);

    if (!isValidBarcodeFormat(normalized)) {
      // For manual input, give feedback about invalid format
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setManualInput('');
    isProcessingRef.current = true;

    // Skip confirmation for manual entry - user already sees what they typed
    setScannerState('processing');
    setConfirmedCode(normalized);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (onManualSearch) {
        await onManualSearch(normalized);
      } else {
        await onScan(normalized);
      }
    } catch (error) {
      console.error('Error in manual search callback:', error);
    }

    // Only start cooldown if not externally locked
    if (!locked) {
      startCooldown();
    }
  }, [manualInput, scannerState, onManualSearch, onScan, startCooldown, locked]);

  // Permission handling
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.gray400} />
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render scan area overlay based on state
  const renderScanAreaContent = () => {
    // Show processing if externally locked
    if (locked) {
      return (
        <View style={styles.confirmedOverlay}>
          <Ionicons name="hourglass-outline" size={48} color={colors.primary} />
          <Text style={styles.confirmedLabel}>Processing...</Text>
        </View>
      );
    }

    switch (scannerState) {
      case 'confirming':
      case 'processing':
        return (
          <View style={styles.confirmedOverlay}>
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            <Text style={styles.confirmedCode}>{confirmedCode}</Text>
            <Text style={styles.confirmedLabel}>
              {scannerState === 'confirming' ? 'Scanned!' : 'Processing...'}
            </Text>
          </View>
        );

      case 'cooldown':
        return (
          <View style={styles.cooldownOverlay}>
            <View style={styles.cooldownBadge}>
              <Ionicons name="time-outline" size={24} color="#FFFFFF" />
              <Text style={styles.cooldownText}>Wait {cooldownRemaining}s</Text>
            </View>
          </View>
        );

      case 'scanning':
        return (
          <View style={styles.scanningOverlay}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${scanProgress}%` }]} />
            </View>
            <Text style={styles.scanningText}>Hold steady...</Text>
          </View>
        );

      default:
        return null;
    }
  };

  // Get status indicator config
  const getStatusConfig = () => {
    if (locked) {
      return { color: colors.warning, icon: 'hourglass-outline' as const, text: 'Processing...' };
    }

    switch (scannerState) {
      case 'ready':
        return { color: colors.success, icon: 'scan-outline' as const, text: 'Ready to scan' };
      case 'scanning':
        return { color: colors.warning, icon: 'radio-button-on' as const, text: 'Hold steady...' };
      case 'confirming':
        return { color: colors.success, icon: 'checkmark-circle' as const, text: 'Confirmed!' };
      case 'processing':
        return { color: colors.primary, icon: 'sync' as const, text: 'Processing...' };
      case 'cooldown':
        return { color: colors.warning, icon: 'hourglass-outline' as const, text: 'Move to next parcel' };
      default:
        return { color: colors.gray400, icon: 'scan-outline' as const, text: '' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'codabar', 'itf14'],
        }}
      >
        <View style={styles.overlay}>
          {/* Top section - back button and manual search (hidden in compact mode) */}
          {!compact && (
            <View style={styles.topOverlay}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.manualSearchContainer}>
                <View style={styles.searchInputWrapper}>
                  <Ionicons name="barcode-outline" size={18} color="#FFFFFF" />
                  <TextInput
                    style={styles.manualSearchInput}
                    value={manualInput}
                    onChangeText={setManualInput}
                    placeholder="Type booking number..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={handleManualSubmit}
                    editable={!locked && (scannerState === 'ready' || scannerState === 'scanning')}
                  />
                  {manualInput.length > 0 && (
                    <TouchableOpacity onPress={() => setManualInput('')}>
                      <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    (locked || !manualInput.trim() || scannerState === 'cooldown' || scannerState === 'processing') && styles.searchButtonDisabled
                  ]}
                  onPress={handleManualSubmit}
                  disabled={locked || !manualInput.trim() || scannerState === 'cooldown' || scannerState === 'processing'}
                >
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Compact mode top spacer - flex to push content to center */}
          {compact && <View style={styles.compactTopSpacer} />}

          {/* Middle section - scan area */}
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* State-based content */}
              {renderScanAreaContent()}
            </View>
            <View style={styles.sideOverlay} />
          </View>

          {/* Bottom section - status and controls */}
          {!compact ? (
            <View style={styles.bottomOverlay}>
              {/* Status indicator */}
              <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]}>
                <Ionicons name={statusConfig.icon} size={16} color="#FFFFFF" />
                <Text style={styles.statusIndicatorText}>{statusConfig.text}</Text>
              </View>

              {/* Instructions */}
              <Text style={styles.instructionText}>
                {locked && 'Please wait...'}
                {!locked && scannerState === 'ready' && 'Position barcode within frame'}
                {!locked && scannerState === 'scanning' && 'Hold steady for accurate scan'}
                {!locked && scannerState === 'confirming' && 'Barcode confirmed'}
                {!locked && scannerState === 'processing' && 'Looking up booking...'}
                {!locked && scannerState === 'cooldown' && 'Ready for next parcel soon'}
              </Text>
            </View>
          ) : (
            <View style={styles.compactBottomSpacer}>
              <View style={[styles.compactStatusIndicator, { backgroundColor: statusConfig.color }]}>
                <Ionicons name={statusConfig.icon} size={14} color="#FFFFFF" />
                <Text style={styles.compactStatusText}>{statusConfig.text}</Text>
              </View>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  compactTopSpacer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  manualSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 8,
  },
  manualSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'center',
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 240,
    height: 160,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  // Confirmed state overlay
  confirmedOverlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  confirmedCode: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 1,
  },
  confirmedLabel: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  // Cooldown overlay
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  cooldownText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Scanning state overlay
  scanningOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: layouts.spacing.xl,
  },
  compactBottomSpacer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 16,
  },
  compactStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
  },
  compactStatusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: layouts.spacing.md,
    gap: 6,
  },
  statusIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  torchButton: {
    marginBottom: layouts.spacing.lg,
    padding: layouts.spacing.md,
  },
  instructionText: {
    color: colors.background,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: layouts.spacing.xl,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: layouts.spacing.xl,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text,
    marginTop: layouts.spacing.lg,
    marginBottom: layouts.spacing.xl,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.xl,
    borderRadius: layouts.borderRadius.md,
  },
  permissionButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});