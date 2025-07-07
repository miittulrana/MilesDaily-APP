import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FormInput from './FormInput';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface DeviceCodeSetupScreenProps {
  onSubmit: (deviceCode: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export default function DeviceCodeSetupScreen({ 
  onSubmit, 
  onCancel, 
  loading, 
  error 
}: DeviceCodeSetupScreenProps) {
  const [deviceCode, setDeviceCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!deviceCode.trim()) {
      setLocalError('Please enter your device code');
      return;
    }
    
    setLocalError(null);
    onSubmit(deviceCode.trim());
  };

  const displayError = error || localError;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.gradientLight]}
        style={styles.backgroundGradient}
      />
      
      <View style={[styles.decorativeCircle, styles.circle1]} />
      <View style={[styles.decorativeCircle, styles.circle2]} />
      <View style={[styles.decorativeCircle, styles.circle3]} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={50}
      >
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

          <View style={styles.setupContainer}>
            <View style={styles.setupInner}>
              <View style={styles.headerSection}>
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
                </View>
                <Text style={styles.title}>Device Authorization Required</Text>
                <Text style={styles.subtitle}>
                  Enter your company-provided device code to complete setup
                </Text>
              </View>

              <ErrorMessage message={displayError} />

              <View style={styles.inputContainer}>
                <FormInput
                  label="Device Code"
                  placeholder="Enter device code"
                  value={deviceCode}
                  onChangeText={setDeviceCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  required
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={colors.info} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>One-Time Setup</Text>
                  <Text style={styles.infoText}>
                    This code will be saved securely and you won't need to enter it again
                  </Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? [colors.gray400, colors.gray500] : [colors.primary, colors.primaryDark]}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <LoadingIndicator size="small" color="#ffffff" message="" />
                    ) : (
                      <Text style={styles.submitButtonText}>Authorize Device</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={onCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.25,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: colors.primary,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: colors.primaryLight,
    bottom: -80,
    left: -60,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: colors.primary,
    top: '40%',
    right: -30,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: layouts.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: layouts.spacing.xl,
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
  setupContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: layouts.borderRadius.xxl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  setupInner: {
    padding: layouts.spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: layouts.spacing.xl,
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
  inputContainer: {
    marginBottom: layouts.spacing.lg,
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
  buttonContainer: {
    gap: layouts.spacing.md,
  },
  submitButton: {
    height: 58,
    borderRadius: layouts.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelButton: {
    height: 48,
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});