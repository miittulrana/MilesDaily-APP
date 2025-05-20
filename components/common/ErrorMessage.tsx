import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <Text style={styles.retryText} onPress={onRetry}>
          Tap to retry
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  text: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: Colors.primary,
    marginTop: 8,
    fontWeight: '500',
  },
});