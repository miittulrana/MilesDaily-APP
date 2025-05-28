import { Stack } from 'expo-router';
import { colors } from '../../constants/Colors';
import Header from '../../components/Header';

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Dashboard',
        }}
      />
      <Stack.Screen
        name="fuel/index"
        options={{
          headerShown: true,
          title: 'Fuel Records',
        }}
      />
      <Stack.Screen
        name="fuel/add"
        options={{
          headerShown: true,
          title: 'Add Fuel Record',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="wash/index"
        options={{
          headerShown: true,
          title: 'Wash Schedule',
        }}
      />
      <Stack.Screen
        name="wash/complete"
        options={{
          headerShown: true,
          title: 'Complete Wash',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}