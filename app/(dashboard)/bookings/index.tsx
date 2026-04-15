import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import {
  isBizhandleLoggedIn,
  getBizhandleUser,
  logoutFromBizhandle,
} from '../../../lib/bizhandleAuth';
import { initRemoteConfig } from '../../../lib/remoteConfig';
import LoadingIndicator from '../../../components/LoadingIndicator';

export default function BookingsIndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [configInitialized, setConfigInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);

      await initRemoteConfig();
      setConfigInitialized(true);

      await checkLoginStatus();
    } catch (error) {
      console.error('App initialization error:', error);
      await checkLoginStatus();
    }
  };

  const checkLoginStatus = async () => {
    try {
      const loggedIn = await isBizhandleLoggedIn();
      setIsLoggedIn(loggedIn);

      if (!loggedIn) {
        router.push('/(dashboard)/bookings/login');
      }
    } catch (error) {
      console.error('Check login status error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Initializing..." />;
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/(dashboard)/bookings/single-scan')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="scan-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.moduleTitle}>Single Scan</Text>
          <Text style={styles.moduleDescription}>Scan one barcode at a time</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/(dashboard)/bookings/bulk-scan')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="scan-circle-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.moduleTitle}>Bulk Scan</Text>
          <Text style={styles.moduleDescription}>Scan multiple barcodes</Text>
        </TouchableOpacity>
      </View>

      {!configInitialized && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={styles.offlineBannerText}>Using offline configuration</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: layouts.spacing.lg,
    gap: layouts.spacing.lg,
  },
  moduleCard: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: layouts.borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layouts.spacing.md,
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.xs,
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    padding: layouts.spacing.sm,
    gap: layouts.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f59e0b',
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
});