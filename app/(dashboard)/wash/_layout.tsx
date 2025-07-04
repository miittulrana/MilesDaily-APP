import { Stack } from 'expo-router';
import { colors } from '../../../constants/Colors';

export default function WashLayout() {
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
      <Stack.Screen
        name="complete"
        options={{
          headerShown: true,
          title: 'Complete Wash',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}