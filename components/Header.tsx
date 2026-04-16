import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { signOut } from '../lib/auth';

type HeaderProps = {
  title?: string;
  back?: boolean;
  options?: any;
  route?: any;
};

export default function Header({ title, back, options, route }: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  // Check if we're on the dashboard index (not a sub-module)
  // Dashboard is when segments is ['(dashboard)'] or route name is 'index'
  const isDashboard = route?.name === 'index' || (segments.length === 1 && segments[0] === '(dashboard)');
  const showBack = back || !isDashboard;

  const handleBack = () => {
    if (showBack) {
      router.back();
    } else {
      router.replace('/(dashboard)');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/miles.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {title || options?.title || ''}
          </Text>
        </View>

        {!showBack ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutButtonInner}>
              <Ionicons name="log-out-outline" size={22} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.logoutButtonPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layouts.spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoContainer: {
    width: 100,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    height: 20,
    width: 100,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: layouts.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonPlaceholder: {
    width: 44,
    height: 44,
  },
});