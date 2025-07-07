import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FormInput from './FormInput';
import LoadingIndicator from './LoadingIndicator';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface DeviceCodeModalProps {
  visible: boolean;
  onSubmit: (deviceCode: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function DeviceCodeModal({ visible, onSubmit, onCancel, loading }: DeviceCodeModalProps) {
  const [deviceCode, setDeviceCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!deviceCode.trim()) {
      setError('Please enter your device code');
      return;
    }
    
    setError(null);
    onSubmit(deviceCode.trim());
  };

  const handleCancel = () => {
    setDeviceCode('');
    setError(null);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>Device Authorization</Text>
            <Text style={styles.subtitle}>
              Enter your company-provided device code to authorize this device
            </Text>
          </View>

          <View style={styles.content}>
            <FormInput
              label="Device Code"
              placeholder="e.g., mxp.cd.001"
              value={deviceCode}
              onChangeText={setDeviceCode}
              autoCapitalize="none"
              autoCorrect={false}
              required
            />
            
            {error && (
              <Text style={styles.error}>{error}</Text>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.info} />
              <Text style={styles.infoText}>
                Contact your administrator if you don't have a device code
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? [colors.gray400, colors.gray500] : [colors.primary, colors.primaryDark]}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <LoadingIndicator size="small" color="#ffffff" message="" />
                ) : (
                  <Text style={styles.submitButtonText}>Authorize Device</Text>
                )}
              </LinearGradient>
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layouts.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
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
  error: {
    color: colors.error,
    fontSize: 14,
    marginTop: layouts.spacing.xs,
    marginBottom: layouts.spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '10',
    borderRadius: layouts.borderRadius.sm,
    padding: layouts.spacing.md,
    marginTop: layouts.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.info,
    marginLeft: layouts.spacing.sm,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: layouts.spacing.xl,
    paddingTop: 0,
    gap: layouts.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: layouts.borderRadius.lg,
    paddingVertical: layouts.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  submitButton: {
    flex: 1,
    borderRadius: layouts.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    paddingVertical: layouts.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});