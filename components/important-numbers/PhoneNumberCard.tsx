import { StyleSheet, Text, TouchableOpacity, View, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { ImportantPhoneNumber } from '../../utils/importantNumbersTypes';

interface PhoneNumberCardProps {
  phoneNumber: ImportantPhoneNumber;
}

export default function PhoneNumberCard({ phoneNumber }: PhoneNumberCardProps) {
  const handleCall = async () => {
    try {
      // Clean phone number - remove spaces, dashes, parentheses
      const cleanNumber = phoneNumber.phone_number.replace(/[\s\-\(\)]/g, '');
      const phoneUrl = `tel:${cleanNumber}`;

      // Just try to open - canOpenURL is unreliable for tel: links on Android
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert(
        'Cannot Make Call',
        `Unable to call ${phoneNumber.phone_number}. You can copy the number and dial manually.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleCall}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="call" size={24} color={colors.primary} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.name}>{phoneNumber.name}</Text>
          <Text style={styles.phoneNumber}>{phoneNumber.phone_number}</Text>
          {phoneNumber.description && (
            <Text style={styles.description}>{phoneNumber.description}</Text>
          )}
        </View>

        <View style={styles.callButton}>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layouts.spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: layouts.borderRadius.xl,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layouts.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: 'monospace',
    marginBottom: layouts.spacing.xs,
  },
  description: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  callButton: {
    padding: layouts.spacing.sm,
  },
});