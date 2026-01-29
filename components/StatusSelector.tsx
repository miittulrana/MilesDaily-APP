import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { Status } from '../lib/bizhandleTypes';
import { DriverType, getStatusesForDriverTypes, isWarehouseScanStatus } from '../lib/statusPermissions';
import { checkWarehouseLocation } from '../lib/geofenceService';

const DELIVERED_STATUS_ID = 10;

interface StatusSelectorProps {
  statuses: Status[];
  driverTypes?: DriverType[];
  currentStatusId?: number;
  onSelect: (status: Status) => void;
}

export default function StatusSelector({ statuses, driverTypes = [], currentStatusId, onSelect }: StatusSelectorProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);

  const allowedStatusIds = getStatusesForDriverTypes(driverTypes);

  const filteredStatuses = driverTypes.length > 0
    ? statuses.filter(status => allowedStatusIds.includes(status.status_id))
    : statuses;

  const isAlreadyDelivered = currentStatusId === DELIVERED_STATUS_ID;

  const handleSelect = async (status: Status) => {
    if (isAlreadyDelivered) {
      Alert.alert(
        'Already Delivered',
        'This booking has already been delivered. No further status changes are allowed.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isWarehouseScanStatus(status.status_id)) {
      setCheckingLocation(true);

      try {
        const result = await checkWarehouseLocation(status.status_id);

        if (!result.allowed) {
          Alert.alert(
            'Location Required',
            result.error || 'You are not in the warehouse at the moment, kindly scan in the warehouse, it will work',
            [{ text: 'OK' }]
          );
          setCheckingLocation(false);
          return;
        }
      } catch (error) {
        console.error('Warehouse location check error:', error);
        Alert.alert(
          'Location Error',
          'Unable to verify your location. Please ensure location services are enabled.',
          [{ text: 'OK' }]
        );
        setCheckingLocation(false);
        return;
      }

      setCheckingLocation(false);
    }

    setSelectedId(status.status_id);
    onSelect(status);
  };

  const renderItem = ({ item }: { item: Status }) => {
    const isSelected = selectedId === item.status_id;
    const isWarehouseScan = isWarehouseScanStatus(item.status_id);
    const isDisabled = isAlreadyDelivered;

    return (
      <TouchableOpacity
        style={[
          styles.statusCard,
          isSelected && styles.statusCardSelected,
          isDisabled && styles.statusCardDisabled
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
        disabled={checkingLocation}
      >
        <View style={styles.statusContent}>
          <View style={[
            styles.iconContainer,
            isSelected && styles.iconContainerSelected,
            isDisabled && styles.iconContainerDisabled
          ]}>
            <Ionicons
              name={getStatusIcon(item.name)}
              size={24}
              color={isDisabled ? colors.gray400 : (isSelected ? colors.background : colors.primary)}
            />
          </View>
          <Text style={[
            styles.statusText,
            isSelected && styles.statusTextSelected,
            isDisabled && styles.statusTextDisabled
          ]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.need_customer_confirmation && (
            <View style={[styles.badge, isDisabled && styles.badgeDisabled]}>
              <Ionicons name="document-text-outline" size={12} color={colors.background} />
            </View>
          )}
          {isWarehouseScan && (
            <View style={[styles.geofenceBadge, isDisabled && styles.badgeDisabled]}>
              <Ionicons name="location" size={12} color={colors.background} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (checkingLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking your location...</Text>
      </View>
    );
  }

  if (filteredStatuses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.gray400} />
        <Text style={styles.emptyText}>No statuses available for your driver type</Text>
      </View>
    );
  }

  return (
    <View>
      {isAlreadyDelivered && (
        <View style={styles.deliveredBanner}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.deliveredBannerText}>
            This booking has already been delivered. No further changes allowed.
          </Text>
        </View>
      )}
      <FlatList
        data={filteredStatuses}
        renderItem={renderItem}
        keyExtractor={(item) => item.status_id.toString()}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const getStatusIcon = (statusName: string): any => {
  const name = statusName.toLowerCase();

  if (name.includes('deliver')) return 'checkmark-circle-outline';
  if (name.includes('fail')) return 'close-circle-outline';
  if (name.includes('return')) return 'return-up-back-outline';
  if (name.includes('out')) return 'car-outline';
  if (name.includes('collect')) return 'cube-outline';
  if (name.includes('warehouse')) return 'business-outline';
  if (name.includes('pick')) return 'hand-left-outline';
  if (name.includes('hold')) return 'pause-circle-outline';
  if (name.includes('reschedul')) return 'calendar-outline';
  if (name.includes('refused')) return 'ban-outline';
  if (name.includes('cod') || name.includes('cash')) return 'cash-outline';
  if (name.includes('message') || name.includes('note')) return 'document-text-outline';
  if (name.includes('contact') || name.includes('details')) return 'call-outline';
  if (name.includes('moved')) return 'arrow-forward-outline';
  if (name.includes('closed')) return 'lock-closed-outline';
  if (name.includes('wrong') || name.includes('packaging')) return 'warning-outline';
  if (name.includes('received') || name.includes('facility')) return 'home-outline';

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
  statusCardDisabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray300,
    opacity: 0.6,
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
  iconContainerDisabled: {
    backgroundColor: colors.gray200,
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
  statusTextDisabled: {
    color: colors.gray400,
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
  geofenceBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: colors.warning,
    borderRadius: layouts.borderRadius.full,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDisabled: {
    backgroundColor: colors.gray400,
  },
  loadingContainer: {
    padding: layouts.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: layouts.spacing.md,
    fontSize: 14,
    color: colors.textLight,
  },
  emptyContainer: {
    padding: layouts.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: layouts.spacing.md,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: layouts.spacing.md,
    borderRadius: layouts.borderRadius.md,
    marginBottom: layouts.spacing.md,
    gap: layouts.spacing.sm,
    borderWidth: 1,
    borderColor: colors.success,
  },
  deliveredBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
});