import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';

interface GPSStatusIndicatorProps {
  isTracking: boolean;
  hasPermissions: boolean;
  isLocationEnabled: boolean;
  loading: boolean;
  error: string | null;
}

export default function GPSStatusIndicator({
  isTracking,
  hasPermissions,
  isLocationEnabled,
  loading,
  error,
}: GPSStatusIndicatorProps) {
  const getStatusColor = () => {
    if (loading) return colors.warning;
    if (error || !hasPermissions || !isLocationEnabled) return colors.error;
    if (isTracking) return colors.success;
    return colors.gray400;
  };

  const getStatusIcon = () => {
    if (loading) return 'time-outline';
    if (error || !hasPermissions || !isLocationEnabled) return 'alert-circle-outline';
    if (isTracking) return 'checkmark-circle-outline';
    return 'ellipse-outline';
  };

  const getStatusText = () => {
    if (loading) return 'Initializing Route Optimization...';
    if (error) return 'Route Optimization Error';
    if (!hasPermissions) return 'Route Optimization Permissions Required';
    if (!isLocationEnabled) return 'Location Services Disabled';
    if (isTracking) return 'Route Optimization Active';
    return 'Route Optimization Inactive';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]}>
        <Ionicons name={getStatusIcon()} size={16} color={colors.background} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <Text style={styles.subtitleText}>MXP Daily Route System</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.md,
    marginVertical: layouts.spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layouts.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.textLight,
  },
});