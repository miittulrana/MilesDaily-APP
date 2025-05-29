import { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { resizeImage } from '../../utils/cameraUtils';

type ImageUploadProps = {
  onImageSelected: (imageUri: string) => void;
  currentImage?: string | null;
  disabled?: boolean;
};

export default function ImageUpload({
  onImageSelected,
  currentImage,
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to upload images.'
      );
      return false;
    }
    return true;
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add the image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage }
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      setUploading(true);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const resizedUri = await resizeImage(result.assets[0].uri);
        onImageSelected(resizedUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      setUploading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const resizedUri = await resizeImage(result.assets[0].uri);
        onImageSelected(resizedUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onImageSelected('') }
      ]
    );
  };

  if (currentImage) {
    return (
      <View style={styles.imageContainer}>
        <Image source={{ uri: currentImage }} style={styles.selectedImage} />
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={showImageOptions}
            disabled={disabled || uploading}
          >
            <Ionicons name="camera-outline" size={16} color={colors.primary} />
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={removeImage}
            disabled={disabled || uploading}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.uploadButton,
        disabled && styles.uploadButtonDisabled
      ]}
      onPress={showImageOptions}
      disabled={disabled || uploading}
    >
      <Ionicons 
        name="camera-outline" 
        size={32} 
        color={disabled ? colors.gray400 : colors.primary} 
      />
      <Text style={[
        styles.uploadButtonText,
        disabled && styles.uploadButtonTextDisabled
      ]}>
        {uploading ? 'Processing...' : 'Add Photo'}
      </Text>
      <Text style={[
        styles.uploadButtonSubtext,
        disabled && styles.uploadButtonTextDisabled
      ]}>
        Take a photo or choose from library
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.md,
  },
  imageActions: {
    flexDirection: 'row',
    gap: layouts.spacing.md,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: layouts.spacing.xs,
  },
  changeButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingVertical: layouts.spacing.sm,
    paddingHorizontal: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    gap: layouts.spacing.xs,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: layouts.borderRadius.lg,
    paddingVertical: layouts.spacing.xl,
    paddingHorizontal: layouts.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadButtonDisabled: {
    borderColor: colors.gray300,
    backgroundColor: colors.gray50,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: layouts.spacing.sm,
  },
  uploadButtonTextDisabled: {
    color: colors.gray400,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: layouts.spacing.xs,
    textAlign: 'center',
  },
});