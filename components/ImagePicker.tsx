import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export type ImagePickerResult = {
  uri: string;
  fileName: string;
  type: string;
};

export const pickImageFromCamera = async (): Promise<ImagePickerResult | null> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos of washed vehicles.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      fileName: asset.fileName || `wash_${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  } catch (error) {
    console.error('Error picking image from camera:', error);
    Alert.alert('Error', 'Failed to open camera. Please try again.');
    return null;
  }
};

export const pickImageFromGallery = async (): Promise<ImagePickerResult | null> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      fileName: asset.fileName || `wash_${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  } catch (error) {
    console.error('Error picking image from gallery:', error);
    Alert.alert('Error', 'Failed to open photo library. Please try again.');
    return null;
  }
};

export const showImagePickerOptions = (): Promise<ImagePickerResult | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo of the washed vehicle',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await pickImageFromCamera();
            resolve(result);
          },
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            const result = await pickImageFromGallery();
            resolve(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ]
    );
  });
};