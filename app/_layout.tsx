import '../polyfills';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function RootLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (session) {
    return <Redirect href="/(auth)/tracking" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'MilesXP Daily' }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />
    </Stack>
  );
}