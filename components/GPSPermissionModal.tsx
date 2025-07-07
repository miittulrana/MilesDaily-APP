import React from 'react';
import { 
  Modal, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert,
  Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface GPSPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
  hasLocationServices: boolean;
}

export default function GPSPermissionModal({
  visible,
  onClose,
  onRetry,
  hasLocationServices,
}: GPSPermissionModalProps) {
  const handleOpenSettings = () => {
    Alert.alert(
      'Open Settings',
      'Please enable location permissions for MXP Daily in device settings to use route optimization.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings() 
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Route Optimization Setup</Text>
            <Text style={styles.subtitle}>
              MXP Daily requires location access to optimize your delivery routes
            </Text>
          </View>

          <View style={styles.content}>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="navigate-outline" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Optimize delivery routes</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Track delivery times</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="analytics-outline" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Improve efficiency</Text>
              </View>
            </View>

            {!hasLocationServices && (
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                <Text style={styles.warningText}>
                  Location services are disabled. Please enable them in device settings.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={hasLocationServices ? onRetry : handleOpenSettings}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {hasLocationServices ? 'Enable Route Optimization' : 'Open Settings'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layouts.spacing.lg,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: layouts.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    padding: layouts.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layouts.spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    padding: layouts.spacing.xl,
  },
  featureList: {
    marginBottom: layouts.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: layouts.spacing.sm,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: layouts.spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    padding: layouts.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  primaryButton: {
    height: 50,
    borderRadius: layouts.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: layouts.spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 44,
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
});