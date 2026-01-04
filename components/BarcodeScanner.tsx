import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onManualSearch?: (barcode: string) => void;
}

export default function BarcodeScanner({ onScan, onManualSearch }: BarcodeScannerProps) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualInput, setManualInput] = useState('');

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

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    onScan(data);
    
    setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim() && onManualSearch) {
      onManualSearch(manualInput.trim());
      setManualInput('');
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
          {/* Top overlay with back button and manual search */}
          <View style={styles.topOverlay}>
            {/* Back button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Manual search */}
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
                />
                {manualInput.length > 0 && (
                  <TouchableOpacity onPress={() => setManualInput('')}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.searchButton, !manualInput.trim() && styles.searchButtonDisabled]}
                onPress={handleManualSubmit}
                disabled={!manualInput.trim()}
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
            </View>
            <View style={styles.sideOverlay} />
          </View>

          <View style={styles.bottomOverlay}>
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
              Position barcode within frame to scan
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
    paddingTop: 60, // Account for notch
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
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: layouts.spacing.xl,
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