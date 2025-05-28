import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

type ModuleCardProps = {
  title: string;
  description: string;
  iconName: any;
  onPress: () => void;
};

export default function ModuleCard({ title, description, iconName, onPress }: ModuleCardProps) {
  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.moduleIconContainer}>
        <Ionicons name={iconName} size={28} color={colors.primary} />
      </View>
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  moduleCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
    width: '80%',
  },
  moduleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: layouts.borderRadius.lg,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layouts.spacing.md,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
    textAlign: 'center',
  },
  moduleDescription: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});