import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/Colors';
import { layouts } from '../constants/layouts';
import { signOut } from '../lib/auth';

type HeaderProps = {
  title?: string;
  back?: boolean;
  options?: any;
};

export default function Header({ title, back, options }: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (back) {
      router.back();
    } else {
      const segments = router.pathname.split('/');
      if (segments.length > 2 || (segments.length === 2 && segments[1] !== '')) {
        router.replace('/(dashboard)');
      }
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

  // Adjust the container style to account for safe area insets
  const containerStyle = {
    ...styles.header,
    paddingTop: Math.max(insets.top, 10), // Ensure minimum padding of 10
    height: 60 + insets.top, // Adjust height based on safe area
  };

  return (
    <View style={containerStyle}>
      <View style={styles.headerContent}>
        {back ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
        
        <Text style={styles.title}>
          {title || options?.title || ''}
        </Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layouts.spacing.lg,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
  },
  logoContainer: {
    height: 40,
    width: 120,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    height: 30,
    width: 100,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
  },
});