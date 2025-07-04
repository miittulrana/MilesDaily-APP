import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/Colors';

type LoadingIndicatorProps = {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
};

export default function LoadingIndicator({
  size = 'large',
  color = colors.primary,
  message = 'Loading...',
  fullScreen = false,
}: LoadingIndicatorProps) {
  const containerStyle = fullScreen ? styles.fullScreen : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  message: {
    marginTop: 10,
    color: colors.textLight,
    fontSize: 14,
  },
});