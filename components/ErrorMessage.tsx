import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/Colors';

type ErrorMessageProps = {
  message: string | null;
};

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: 12,
    borderRadius: 4,
    marginVertical: 12,
  },
  text: {
    color: colors.error,
    fontSize: 14,
  },
});