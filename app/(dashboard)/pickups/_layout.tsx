import { Stack } from 'expo-router';
import { colors } from '../../../constants/Colors';

export default function PickupsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="history" />
            <Stack.Screen name="detail" />
        </Stack>
    );
}