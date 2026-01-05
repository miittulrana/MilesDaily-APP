import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { CompressedImage } from '../lib/imageCompression';

interface PhotoGalleryProps {
  photos: CompressedImage[];
  onRemovePhoto?: (index: number) => void;
  readOnly?: boolean;
}

export default function PhotoGallery({ photos, onRemovePhoto, readOnly = false }: PhotoGalleryProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POD Photos ({photos.length})</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoWrapper}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            {!readOnly && onRemovePhoto && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemovePhoto(index)}
              >
                <Ionicons name="close-circle" size={28} color={colors.error} />
              </TouchableOpacity>
            )}
            <View style={styles.photoInfo}>
              <Text style={styles.photoNumber}>{index + 1}</Text>
              <Text style={styles.photoSize}>{Math.round(photo.size)}KB</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: layouts.spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  scrollContent: {
    paddingVertical: layouts.spacing.sm,
  },
  photoWrapper: {
    marginRight: layouts.spacing.md,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: layouts.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.background,
    borderRadius: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  photoNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  photoSize: {
    fontSize: 10,
    color: colors.textLight,
  },
});