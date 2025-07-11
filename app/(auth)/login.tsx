import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import ErrorMessage from '../../components/ErrorMessage';
import FormInput from '../../components/FormInput';
import LoadingIndicator from '../../components/LoadingIndicator';
import DeviceCodeSetupScreen from '../../components/DeviceCodeSetupScreen';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { signIn } from '../../lib/auth';
import { submitDeviceCode } from '../../lib/deviceCodeService';
import { hasStoredDeviceCode } from '../../lib/deviceCodeStorage';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeviceCodeSetup, setShowDeviceCodeSetup] = useState(false);
  const [pendingDriverId, setPendingDriverId] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Starting login process...');

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.log('Auth error:', authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        console.log('No user data received');
        setError('Login failed');
        setLoading(false);
        return;
      }

      console.log('Login successful, checking driver data...');

      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (driverError || !driverData) {
        console.log('Driver data error:', driverError);
        await supabase.auth.signOut();
        setError('Driver account not found');
        setLoading(false);
        return;
      }

      if (!driverData.is_active) {
        console.log('Driver inactive');
        await supabase.auth.signOut();
        setError('Your account is inactive');
        setLoading(false);
        return;
      }

      console.log('Driver found, checking device code...');

      const hasCode = await hasStoredDeviceCode(driverData.id);
      console.log('Has stored device code:', hasCode);

      if (!hasCode) {
        console.log('No device code found - showing device setup screen');
        setLoading(false);
        setPendingDriverId(driverData.id);
        setShowDeviceCodeSetup(true);
        return;
      }

      console.log('Device code found - login complete');
      router.replace('/(dashboard)');
      setLoading(false);
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleDeviceCodeSubmit = async (deviceCode: string) => {
    if (!pendingDriverId) {
      setError('Driver ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const validation = await submitDeviceCode(pendingDriverId, deviceCode);

      if (validation.is_valid) {
        const result = await signIn(email, password);

        if (result.error) {
          setError(result.error.message);
        } else {
          setShowDeviceCodeSetup(false);
          setPendingDriverId(null);
          router.replace('/(dashboard)');
        }
      } else {
        setError(validation.message);
      }
    } catch (err) {
      console.error('Device code submission error:', err);
      setError('Device code validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceCodeCancel = () => {
    setShowDeviceCodeSetup(false);
    setPendingDriverId(null);
    setError(null);
  };

  if (showDeviceCodeSetup && pendingDriverId) {
    return (
      <DeviceCodeSetupScreen
        onSubmit={handleDeviceCodeSubmit}
        onCancel={handleDeviceCodeCancel}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.gradientLight]}
        style={styles.backgroundGradient}
      />
      
      <View style={[styles.decorativeCircle, styles.circle1]} />
      <View style={[styles.decorativeCircle, styles.circle2]} />
      <View style={[styles.decorativeCircle, styles.circle3]} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={50}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formInner}>
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <View style={styles.welcomeUnderline} />
              </View>

              <ErrorMessage message={error} />

              <View style={styles.inputsContainer}>
                <FormInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  required
                />

                <FormInput
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  required
                />
              </View>

              <TouchableOpacity 
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? [colors.gray400, colors.gray500] : [colors.primary, colors.primaryDark]}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <LoadingIndicator size="small" color="#ffffff" message="" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.25,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: colors.primary,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: colors.primaryLight,
    bottom: -80,
    left: -60,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: colors.primary,
    top: '40%',
    right: -30,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: layouts.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: layouts.spacing.xxxl,
  },
  logoWrapper: {
    backgroundColor: colors.background,
    borderRadius: layouts.borderRadius.xxl,
    padding: layouts.spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 320,
    height: 140,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: layouts.borderRadius.xxl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  formInner: {
    padding: layouts.spacing.xl,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: layouts.spacing.xl,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  welcomeUnderline: {
    width: 60,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  inputsContainer: {
    marginBottom: layouts.spacing.lg,
  },
  loginButton: {
    height: 58,
    borderRadius: layouts.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});