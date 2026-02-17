import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onManualSearch?: (barcode: string) => void;
  cooldownMode?: boolean;
  cooldownDuration?: number;
}

export default function BarcodeScanner({
  onScan,
  onManualSearch,
  cooldownMode = false,
  cooldownDuration = 2000,
}: BarcodeScannerProps) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const isProcessingRef = useRef(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

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

  const startCooldown = () => {
    if (!cooldownMode) return;

    setCooldownActive(true);
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
      setCooldownActive(false);
      setScanned(false);
      isProcessingRef.current = false;
      setCooldownRemaining(0);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }, cooldownDuration);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || isProcessingRef.current || cooldownActive) return;

    isProcessingRef.current = true;
    setScanned(true);

    onScan(data);

    if (cooldownMode) {
      startCooldown();
    } else {
      setTimeout(() => {
        setScanned(false);
        isProcessingRef.current = false;
      }, 2000);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim() && onManualSearch) {
      if (cooldownMode && cooldownActive) {
        return;
      }
      onManualSearch(manualInput.trim());
      setManualInput('');
      if (cooldownMode) {
        setScanned(true);
        isProcessingRef.current = true;
        startCooldown();
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
        }}
      >
        <View style={styles.overlay}>
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
                  editable={!cooldownActive}
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
                  (!manualInput.trim() || cooldownActive) && styles.searchButtonDisabled
                ]}
                onPress={handleManualSubmit}
                disabled={!manualInput.trim() || cooldownActive}
              >
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {cooldownMode && cooldownActive && (
                <View style={styles.cooldownOverlay}>
                  <View style={styles.cooldownBadge}>
                    <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.cooldownText}>Wait {cooldownRemaining}s</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={styles.sideOverlay} />
          </View>

          <View style={styles.bottomOverlay}>
            {cooldownMode && (
              <View style={[
                styles.statusIndicator,
                cooldownActive ? styles.statusIndicatorBusy : styles.statusIndicatorReady
              ]}>
                <Ionicons
                  name={cooldownActive ? "hourglass-outline" : "checkmark-circle"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.statusIndicatorText}>
                  {cooldownActive ? 'Processing...' : 'Ready to scan'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.torchButton}
              onPress={() => setTorchOn(!torchOn)}
            >
              <Ionicons
                name={torchOn ? 'flashlight' : 'flashlight-outline'}
                size={32}
                color={colors.background}
              />
            </TouchableOpacity>
            <Text style={styles.instructionText}>
              {cooldownMode
                ? (cooldownActive
                  ? 'Move to next parcel...'
                  : 'Position barcode within frame to scan')
                : 'Position barcode within frame to scan'
              }
            </Text>
          </View>
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
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
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
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: layouts.spacing.xl,
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
  statusIndicatorReady: {
    backgroundColor: colors.success,
  },
  statusIndicatorBusy: {
    backgroundColor: colors.warning,
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