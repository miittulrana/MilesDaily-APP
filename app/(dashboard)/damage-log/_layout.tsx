import { Stack } from 'expo-router';
import { colors } from '../../../constants/Colors';

export default function DamageLogLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
    </Stack>
  );
}