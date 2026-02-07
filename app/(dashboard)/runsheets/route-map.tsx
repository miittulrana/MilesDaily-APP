import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import RouteMapView from '../../../components/runsheets/RouteMapView';
import { RunsheetBooking } from '../../../utils/runsheetTypes';

export default function RouteMapScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookings, setBookings] = useState<RunsheetBooking[]>([]);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [geocodedLocations, setGeocodedLocations] = useState<Map<string, { lat: number; lng: number }>>(new Map());

    useEffect(() => {
        initializeMap();
    }, []);

    const initializeMap = async () => {
        try {
            setLoading(true);
            setError(null);

            const bookingsData = params.bookings ? JSON.parse(params.bookings as string) : [];
            const geocodedData = params.geocodedLocations ? JSON.parse(params.geocodedLocations as string) : {};

            setBookings(bookingsData);

            const geoMap = new Map<string, { lat: number; lng: number }>();
            Object.entries(geocodedData).forEach(([key, value]) => {
                geoMap.set(key, value as { lat: number; lng: number });
            });
            setGeocodedLocations(geoMap);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            }

            setLoading(false);
        } catch (err: any) {
            console.error('Error initializing map:', err);
            setError(err.message || 'Failed to load map');
            setLoading(false);
        }
    };

    const handleClose = () => {
        router.back();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <RouteMapView
                bookings={bookings}
                currentLocation={currentLocation}
                geocodedLocations={geocodedLocations}
                onClose={handleClose}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        gap: layouts.spacing.md,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textLight,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: layouts.spacing.xl,
    },
    errorText: {
        fontSize: 16,
        color: colors.error,
        textAlign: 'center',
    },
});