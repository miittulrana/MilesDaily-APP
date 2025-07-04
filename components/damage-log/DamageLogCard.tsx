import { Image, StyleSheet, Text, TouchableOpacity, View, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { DamageLog } from '../../utils/damageLogTypes';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { useState } from 'react';

interface DamageLogCardProps {
  damageLog: DamageLog;
  onPress?: () => void;
}

export default function DamageLogCard({ damageLog, onPress }: DamageLogCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  console.log('DamageLogCard - image_url:', damageLog.image_url);

  const getVehicleInfo = () => {
    if (!damageLog.vehicle) return 'Unknown Vehicle';
    const { license_plate, brand, model } = damageLog.vehicle;
    return `${license_plate} - ${brand} ${model}`;
  };

  const getStatusColor = () => {
    return damageLog.is_viewed ? colors.success : colors.warning;
  };

  const getStatusText = () => {
    return damageLog.is_viewed ? 'Viewed' : 'Pending Review';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  const handleImageError = (error: any) => {
    console.log('Image failed to load:', damageLog.image_url, error);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', damageLog.image_url);
    setImageError(false);
    setImageLoading(false);
  };

  const handleImagePress = () => {
    if (damageLog.image_url && !imageError) {
      setShowImageModal(true);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleText}>{getVehicleInfo()}</Text>
          <Text style={styles.dateText}>
            {formatDateTime(damageLog.created_at)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {damageLog.image_url && !imageError ? (
          <TouchableOpacity onPress={handleImagePress}>
            <Image 
              source={{ uri: damageLog.image_url }} 
              style={styles.image}
              onError={handleImageError}
              onLoad={handleImageLoad}
              resizeMode="cover"
            />
            {imageLoading && (
              <View style={styles.imageLoading}>
                <Ionicons name="image-outline" size={20} color={colors.gray400} />
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={24} color={colors.gray400} />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
        <View style={styles.remarksContainer}>
          <Text style={styles.remarksText} numberOfLines={3}>
            {damageLog.remarks}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.imageIndicator}>
          <Ionicons 
            name={damageLog.image_url && !imageError ? "image" : "image-outline"} 
            size={14} 
            color={damageLog.image_url && !imageError ? colors.success : colors.gray400} 
          />
          <Text style={[
            styles.imageIndicatorText, 
            { color: damageLog.image_url && !imageError ? colors.success : colors.gray400 }
          ]}>
            {damageLog.image_url && !imageError ? 'Photo attached' : 'No photo'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
      </View>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowImageModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.background} />
            </TouchableOpacity>
            <Image 
              source={{ uri: damageLog.image_url }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layouts.spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  dateText: {
    fontSize: 13,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: layouts.spacing.sm,
    paddingVertical: layouts.spacing.xs,
    borderRadius: layouts.borderRadius.full,
    marginLeft: layouts.spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    marginBottom: layouts.spacing.md,
  },
  image: {
    width: 80,
    height: 60,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.gray100,
    marginRight: layouts.spacing.md,
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.md,
  },
  noImageContainer: {
    width: 80,
    height: 60,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.gray100,
    marginRight: layouts.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 10,
    color: colors.gray400,
    marginTop: 2,
  },
  remarksContainer: {
    flex: 1,
  },
  remarksText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: layouts.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  imageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageIndicatorText: {
    fontSize: 12,
    marginLeft: layouts.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});