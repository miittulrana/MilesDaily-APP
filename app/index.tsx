import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  // Redirect to the appropriate screen based on authentication status
  if (session) {
    return <Redirect href="/(auth)/tracking" />;
  } else {
    return <Redirect href="/login" />;
  }
}