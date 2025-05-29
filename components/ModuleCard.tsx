import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

type ModuleCardProps = {
  title: string;
  iconName: any;
  onPress: () => void;
};

export default function ModuleCard({ title, iconName, onPress }: ModuleCardProps) {
  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.moduleIconContainer}>
        <Ionicons name={iconName} size={32} color={colors.primary} />
      </View>
      <Text style={styles.moduleTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  moduleCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.xl,
    padding: layouts.spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    aspectRatio: 1,
  },
  moduleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: layouts.borderRadius.xl,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layouts.spacing.lg,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});