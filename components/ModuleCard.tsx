import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { layouts } from '../constants/layouts';

type ModuleCardProps = {
  title: string;
  description: string;
  iconName: any;
  onPress: () => void;
};

export default function ModuleCard({ title, description, iconName, onPress }: ModuleCardProps) {
  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress}>
      <View style={styles.moduleIconContainer}>
        <Ionicons name={iconName} size={24} color={colors.primary} />
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
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  moduleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: layouts.borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layouts.spacing.md,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});