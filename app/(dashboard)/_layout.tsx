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
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen
        name="fuel/index"
        options={{
          title: 'Fuel Records',
        }}
      />
      <Stack.Screen
        name="fuel/add"
        options={{
          title: 'Add Fuel Record',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}