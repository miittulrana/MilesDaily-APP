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
  const getIconColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'documents':
        return '#8b5cf6';
      case 'fuel':
        return '#3b82f6';
      case 'truck log':
        return '#10b981';
      case 'wash':
        return '#06b6d4';
      case 'accident':
        return '#ef4444';
      case 'damage log':
        return '#dc2626';
      case 'uniforms':
        return '#f59e0b';
      default:
        return colors.primary;
    }
  };

  const getBackgroundColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'documents':
        return '#8b5cf6' + '15';
      case 'fuel':
        return '#3b82f6' + '15';
      case 'truck log':
        return '#10b981' + '15';
      case 'wash':
        return '#06b6d4' + '15';
      case 'accident':
        return '#ef4444' + '15';
      case 'damage log':
        return '#dc2626' + '15';
      case 'uniforms':
        return '#f59e0b' + '15';
      default:
        return colors.primary + '15';
    }
  };

  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[
        styles.moduleIconContainer,
        { backgroundColor: getBackgroundColor(title) }
      ]}>
        <Ionicons 
          name={iconName} 
          size={32} 
          color={getIconColor(title)} 
        />
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