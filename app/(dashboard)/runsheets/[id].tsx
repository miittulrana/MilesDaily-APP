import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../../../constants/Colors';
import { layouts } from '../../../constants/layouts';
import LoadingIndicator from '../../../components/LoadingIndicator';
import BookingCard from '../../../components/runsheets/BookingCard';
import AcknowledgementModal from '../../../components/runsheets/AcknowledgementModal';
import { fetchRunsheetDetail, fetchBookingStatuses } from '../../../lib/runsheetService';
import { optimizeDeliveryRoute } from '../../../lib/routeOptimization';
import { AssignedRunsheet, RunsheetBooking, BookingStatusMap } from '../../../utils/runsheetTypes';
import { isBizhandleLoggedIn } from '../../../lib/bizhandleAuth';
import { checkAcknowledgementExists, saveAcknowledgement } from '../../../lib/runsheetAcknowledgement';
import { supabase } from '../../../lib/supabase';

const geocodeCacheRef: { current: Map<string, { lat: number; lng: number }> } = { current: new Map() };

export default function RunsheetDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [runsheet, setRunsheet] = useState<AssignedRunsheet | null>(null);
    const [filteredBookings, setFilteredBookings] = useState<RunsheetBooking[]>([]);
    const [originalBookings, setOriginalBookings] = useState<RunsheetBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'city' | 'company' | 'miles_ref'>('city');
    const [isOptimized, setIsOptimized] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showAcknowledgementModal, setShowAcknowledgementModal] = useState(false);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [checkingAcknowledgement, setCheckingAcknowledgement] = useState(true);
    const [bookingStatuses, setBookingStatuses] = useState<BookingStatusMap>({});
    const [loadingStatuses, setLoadingStatuses] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        loadRunsheetDetail();
    }, [id]);

    useEffect(() => {
        if (runsheet && !isOptimized) {
            filterAndSortBookings();
        }
    }, [runsheet, searchQuery, sortBy, isOptimized]);

    const loadBookingStatuses = async (runsheetData: AssignedRunsheet) => {
        try {
            setLoadingStatuses(true);

            const bookings = runsheetData.runsheet.csv_data;

            if (bookings.length === 0) {
                return;
            }

            const originalStaffId = runsheetData.runsheet.staff_id;
            const statuses = await fetchBookingStatuses(bookings, originalStaffId);
            setBookingStatuses(statuses);
        } catch (err) {
            console.error('Error loading booking statuses:', err);
        } finally {
            setLoadingStatuses(false);
        }
    };

    const loadRunsheetDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchRunsheetDetail(id);
            setRunsheet(data);
            setOriginalBookings([...data.runsheet.csv_data]);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const acknowledged = await checkAcknowledgementExists(id, user.id);
                setIsAcknowledged(acknowledged);
                if (!acknowledged) {
                    setShowAcknowledgementModal(true);
                }
            }

            await loadBookingStatuses(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load runsheet details');
        } finally {
            setLoading(false);
            setCheckingAcknowledgement(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadRunsheetDetail();
        setRefreshing(false);
    };

    const filterAndSortBookings = () => {
        if (!runsheet) return;

        let bookings = [...originalBookings];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            bookings = bookings.filter(
                (b) =>
                    b.miles_ref.toLowerCase().includes(query) ||
                    b.hawb.toLowerCase().includes(query) ||
                    b.consignee_company.toLowerCase().includes(query) ||
                    b.consignee_name.toLowerCase().includes(query) ||
                    b.consignee_city.toLowerCase().includes(query)
            );
        }

        bookings.sort((a, b) => {
            if (sortBy === 'city') {
                return a.consignee_city.localeCompare(b.consignee_city);
            } else if (sortBy === 'company') {
                return a.consignee_company.localeCompare(b.consignee_company);
            } else {
                return a.miles_ref.localeCompare(b.miles_ref);
            }
        });

        setFilteredBookings(bookings);
    };

    const handleOptimizeToggle = async (value: boolean) => {
        if (value) {
            await optimizeRoute();
        } else {
            setIsOptimized(false);
            geocodeCacheRef.current.clear();
            filterAndSortBookings();
        }
    };

    const buildFullAddress = (booking: RunsheetBooking): string => {
        const parts = [
            booking.consignee_address,
            booking.consignee_city,
            booking.consignee_postcode,
            'Malta',
        ].filter(Boolean);
        return parts.join(', ');
    };

    const optimizeRoute = async () => {
        try {
            setIsOptimizing(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Location permission is needed to optimize your route.'
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const startLocation = {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            };

            setCurrentLocation(startLocation);

            let bookingsToOptimize = [...originalBookings];
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                bookingsToOptimize = bookingsToOptimize.filter(
                    (b) =>
                        b.miles_ref.toLowerCase().includes(query) ||
                        b.hawb.toLowerCase().includes(query) ||
                        b.consignee_company.toLowerCase().includes(query) ||
                        b.consignee_name.toLowerCase().includes(query) ||
                        b.consignee_city.toLowerCase().includes(query)
                );
            }

            const optimizedResult = await optimizeDeliveryRoute(
                bookingsToOptimize,
                startLocation
            );

            optimizedResult.waypoints.forEach((wp) => {
                if (wp.location && wp.address) {
                    geocodeCacheRef.current.set(wp.address, wp.location);
                }
            });

            optimizedResult.optimizedBookings.forEach((booking) => {
                const address = buildFullAddress(booking);
                const waypoint = optimizedResult.waypoints.find(wp => wp.address === address);
                if (waypoint && waypoint.location) {
                    geocodeCacheRef.current.set(address, waypoint.location);
                }
            });

            setFilteredBookings(optimizedResult.optimizedBookings);
            setIsOptimized(true);
        } catch (err: any) {
            console.error('Optimization error:', err);
            Alert.alert(
                'Optimization Failed',
                err.message || 'Failed to optimize route. Please try again.'
            );
            setIsOptimized(false);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleViewMap = () => {
        if (!isOptimized || filteredBookings.length === 0) {
            Alert.alert('Route Not Optimized', 'Please optimize the route first to view the map.');
            return;
        }

        const geocodedData: { [key: string]: { lat: number; lng: number } } = {};
        geocodeCacheRef.current.forEach((value, key) => {
            geocodedData[key] = value;
        });

        filteredBookings.forEach((booking) => {
            const address = buildFullAddress(booking);
            if (!geocodedData[address]) {
                const waypoint = Array.from(geocodeCacheRef.current.entries()).find(([key]) =>
                    key.includes(booking.consignee_address) || key.includes(booking.consignee_city)
                );
                if (waypoint) {
                    geocodedData[address] = waypoint[1];
                }
            }
        });

        router.push({
            pathname: '/(dashboard)/runsheets/route-map',
            params: {
                bookings: JSON.stringify(filteredBookings),
                geocodedLocations: JSON.stringify(geocodedData),
            },
        });
    };

    const handleBookingPress = async (booking: RunsheetBooking) => {
        const isLoggedIn = await isBizhandleLoggedIn();

        if (!isLoggedIn) {
            Alert.alert(
                'Bizhandle Login Required',
                'You need to login to Bizhandle to scan bookings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Login',
                        onPress: () => {
                            router.push({
                                pathname: '/(dashboard)/bookings/login',
                            });
                        },
                    },
                ]
            );
            return;
        }

        const bookingRef = (booking.customer_id === 109 || booking.customer_id === 990)
            ? booking.hawb
            : booking.miles_ref;

        router.push({
            pathname: '/(dashboard)/bookings/single-scan',
            params: { bookingRef },
        });
    };

    const handleAcknowledge = async (signature: string) => {
        if (!runsheet) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        const totalPieces = runsheet.runsheet.csv_data.reduce(
            (sum, b) => sum + parseInt(b.total_pieces || '0'),
            0
        );

        const driverName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email;

        const result = await saveAcknowledgement({
            runsheetId: id,
            driverId: user.id,
            driverName: driverName || user.email || 'Unknown Driver',
            signatureBase64: signature,
            runsheetDetails: {
                staffName: runsheet.runsheet.staff_name,
                dateFrom: runsheet.runsheet.date_from,
                dateTo: runsheet.runsheet.date_to,
                totalBookings: runsheet.runsheet.csv_data.length,
                totalPieces: totalPieces,
            }
        });

        if (result.success) {
            setIsAcknowledged(true);
            setShowAcknowledgementModal(false);
            Alert.alert('Success', 'Run-sheet acknowledged successfully!');
        } else {
            Alert.alert('Error', result.error || 'Failed to save acknowledgement');
        }
    };

    const renderBooking = ({ item, index }: { item: RunsheetBooking; index: number }) => {
        const bookingStatus = bookingStatuses[item.miles_ref];

        return (
            <BookingCard
                booking={item}
                sequenceNumber={isOptimized ? index + 1 : undefined}
                onPress={() => handleBookingPress(item)}
                currentStatus={bookingStatus}
            />
        );
    };

    if (loading || checkingAcknowledgement) {
        return <LoadingIndicator fullScreen message="Loading runsheet details..." />;
    }

    if (error || !runsheet) {
        return (
            <View style={styles.errorState}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={styles.errorTitle}>Failed to Load</Text>
                <Text style={styles.errorDescription}>{error || 'Runsheet not found'}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.compactHeader}>
                <View style={styles.optimizeRow}>
                    <Ionicons
                        name="navigate-circle"
                        size={20}
                        color={isOptimized ? colors.success : colors.gray400}
                    />
                    <Text style={styles.optimizeLabel}>Route Optimize</Text>
                    <View style={styles.switchContainer}>
                        {isOptimizing ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Switch
                                value={isOptimized}
                                onValueChange={handleOptimizeToggle}
                                trackColor={{ false: colors.gray300, true: colors.success + '80' }}
                                thumbColor={isOptimized ? colors.success : colors.gray400}
                                ios_backgroundColor={colors.gray300}
                            />
                        )}
                    </View>
                </View>

                {isOptimized && (
                    <TouchableOpacity
                        style={styles.viewMapButton}
                        onPress={handleViewMap}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="map" size={20} color={colors.background} />
                        <Text style={styles.viewMapButtonText}>View Map</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.controls}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={colors.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.gray400}
                        editable={!isOptimized}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.gray400} />
                        </TouchableOpacity>
                    )}
                </View>

                {!isOptimized && (
                    <View style={styles.sortContainer}>
                        <TouchableOpacity
                            style={[styles.sortButton, sortBy === 'city' && styles.sortButtonActive]}
                            onPress={() => setSortBy('city')}
                        >
                            <Text style={[styles.sortButtonText, sortBy === 'city' && styles.sortButtonTextActive]}>
                                City
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.sortButton, sortBy === 'company' && styles.sortButtonActive]}
                            onPress={() => setSortBy('company')}
                        >
                            <Text style={[styles.sortButtonText, sortBy === 'company' && styles.sortButtonTextActive]}>
                                Company
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.sortButton, sortBy === 'miles_ref' && styles.sortButtonActive]}
                            onPress={() => setSortBy('miles_ref')}
                        >
                            <Text style={[styles.sortButtonText, sortBy === 'miles_ref' && styles.sortButtonTextActive]}>
                                Ref
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {loadingStatuses && (
                <View style={styles.statusLoadingBanner}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.statusLoadingText}>Loading status updates...</Text>
                </View>
            )}

            <FlatList
                data={filteredBookings}
                renderItem={renderBooking}
                keyExtractor={(item, index) => `${item.miles_ref}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            />

            {runsheet && (
                <AcknowledgementModal
                    visible={showAcknowledgementModal}
                    runsheetId={id}
                    staffName={runsheet.runsheet.staff_name}
                    dateFrom={runsheet.runsheet.date_from}
                    dateTo={runsheet.runsheet.date_to}
                    totalBookings={runsheet.runsheet.csv_data.length}
                    totalPieces={runsheet.runsheet.csv_data.reduce((sum, b) => sum + parseInt(b.total_pieces || '0'), 0)}
                    onAcknowledge={handleAcknowledge}
                    onCancel={() => router.back()}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    compactHeader: {
        backgroundColor: colors.card,
        padding: layouts.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
        gap: layouts.spacing.sm,
    },
    optimizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layouts.spacing.sm,
    },
    optimizeLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    switchContainer: {
        marginLeft: layouts.spacing.sm,
    },
    viewMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: layouts.borderRadius.md,
        paddingVertical: layouts.spacing.sm,
        paddingHorizontal: layouts.spacing.lg,
        gap: layouts.spacing.xs,
    },
    viewMapButtonText: {
        color: colors.background,
        fontSize: 14,
        fontWeight: '700',
    },
    controls: {
        padding: layouts.spacing.md,
        gap: layouts.spacing.sm,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: layouts.borderRadius.md,
        paddingHorizontal: layouts.spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray200,
        gap: layouts.spacing.xs,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
    },
    sortContainer: {
        flexDirection: 'row',
        gap: layouts.spacing.xs,
    },
    sortButton: {
        flex: 1,
        paddingVertical: layouts.spacing.xs,
        paddingHorizontal: layouts.spacing.sm,
        borderRadius: layouts.borderRadius.md,
        backgroundColor: colors.gray100,
        alignItems: 'center',
    },
    sortButtonActive: {
        backgroundColor: colors.primary,
    },
    sortButtonText: {
        fontSize: 12,
        color: colors.text,
        fontWeight: '500',
    },
    sortButtonTextActive: {
        color: colors.background,
    },
    statusLoadingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.info + '15',
        paddingVertical: layouts.spacing.sm,
        gap: layouts.spacing.sm,
    },
    statusLoadingText: {
        fontSize: 12,
        color: colors.info,
        fontWeight: '500',
    },
    listContent: {
        padding: layouts.spacing.md,
    },
    errorState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: layouts.spacing.xl,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginTop: layouts.spacing.lg,
        marginBottom: layouts.spacing.sm,
    },
    errorDescription: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: layouts.spacing.xl,
    },
    backButton: {
        backgroundColor: colors.primary,
        paddingVertical: layouts.spacing.md,
        paddingHorizontal: layouts.spacing.xl,
        borderRadius: layouts.borderRadius.lg,
    },
    backButtonText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: '600',
    },
});