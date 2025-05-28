import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface CameraResult {
  uri: string;
  base64?: string;
  size: number;
}

export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted';
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
};

export const takePicture = async (): Promise<CameraResult | null> => {
  try {
    const hasPermissions = await requestCameraPermissions();
    
    if (!hasPermissions) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera permissions to take wash completion photos.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [4, 3],
      allowsEditing: true,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    
    if (!asset.uri) {
      throw new Error('No image URI received');
    }

    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    const fileSizeMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;
    
    if (fileSizeMB > 5) {
      Alert.alert(
        'Image Too Large',
        'Please take a smaller image (under 5MB).',
        [{ text: 'OK' }]
      );
      return null;
    }

    return {
      uri: asset.uri,
      base64: asset.base64,
      size: fileInfo.size || 0,
    };
  } catch (error) {
    console.error('Error taking picture:', error);
    Alert.alert(
      'Camera Error',
      'Failed to take picture. Please try again.',
      [{ text: 'OK' }]
    );
    return null;
  }
};

export const selectFromGallery = async (): Promise<CameraResult | null> => {
  try {
    const hasPermissions = await requestCameraPermissions();
    
    if (!hasPermissions) {
      Alert.alert(
        'Media Library Permission Required',
        'Please enable media library permissions to select wash completion photos.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [4, 3],
      allowsEditing: true,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    
    if (!asset.uri) {
      throw new Error('No image URI received');
    }

    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    const fileSizeMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;
    
    if (fileSizeMB > 5) {
      Alert.alert(
        'Image Too Large',
        'Please select a smaller image (under 5MB).',
        [{ text: 'OK' }]
      );
      return null;
    }

    return {
      uri: asset.uri,
      base64: asset.base64,
      size: fileInfo.size || 0,
    };
  } catch (error) {
    console.error('Error selecting from gallery:', error);
    Alert.alert(
      'Gallery Error',
      'Failed to select image. Please try again.',
      [{ text: 'OK' }]
    );
    return null;
  }
};

export const resizeImageIfNeeded = async (uri: string): Promise<string> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const fileSizeMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;
    
    if (fileSizeMB <= 5) {
      return uri;
    }

    const manipulatedImage = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
    });

    if (!manipulatedImage.canceled && manipulatedImage.assets[0]) {
      return manipulatedImage.assets[0].uri;
    }
    
    return uri;
  } catch (error) {
    console.error('Error resizing image:', error);
    return uri;
  }
};