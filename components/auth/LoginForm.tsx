import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Colors } from '../../constants/Colors';
import supabase from '../../utils/supabase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Try normal sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If successful login, proceed
      if (data?.user) {
        console.log('Login successful, redirecting to tracking screen');
        router.replace('/(auth)/tracking');
        return;
      }

      // If error, display it
      if (signInError) {
        console.error('Login error:', signInError.message);
        setError(signInError.message);
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Login</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Button
        title={loading ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={loading}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.text,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
});