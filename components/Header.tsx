import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handleBack = () => {
    if (back) {
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
    <View style={styles.header}>
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
  );
}

const styles = StyleSheet.create({
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layouts.spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
  },
  logoContainer: {
    height: 50,
    width: 120,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    height: 40,
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