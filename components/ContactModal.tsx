import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { CONTACT_NUMBERS } from '../utils/accidentTypes';

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ContactModal({ visible, onClose }: ContactModalProps) {
  const handleCall = async (number: string, type: string) => {
    try {
      const phoneNumber = `tel:${number}`;
      const canOpen = await Linking.canOpenURL(phoneNumber);
      
      if (canOpen) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert('Error', 'Failed to make phone call');
    }
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
            <Text style={styles.title}>Important Contact Numbers</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Your accident report has been submitted successfully. If you need immediate assistance, contact:
            </Text>

            <TouchableOpacity
              style={[styles.contactButton, styles.lesaButton]}
              onPress={() => handleCall(CONTACT_NUMBERS.LESA, 'LESA')}
              activeOpacity={0.8}
            >
              <View style={styles.contactInfo}>
                <View style={styles.contactHeader}>
                  <Ionicons name="business-outline" size={24} color={colors.info} />
                  <Text style={styles.contactTitle}>LESA</Text>
                </View>
                <Text style={styles.contactSubtitle}></Text>
                <Text style={styles.phoneNumber}>{CONTACT_NUMBERS.LESA}</Text>
              </View>
              <Ionicons name="call" size={24} color={colors.info} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactButton, styles.policeButton]}
              onPress={() => handleCall(CONTACT_NUMBERS.POLICE, 'Police')}
              activeOpacity={0.8}
            >
              <View style={styles.contactInfo}>
                <View style={styles.contactHeader}>
                  <Ionicons name="shield-outline" size={24} color={colors.error} />
                  <Text style={styles.contactTitle}>POLICE</Text>
                </View>
                <Text style={styles.contactSubtitle}></Text>
                <Text style={styles.phoneNumber}>{CONTACT_NUMBERS.POLICE}</Text>
              </View>
              <Ionicons name="call" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layouts.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: layouts.spacing.lg,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: layouts.spacing.xl,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lesaButton: {
    backgroundColor: colors.info + '10',
    borderColor: colors.info,
  },
  policeButton: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layouts.spacing.xs,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: layouts.spacing.sm,
  },
  contactSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: layouts.spacing.sm,
  },
  phoneNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  footer: {
    padding: layouts.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: layouts.spacing.md,
    paddingHorizontal: layouts.spacing.lg,
    borderRadius: layouts.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});