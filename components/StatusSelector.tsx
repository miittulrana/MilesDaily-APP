import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { Status } from '../lib/bizhandleTypes';

interface StatusSelectorProps {
  statuses: Status[];
  onSelect: (status: Status) => void;
}

export default function StatusSelector({ statuses, onSelect }: StatusSelectorProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (status: Status) => {
    setSelectedId(status.status_id);
    onSelect(status);
  };

  const renderItem = ({ item }: { item: Status }) => {
    const isSelected = selectedId === item.status_id;
    
    return (
      <TouchableOpacity
        style={[styles.statusCard, isSelected && styles.statusCardSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.statusContent}>
          <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
            <Ionicons
              name={getStatusIcon(item.name)}
              size={24}
              color={isSelected ? colors.background : colors.primary}
            />
          </View>
          <Text style={[styles.statusText, isSelected && styles.statusTextSelected]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.need_customer_confirmation && (
            <View style={styles.badge}>
              <Ionicons name="document-text-outline" size={12} color={colors.background} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={statuses}
      renderItem={renderItem}
      keyExtractor={(item) => item.status_id.toString()}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
    />
  );
}

const getStatusIcon = (statusName: string): any => {
  const name = statusName.toLowerCase();
  
  if (name.includes('deliver')) return 'checkmark-circle-outline';
  if (name.includes('fail')) return 'close-circle-outline';
  if (name.includes('return')) return 'return-up-back-outline';
  if (name.includes('out')) return 'car-outline';
  if (name.includes('collect')) return 'cube-outline';
  
  return 'ellipse-outline';
};

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    marginBottom: layouts.spacing.md,
  },
  statusCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.md,
    padding: layouts.spacing.md,
    marginHorizontal: layouts.spacing.xs,
    borderWidth: 2,
    borderColor: colors.gray200,
    minHeight: 100,
  },
  statusCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  statusContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: layouts.borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layouts.spacing.sm,
  },
  iconContainerSelected: {
    backgroundColor: colors.background,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  statusTextSelected: {
    color: colors.background,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.info,
    borderRadius: layouts.borderRadius.full,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});