import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ErrorMessage from '../../../components/ErrorMessage';
import FormInput from '../../../components/FormInput';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import { loginToBizhandle } from '../../../lib/bizhandleAuth';

export default function BizhandleLoginScreen() {
  const router = useRouter();
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

      const result = await loginToBizhandle(email, password);

      if (!result.success) {
        setError(result.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.replace('/(dashboard)/bookings');
      setLoading(false);
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Bizhandle Login</Text>
          <Text style={styles.subtitle}>
            Enter your Bizhandle credentials to access booking scans
          </Text>
        </View>

        <View style={styles.formContainer}>
          <ErrorMessage message={error} />

          <View style={styles.inputsContainer}>
            <FormInput
              label="Email"
              placeholder="Enter your Bizhandle email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              required
            />

            <FormInput
              label="Password"
              placeholder="Enter your Bizhandle password"
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
              colors={
                loading
                  ? [colors.gray400, colors.gray500]
                  : [colors.primary, colors.primaryDark]
              }
              style={styles.loginButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <LoadingIndicator size="small" color="#ffffff" message="" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.note}>
            Note: This is a one-time login. You won't be asked again unless you logout.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: layouts.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: layouts.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: layouts.borderRadius.lg,
    padding: layouts.spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputsContainer: {
    marginBottom: layouts.spacing.lg,
  },
  loginButton: {
    height: 56,
    borderRadius: layouts.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: layouts.spacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
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
  },
  note: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});