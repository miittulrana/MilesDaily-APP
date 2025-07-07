import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface DeviceValidationScreenProps {
  message?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

export default function DeviceValidationScreen({ 
  message = "Kindly login on Company's Device only",
  onRetry,
  onContactSupport 
}: DeviceValidationScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.gradientLight]}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="shield-checkmark-outline" size={64} color={colors.error} />
            </View>
          </View>

          <Text style={styles.title}>Device Not Authorized</Text>
          
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color={colors.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Security Notice</Text>
              <Text style={styles.infoText}>
                For security reasons, you can only access this app from authorized company devices. 
                Please contact your administrator to register this device.
              </Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}

            {onContactSupport && (
              <TouchableOpacity style={styles.supportButton} onPress={onContactSupport}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.supportButtonGradient}
                >
                  <Ionicons name="call-outline" size={20} color={colors.background} />
                  <Text style={styles.supportButtonText}>Contact Support</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: layouts.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: layouts.spacing.xxxl,
  },
  logoWrapper: {
    backgroundColor: colors.background,
    borderRadius: layouts.borderRadius.xxl,
    padding: layouts.spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 280,
    height: 120,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: layouts.borderRadius.xxl,
    padding: layouts.spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: layouts.spacing.xl,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.error + '30',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error,
    marginBottom: layouts.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: layouts.spacing.xl,
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    marginBottom: layouts.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoContent: {
    flex: 1,
    marginLeft: layouts.spacing.sm,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
    marginBottom: layouts.spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  actionsContainer: {
    width: '100%',
    gap: layouts.spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: layouts.borderRadius.lg,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    gap: layouts.spacing.sm,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  supportButton: {
    borderRadius: layouts.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  supportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    gap: layouts.spacing.sm,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});