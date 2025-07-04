import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { ImageType } from '../../utils/accidentTypes';

interface PhotoCaptureProps {
  imageType: ImageType;
  title: string;
  description?: string;
  maxImages?: number;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export default function PhotoCapture({
  imageType,
  title,
  description,
  maxImages = 1,
  images,
  onImagesChange
}: PhotoCaptureProps) {
  const [uploading, setUploading] = useState(false);

  const getMaxImages = () => {
    if (imageType === 'form1' || imageType === 'form2') {
      return 1;
    }
    return maxImages;
  };

  const getEffectiveMaxImages = () => {
    if (imageType === 'form1' || imageType === 'form2') {
      return 1;
    } else if (imageType === 'accident_photo') {
      return 10;
    }
    return maxImages;
  };

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraPermission.status === 'granted' && libraryPermission.status === 'granted';
  };

  const showImageOptions = () => {
    const effectiveMaxImages = getEffectiveMaxImages();
    
    if (images.length >= effectiveMaxImages) {
      Alert.alert(
        'Maximum Images Reached',
        `You can only upload ${effectiveMaxImages} image(s) for ${title}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Select Image',
      'Choose how you want to add the image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage }
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Camera and photo library permissions are required.',
          [{ text: 'OK' }]
        );
        return;
      }

      setUploading(true);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        onImagesChange(newImages);
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
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required.',
          [{ text: 'OK' }]
        );
        return;
      }

      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        onImagesChange(newImages);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== index);
            onImagesChange(newImages);
          }
        }
      ]
    );
  };

  const effectiveMaxImages = getEffectiveMaxImages();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.counter}>
          {images.length}/{effectiveMaxImages}
        </Text>
      </View>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {images.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[
          styles.addButton,
          images.length >= effectiveMaxImages && styles.addButtonDisabled
        ]}
        onPress={showImageOptions}
        disabled={uploading || images.length >= effectiveMaxImages}
      >
        <Ionicons 
          name="camera-outline" 
          size={24} 
          color={images.length >= effectiveMaxImages ? colors.gray400 : colors.primary} 
        />
        <Text style={[
          styles.addButtonText,
          images.length >= effectiveMaxImages && styles.addButtonTextDisabled
        ]}>
          {uploading ? 'Processing...' : images.length === 0 ? 'Add Photo' : 'Add Another'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: layouts.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  counter: {
    fontSize: 14,
    color: colors.textLight,
    backgroundColor: colors.gray100,
    paddingHorizontal: layouts.spacing.sm,
    paddingVertical: layouts.spacing.xs,
    borderRadius: layouts.borderRadius.sm,
  },
  description: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: layouts.spacing.md,
    lineHeight: 16,
  },
  imagesContainer: {
    marginBottom: layouts.spacing.md,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: layouts.spacing.md,
  },
  image: {
    width: 120,
    height: 90,
    borderRadius: layouts.borderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  addButton: {
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: layouts.borderRadius.lg,
    paddingVertical: layouts.spacing.lg,
    paddingHorizontal: layouts.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  addButtonDisabled: {
    borderColor: colors.gray300,
    backgroundColor: colors.gray50,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginTop: layouts.spacing.sm,
  },
  addButtonTextDisabled: {
    color: colors.gray400,
  },
});