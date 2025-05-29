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
        name="documents/index"
        options={{
          headerShown: true,
          title: 'Documents',
        }}
      />
      <Stack.Screen
        name="temp-assignment-documents"
        options={{
          headerShown: false,
          title: 'Temp Vehicle Documents',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="accident/index"
        options={{
          headerShown: true,
          title: 'Accident Reports',
        }}
      />
      <Stack.Screen
        name="accident/create"
        options={{
          headerShown: true,
          title: 'Start New Claim',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="accident/type-selection"
        options={{
          headerShown: true,
          title: 'Select Accident Type',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="accident/details"
        options={{
          headerShown: true,
          title: 'Accident Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="accident/photo-upload"
        options={{
          headerShown: true,
          title: 'Upload Photos',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="accident/review"
        options={{
          headerShown: true,
          title: 'Review & Submit',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}