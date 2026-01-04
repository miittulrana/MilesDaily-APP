import { Stack } from 'expo-router';
import { colors } from '../../../constants/Colors';
import Header from '../../../components/Header';

export default function BookingsLayout() {
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
          title: 'Bookings',
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: true,
          title: 'Bizhandle Login',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="single-scan"
        options={{
          headerShown: true,
          title: 'Single Scan',
        }}
      />
      <Stack.Screen
        name="bulk-scan"
        options={{
          headerShown: true,
          title: 'Bulk Scan',
        }}
      />
      <Stack.Screen
        name="signature"
        options={{
          headerShown: true,
          title: 'Customer Details',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}