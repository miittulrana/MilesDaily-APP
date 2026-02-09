import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import RouteMapView from '../../../components/runsheets/RouteMapView';
import { OptimizedStopData } from '../../../utils/runsheetTypes';

export default function RouteMapScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [optimizedStops, setOptimizedStops] = useState<OptimizedStopData[]>([]);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [staffName, setStaffName] = useState<string>('');
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [departureTime, setDepartureTime] = useState<string>('07:30');

    useEffect(() => {
        initializeMap();
    }, []);

    const initializeMap = async () => {
        try {
            setLoading(true);
            setError(null);

            const optimizedData = params.optimizedData ? JSON.parse(params.optimizedData as string) : [];
            const name = params.staffName as string || '';
            const distance = params.totalDistance ? parseFloat(params.totalDistance as string) : 0;
            const duration = params.totalDuration ? parseFloat(params.totalDuration as string) : 0;
            const departure = params.departureTime as string || '07:30';

            console.log('Received optimized data:', optimizedData.length, 'stops');
            console.log('First stop:', optimizedData[0]);

            setOptimizedStops(optimizedData);
            setStaffName(name);
            setTotalDistance(distance);
            setTotalDuration(duration);
            setDepartureTime(departure);

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
                <Text style={styles.loadingText}>Loading optimized route...</Text>
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

    if (optimizedStops.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No optimized route data available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <RouteMapView
                optimizedStops={optimizedStops}
                currentLocation={currentLocation}
                staffName={staffName}
                totalDistance={totalDistance}
                totalDuration={totalDuration}
                departureTime={departureTime}
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