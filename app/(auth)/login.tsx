import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../components/ErrorMessage';
import FormInput from '../../components/FormInput';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors } from '../../constants/Colors';
import { layouts } from '../../constants/layouts';
import { signIn } from '../../lib/auth';
import { LocationTaskManager } from '../../lib/locationTaskManager';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error.message);
      } else {
        setTimeout(async () => {
          await LocationTaskManager.startLocationTracking();
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={50}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Driver App</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.description}>
            Use your driver account credentials to sign in
          </Text>

          <ErrorMessage message={error} />

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

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <LoadingIndicator size="small" color="#ffffff" message="" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: layouts.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: layouts.spacing.xxl,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: layouts.spacing.md,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textLight,
    marginTop: layouts.spacing.xs,
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: layouts.spacing.lg,
  },
  loginButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: layouts.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: layouts.spacing.md,
  },
  loginButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});