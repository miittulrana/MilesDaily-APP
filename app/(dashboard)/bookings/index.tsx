import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { isBizhandleLoggedIn, getBizhandleUser, logoutFromBizhandle } from '../../../lib/bizhandleAuth';
import LoadingIndicator from '../../../components/LoadingIndicator';

export default function BookingsIndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      setLoading(true);
      const loggedIn = await isBizhandleLoggedIn();
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        const user = await getBizhandleUser();
        if (user && user.name) {
          setUserName(user.name);
        }
      } else {
        router.push('/(dashboard)/bookings/login');
      }
    } catch (error) {
      console.error('Check login status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from Bizhandle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logoutFromBizhandle();
            router.push('/(dashboard)/bookings/login');
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingIndicator fullScreen message="Loading..." />;
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {userName}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layouts.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButton: {
    padding: layouts.spacing.sm,
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
});