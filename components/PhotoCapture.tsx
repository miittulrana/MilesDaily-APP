import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { compressImage, CompressedImage } from '../lib/imageCompression';

interface PhotoCaptureProps {
  onPhotosCapture: (photos: CompressedImage[]) => void;
  maxPhotos?: number;
}

export default function PhotoCapture({ onPhotosCapture, maxPhotos = 5 }: PhotoCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<CompressedImage[]>([]);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [capturing, setCapturing] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.gray400} />
        <Text style={styles.permissionText}>Camera permission required for POD photos</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTakePhoto = async () => {
    if (!cameraRef || capturing || photos.length >= maxPhotos) return;

    try {
      setCapturing(true);
      const photo = await cameraRef.takePictureAsync({ quality: 0.8 });
      const compressed = await compressImage(photo.uri);
      
      const newPhotos = [...photos, compressed];
      setPhotos(newPhotos);
      onPhotosCapture(newPhotos);
      
      if (newPhotos.length >= maxPhotos) {
        Alert.alert('Maximum Photos', `You've captured the maximum of ${maxPhotos} photos.`);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosCapture(newPhotos);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          ref={(ref) => setCameraRef(ref)}
        >
          <View style={styles.overlay}>
            <View style={styles.topOverlay}>
              <Text style={styles.photoCount}>
                {photos.length} / {maxPhotos} photos
              </Text>
            </View>

            <View style={styles.bottomOverlay}>
              <TouchableOpacity
                style={[styles.captureButton, (capturing || photos.length >= maxPhotos) && styles.captureButtonDisabled]}
                onPress={handleTakePhoto}
                disabled={capturing || photos.length >= maxPhotos}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>

      {photos.length > 0 && (
        <View style={styles.thumbnailContainer}>
          <Text style={styles.thumbnailTitle}>Captured Photos:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
                <Text style={styles.photoSize}>{Math.round(photo.size)}KB</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCount: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottomOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: layouts.spacing.xl,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.gray400,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  thumbnailContainer: {
    padding: layouts.spacing.md,
    backgroundColor: colors.gray100,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  thumbnailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  thumbnailWrapper: {
    marginRight: layouts.spacing.md,
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  photoSize: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 4,
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