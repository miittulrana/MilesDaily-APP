import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { AssignedVehicle } from '../../utils/truckLogTypes';

interface VehicleCardProps {
  vehicle: AssignedVehicle;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

export default function VehicleCard({ vehicle, selected, onSelect, disabled }: VehicleCardProps) {
  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'truck':
        return 'car-outline';
      case 'van':
        return 'bus-outline';
      case 'scooter':
        return 'bicycle-outline';
      default:
        return 'car-outline';
    }
  };

  const getStatusIcon = () => {
    if (disabled) {
      return 'lock-closed';
    }
    return vehicle.is_available ? 'checkmark-circle' : 'time';
  };

  const getStatusColor = () => {
    if (disabled) {
      return colors.error;
    }
    return vehicle.is_available ? colors.success : colors.warning;
  };

  const getStatusText = () => {
    if (disabled) {
      return 'In Use';
    }
    return vehicle.is_available ? 'Available' : 'Busy';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled
      ]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getVehicleIcon(vehicle.type)} 
            size={32} 
            color={disabled ? colors.gray400 : colors.primary} 
          />
        </View>

        <View style={styles.info}>
          <Text style={[
            styles.licensePlate,
            disabled && styles.textDisabled
          ]}>
            {vehicle.license_plate}
          </Text>
          <Text style={[
            styles.vehicleDetails,
            disabled && styles.textDisabled
          ]}>
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text style={[
            styles.vehicleType,
            disabled && styles.textDisabled
          ]}>
            {vehicle.type}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() + '20' }
          ]}>
            <Ionicons 
              name={getStatusIcon()} 
              size={14} 
              color={getStatusColor()} 
            />
            <Text style={[
              styles.statusText,
              { color: getStatusColor() }
            ]}>
              {getStatusText()}
            </Text>
          </View>

          {selected && !disabled && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            </View>
          )}
        </View>
      </View>

      {vehicle.current_session && (
        <View style={styles.currentSessionInfo}>
          <Ionicons name="person" size={14} color={colors.warning} />
          <Text style={styles.currentSessionText}>
            In use by {vehicle.current_session.driver_name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: colors.gray100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
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
  info: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  vehicleDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  vehicleType: {
    fontSize: 12,
    color: colors.textLight,
    textTransform: 'capitalize',
  },
  textDisabled: {
    color: colors.gray500,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: layouts.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layouts.spacing.xs,
    paddingHorizontal: layouts.spacing.sm,
    borderRadius: layouts.borderRadius.full,
    gap: layouts.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedIndicator: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 2,
  },
  currentSessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: layouts.spacing.md,
    paddingTop: layouts.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: layouts.spacing.sm,
  },
  currentSessionText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
});