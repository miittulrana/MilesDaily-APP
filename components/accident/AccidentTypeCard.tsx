import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';

interface AccidentTypeCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  selected?: boolean;
}

export default function AccidentTypeCard({
  title,
  description,
  icon,
  color,
  onPress,
  selected = false
}: AccidentTypeCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        { borderColor: selected ? color : colors.gray200 }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: selected ? color : colors.gray400 }]}>
          {icon}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: selected ? color : colors.text }
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.description,
          { color: selected ? colors.text : colors.textLight }
        ]}>
          {description}
        </Text>
      </View>
      {selected && (
        <View style={[styles.checkmark, { backgroundColor: color }]}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    marginBottom: layouts.spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSelected: {
    backgroundColor: colors.background,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layouts.spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: layouts.spacing.xs,
    color: colors.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textLight,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: layouts.spacing.sm,
  },
  checkmarkText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
});